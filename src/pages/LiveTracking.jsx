import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateVehicleTelemetry } from '../utils/telemetryService';
import FleetMap from '../components/tracking/FleetMap';
import FleetSidebar from '../components/tracking/FleetSidebar';
import TelemetryDrawer from '../components/tracking/TelemetryDrawer';
import {
  Radio,
  Truck,
  Gauge,
  Fuel,
  AlertTriangle,
  Locate,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

export default function LiveTracking() {
  const { vehicles, trips, users, user } = useApp();

  // Tick timer for smooth vehicle simulation (advances time seed every 2.5s)
  const [timeSeed, setTimeSeed] = useState(Date.now());
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [followMode, setFollowMode] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(null);

  const drivers = useMemo(() => users.filter(u => u.role === 'driver'), [users]);
  const isDriver = user?.role === 'driver';

  // Find driver's assigned vehicle if logged in as driver
  const driverVehicle = useMemo(() => {
    if (!isDriver) return null;
    return vehicles.find(v => v.assigned_driver_id === user?.id) || vehicles[0];
  }, [vehicles, user, isDriver]);

  // Set default selected vehicle on mount
  useEffect(() => {
    if (isDriver && driverVehicle) {
      setSelectedVehicleId(driverVehicle.id);
      setFollowMode(true);
    } else if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [isDriver, driverVehicle, vehicles, selectedVehicleId]);

  // Advance simulation clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSeed(prev => prev + 2500);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Compute live telemetry for all fleet vehicles
  const telemetryList = useMemo(() => {
    return vehicles.map(v => {
      const activeTrip = trips.find(t => t.vehicle_id === v.id && t.status === 'in_progress');
      return generateVehicleTelemetry(v, activeTrip, timeSeed);
    });
  }, [vehicles, trips, timeSeed]);

  // Selected truck telemetry
  const selectedTelemetry = useMemo(() => {
    return telemetryList.find(t => t.vehicleId === selectedVehicleId) || null;
  }, [telemetryList, selectedVehicleId]);

  const selectedDriver = useMemo(() => {
    if (!selectedTelemetry?.assignedDriverId) return null;
    return users.find(u => u.id === selectedTelemetry.assignedDriverId);
  }, [selectedTelemetry, users]);

  // Global fleet counts
  const fleetMetrics = useMemo(() => {
    const total = telemetryList.length;
    const moving = telemetryList.filter(t => t.speed > 0).length;
    const laden = telemetryList.filter(t => t.operationStatus === 'laden').length;
    const overspeed = telemetryList.filter(t => t.isOverspeeding).length;
    const lowFuel = telemetryList.filter(t => t.isLowFuel).length;
    return { total, moving, laden, overspeed, lowFuel };
  }, [telemetryList]);

  return (
    <div className="space-y-4">
      {/* Page Header Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-lime-400 text-teal-950 flex items-center gap-1.5">
              <Radio size={13} className="animate-pulse" /> Live Telemetry Radar
            </span>
            <span className="text-xs text-on-surface-variant font-medium">• East Africa Northern Corridor</span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-teal-950 dark:text-teal-50 tracking-tight">
            Live Fleet Tracking & Telematics
          </h1>
          <p className="text-sm text-on-surface-variant font-body">
            Real-time GPS tracking along Mombasa–Nairobi–Malaba corridors, operational load status, live speedometers, and trip history playback.
          </p>
        </div>

        {/* Fleet Metric Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs flex items-center gap-2 shadow-xs">
            <Truck size={16} className="text-teal-700" />
            <span className="text-on-surface-variant">Fleet Moving:</span>
            <span className="font-extrabold text-teal-950 dark:text-teal-50">{fleetMetrics.moving} / {fleetMetrics.total}</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs flex items-center gap-2 shadow-xs">
            <Package size={16} className="text-emerald-600" />
            <span className="text-on-surface-variant">Laden (On Work):</span>
            <span className="font-extrabold text-emerald-700">{fleetMetrics.laden}</span>
          </div>

          {fleetMetrics.overspeed > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs flex items-center gap-2 text-red-700 font-bold animate-pulse shadow-xs">
              <AlertTriangle size={16} />
              <span>{fleetMetrics.overspeed} Speed Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Driver Focused View Mode */}
      {isDriver && selectedTelemetry && (
        <div className="p-4 rounded-2xl bg-teal-950 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lime-400 text-teal-950 flex items-center justify-center font-black text-xl">
              <Truck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-headline font-black text-lime-400">{selectedTelemetry.registration}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-800 text-teal-200">
                  {selectedTelemetry.operationStatus === 'laden' ? 'Laden (On Work)' : 'Empty / Deadhead'}
                </span>
              </div>
              <p className="text-xs text-teal-200/90 font-medium">
                Route: {selectedTelemetry.originName} → {selectedTelemetry.destinationName} • Current: {selectedTelemetry.nearestMilestone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-xs text-teal-300">Live Speed</div>
              <div className={`text-2xl font-headline font-black ${selectedTelemetry.isOverspeeding ? 'text-red-400 animate-pulse' : 'text-lime-400'}`}>
                {selectedTelemetry.speed} kph
              </div>
            </div>
            <div className="h-8 w-px bg-teal-800" />
            <div>
              <div className="text-xs text-teal-300">Fuel Tank</div>
              <div className="text-2xl font-headline font-black text-sky-300">
                {selectedTelemetry.fuelPercent}%
              </div>
            </div>
            <div className="h-8 w-px bg-teal-800" />
            <div>
              <div className="text-xs text-teal-300">Corridor ETA</div>
              <div className="text-2xl font-headline font-black text-white">
                {selectedTelemetry.eta}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split-Screen Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-4 relative">
        {/* Left: Interactive Fleet Panel (Hidden for Driver to maintain clean focus) */}
        {!isDriver && (
          <FleetSidebar
            telemetryList={telemetryList}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={id => {
              setSelectedVehicleId(id);
              setPlaybackPosition(null);
            }}
            drivers={drivers}
          />
        )}

        {/* Right: Map & Telemetry Bottom Dock Column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Interactive Map with adaptive height */}
          <div
            className={`w-full transition-all duration-300 relative ${
              selectedTelemetry ? 'h-[520px]' : 'h-[740px]'
            }`}
          >
            <FleetMap
              telemetryList={telemetryList}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={id => {
                setSelectedVehicleId(id);
                setPlaybackPosition(null);
              }}
              followMode={followMode}
              onToggleFollowMode={() => setFollowMode(!followMode)}
              playbackPosition={playbackPosition}
            />
          </div>

          {/* In-Flow Dark Mode Telemetry Bottom Dock */}
          {selectedTelemetry && (
            <TelemetryDrawer
              telemetry={selectedTelemetry}
              driver={selectedDriver}
              onClose={() => setSelectedVehicleId(null)}
              onPlaybackChange={pos => setPlaybackPosition(pos)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
