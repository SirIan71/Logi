import { useState, useEffect, useRef } from 'react';
import {
  X,
  Gauge,
  Fuel,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Phone,
  User,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Truck,
  Activity,
} from 'lucide-react';
import { interpolateCoordinate } from '../../utils/telemetryService';

export default function TelemetryDrawer({
  telemetry,
  driver,
  onClose,
  onPlaybackChange, // callback sending [lat, lng] to map during scrubber playback
}) {
  if (!telemetry) return null;

  // Collapsed vs Expanded dock toggle (default collapsed as requested)
  const [isExpanded, setIsExpanded] = useState(false);

  // Playback Scrubber State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(telemetry.progressPercent || 50);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x
  const playbackTimerRef = useRef(null);

  // Sync initial progress when truck changes
  useEffect(() => {
    setPlaybackProgress(telemetry.progressPercent || 50);
    setIsPlaying(false);
  }, [telemetry.vehicleId]);

  // Handle Playback Animation Loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= telemetry.progressPercent) {
            setIsPlaying(false);
            return telemetry.progressPercent;
          }
          const next = Math.min(prev + 1 * playbackSpeed, telemetry.progressPercent);
          // Notify map of updated coordinates
          if (telemetry.polyline) {
            const coords = interpolateCoordinate(telemetry.polyline, next);
            onPlaybackChange?.(coords);
          }
          return next;
        });
      }, 200);
    } else {
      clearInterval(playbackTimerRef.current);
    }
    return () => clearInterval(playbackTimerRef.current);
  }, [isPlaying, playbackSpeed, telemetry, onPlaybackChange]);

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setPlaybackProgress(val);
    if (telemetry.polyline) {
      const coords = interpolateCoordinate(telemetry.polyline, val);
      onPlaybackChange?.(coords);
    }
  };

  const handleResetPlayback = () => {
    setPlaybackProgress(telemetry.progressPercent);
    setIsPlaying(false);
    onPlaybackChange?.(null); // Return to live position
  };

  const isScrubbingPast = playbackProgress < telemetry.progressPercent - 1;

  return (
    <div className="w-full bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      {/* NTSA Overspeed Alert Banner (Always visible if violating) */}
      {telemetry.isOverspeeding && (
        <div className="px-4 py-2 bg-red-600/90 text-white text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>NTSA OVER-SPEED ALERT: {telemetry.speed} km/h (Limit: 80 km/h)</span>
          </div>
          <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono">VIOLATION</span>
        </div>
      )}

      {/* Primary Collapsed Dock Ribbon */}
      <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95">
        {/* Truck Identifier & Status */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-10 h-10 rounded-xl bg-teal-800/60 border border-teal-700/50 text-lime-300 flex items-center justify-center font-black">
            <Truck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-headline font-black text-white tracking-tight">
                {telemetry.registration}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  telemetry.operationStatus === 'laden'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : telemetry.operationStatus === 'empty'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : telemetry.operationStatus === 'idle'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}
              >
                {telemetry.operationStatus === 'laden'
                  ? 'Laden'
                  : telemetry.operationStatus === 'empty'
                  ? 'Empty'
                  : telemetry.operationStatus === 'idle'
                  ? 'Idle'
                  : 'Maintenance'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
              {telemetry.make} {telemetry.model} • {telemetry.nearestMilestone}
            </p>
          </div>
        </div>

        {/* Assigned Driver & Call */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="w-7 h-7 rounded-full bg-teal-900/60 text-lime-300 flex items-center justify-center">
            <User size={14} />
          </div>
          <div className="text-xs">
            <span className="text-[10px] text-slate-400 block leading-tight">Driver</span>
            <span className="font-bold text-white leading-tight">
              {driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || driver.name : 'Unassigned'}
            </span>
          </div>
          {driver?.phone && (
            <a
              href={`tel:${driver.phone}`}
              className="ml-1 p-1.5 rounded-lg bg-lime-400 text-teal-950 hover:bg-lime-300 transition-all shadow-xs"
              title="Call Driver"
            >
              <Phone size={12} />
            </a>
          )}
        </div>

        {/* Speedometer Gauge */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <Gauge size={16} className={telemetry.isOverspeeding ? 'text-red-400 animate-pulse' : 'text-lime-400'} />
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-headline font-black ${
                telemetry.isOverspeeding ? 'text-red-400 animate-pulse' : 'text-lime-400'
              }`}>
                {telemetry.speed}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">km/h</span>
            </div>
            <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden mt-0.5">
              <div
                className={`h-full ${telemetry.isOverspeeding ? 'bg-red-500' : 'bg-lime-400'}`}
                style={{ width: `${Math.min(100, (telemetry.speed / 100) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">NTSA 80</span>
        </div>

        {/* Fuel Tank Level */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <Fuel size={16} className={telemetry.isLowFuel ? 'text-red-400' : 'text-sky-400'} />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-headline font-black text-sky-400">
                {telemetry.fuelPercent}%
              </span>
              <span className="text-[10px] text-slate-400">({telemetry.fuelLiters}L)</span>
            </div>
            <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden mt-0.5">
              <div
                className={`h-full ${telemetry.isLowFuel ? 'bg-red-500' : 'bg-sky-400'}`}
                style={{ width: `${telemetry.fuelPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Operational Cargo (User requested in collapsed bar) */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 max-w-[240px]">
          <Package size={16} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {telemetry.cargoWeightTons > 0 ? `${telemetry.cargoWeightTons}T` : 'Deadhead'}
              </span>
              <span className="text-[11px] text-emerald-300 font-medium truncate">
                {telemetry.cargoDescription}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {telemetry.clientName}
            </div>
          </div>
        </div>

        {/* Corridor ETA */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <Clock size={16} className="text-lime-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block leading-tight">ETA</span>
            <span className="text-xs font-bold text-lime-300 leading-tight">
              {telemetry.eta}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded">
            {telemetry.progressPercent}%
          </span>
        </div>

        {/* Action Buttons: Expand Toggle & Close */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isExpanded
                ? 'bg-lime-400 text-teal-950 border-lime-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <span>{isExpanded ? 'Hide Details' : 'Sensors & Replay'}</span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <button
            type="button"
            onClick={() => {
              onPlaybackChange?.(null);
              onClose?.();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Deselect Vehicle"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Multi-Column Cockpit Deck */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Column 1: Interactive Trip History Playback Scrubber */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-lime-500/30 flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sliders size={15} className="text-lime-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
                  Trip History Playback Scrubber
                </span>
              </div>
              {isScrubbingPast && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-bold">
                  Replaying History
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 leading-tight">
              Replay the truck's trajectory along the Mombasa–Malaba corridor:
            </p>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={telemetry.progressPercent}
                value={playbackProgress}
                onChange={handleSliderChange}
                className="w-full accent-lime-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% ({telemetry.originName})</span>
                <span className="font-bold text-lime-300">{Math.round(playbackProgress)}%</span>
                <span>{telemetry.progressPercent}% (Current)</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-between items-center pt-1 border-t border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-7 h-7 rounded-lg bg-lime-400 text-teal-950 font-bold flex items-center justify-center hover:bg-lime-300 active:scale-95 transition-all shadow-sm"
                  title={isPlaying ? 'Pause Replay' : 'Play Replay'}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleResetPlayback}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs flex items-center gap-1"
                  title="Return to live position"
                >
                  <RotateCcw size={12} />
                  <span>Live</span>
                </button>
              </div>

              {/* Speed Multipliers */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                {[1, 2, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      playbackSpeed === s ? 'bg-lime-400 text-teal-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Diagnostics & Telemetry Sensors */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Radio size={14} className="text-purple-400" /> Engine Diagnostics
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                telemetry.engine.status === 'Running' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {telemetry.engine.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 block">Engine RPM</span>
                <span className="font-bold text-white font-mono text-sm">{telemetry.engine.rpm}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 block">Coolant Temp</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{telemetry.engine.coolantTempC}°C</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 block">Battery</span>
                <span className="font-bold text-white font-mono text-sm">{telemetry.engine.batteryVoltage}V</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-700/60">
              <span className="flex items-center gap-1">
                <Activity size={12} className="text-lime-400" /> Sensor Stream: Active
              </span>
              <span>CanBUS / OBD-II</span>
            </div>
          </div>

          {/* Column 3: Route Times, Milestones & Range */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-lime-400" /> Corridor Milestones & Range
              </span>
              <span className="text-xs font-mono text-lime-400 font-bold">{telemetry.progressPercent}% Completed</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">Departure</span>
                <span className="font-bold text-white">{telemetry.departureTime}</span>
                <div className="text-[9px] text-slate-400">({telemetry.elapsedHours} hrs driving)</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">Dynamic ETA</span>
                <span className="font-bold text-lime-300">{telemetry.eta}</span>
                <div className="text-[9px] text-slate-400">({telemetry.distanceRemainingKm} km remaining)</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-700/60">
              <span>Burn Rate: <strong className="text-white">{telemetry.burnRate} L/100km</strong></span>
              <span>Range: <strong className="text-white">{telemetry.estimatedRangeKm} km</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
