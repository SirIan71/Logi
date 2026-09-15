import { useState, useMemo } from 'react';
import {
  Search,
  Truck,
  Gauge,
  Fuel,
  AlertTriangle,
  ChevronRight,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import { searchFilter } from '../../utils/helpers';

export default function FleetSidebar({
  telemetryList = [],
  selectedVehicleId = null,
  onSelectVehicle,
  drivers = [],
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'laden' | 'empty' | 'idle' | 'maintenance'
  const [search, setSearch] = useState('');

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: telemetryList.length,
      laden: telemetryList.filter(t => t.operationStatus === 'laden').length,
      empty: telemetryList.filter(t => t.operationStatus === 'empty').length,
      idle: telemetryList.filter(t => t.operationStatus === 'idle').length,
      maintenance: telemetryList.filter(t => t.operationStatus === 'maintenance').length,
      overspeed: telemetryList.filter(t => t.isOverspeeding).length,
    };
  }, [telemetryList]);

  // Filtered list
  const filteredList = useMemo(() => {
    let list = telemetryList;
    if (filter === 'laden') list = list.filter(t => t.operationStatus === 'laden');
    else if (filter === 'empty') list = list.filter(t => t.operationStatus === 'empty');
    else if (filter === 'idle') list = list.filter(t => t.operationStatus === 'idle');
    else if (filter === 'maintenance') list = list.filter(t => t.operationStatus === 'maintenance');

    return searchFilter(list, search, [
      'registration',
      'make',
      'model',
      'cargoDescription',
      'nearestMilestone',
      'corridorName',
    ]);
  }, [telemetryList, filter, search]);

  // Active alerts list
  const activeAlerts = useMemo(() => {
    const alerts = [];
    telemetryList.forEach(t => {
      if (t.isOverspeeding) {
        alerts.push({
          id: `spd_${t.vehicleId}`,
          vehicleId: t.vehicleId,
          type: 'danger',
          message: `${t.registration} exceeding limit (${t.speed} kph near ${t.nearestMilestone})`,
        });
      }
      if (t.isLowFuel) {
        alerts.push({
          id: `fuel_${t.vehicleId}`,
          vehicleId: t.vehicleId,
          type: 'warning',
          message: `${t.registration} low fuel (${t.fuelPercent}% remaining)`,
        });
      }
    });
    return alerts;
  }, [telemetryList]);

  return (
    <div className="w-full lg:w-96 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xs flex flex-col h-[760px] overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-outline-variant/20 bg-slate-50/50 dark:bg-teal-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-headline font-black text-teal-950 dark:text-teal-50">Active Fleet</h3>
              <p className="text-[11px] text-on-surface-variant">{counts.all} Commercial Trucks Monitored</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Telemetry
          </span>
        </div>

        {/* Search Bar */}
        <div className="search-input w-full">
          <Search size={15} />
          <input
            placeholder="Search registration, driver, corridor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Operational Status Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'laden', label: `On Work (${counts.laden})` },
            { id: 'empty', label: `Empty (${counts.empty})` },
            { id: 'idle', label: `Idle (${counts.idle})` },
            { id: 'maintenance', label: `Service (${counts.maintenance})` },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === btn.id
                  ? 'bg-lime-400 text-teal-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-teal-950/60 text-on-surface-variant hover:text-teal-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Alerts Ticker */}
      {activeAlerts.length > 0 && (
        <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-red-700 dark:text-red-300 uppercase tracking-wider">
            <AlertTriangle size={13} /> Active Compliance Alerts ({activeAlerts.length})
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {activeAlerts.map(alt => (
              <div
                key={alt.id}
                onClick={() => onSelectVehicle?.(alt.vehicleId)}
                className="text-[11px] font-semibold text-red-800 dark:text-red-200 cursor-pointer hover:underline flex items-center justify-between"
              >
                <span className="truncate">{alt.message}</span>
                <ChevronRight size={12} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-outline text-xs italic">
            No trucks found matching "{search}" in {filter} status.
          </div>
        ) : (
          filteredList.map(t => {
            const isSelected = t.vehicleId === selectedVehicleId;
            const driver = drivers.find(d => d.id === t.assignedDriverId);

            return (
              <div
                key={t.vehicleId}
                onClick={() => onSelectVehicle?.(t.vehicleId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-lime-500 bg-lime-50/40 dark:bg-teal-900/50 shadow-md ring-2 ring-lime-400/40'
                    : 'border-outline-variant/30 bg-surface-container-lowest hover:border-slate-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-headline font-black text-teal-950 dark:text-teal-50">
                        {t.registration}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          t.operationStatus === 'laden'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.operationStatus === 'empty'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : t.operationStatus === 'idle'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {t.operationStatus === 'laden'
                          ? 'Laden'
                          : t.operationStatus === 'empty'
                          ? 'Empty'
                          : t.operationStatus === 'idle'
                          ? 'Idle'
                          : 'Maintenance'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">{t.make} {t.model}</p>
                  </div>

                  {/* Speed Badge */}
                  <div className="text-right">
                    <span
                      className={`text-sm font-headline font-black ${
                        t.isOverspeeding ? 'text-red-600 animate-pulse' : 'text-teal-950 dark:text-teal-50'
                      }`}
                    >
                      {t.speed} kph
                    </span>
                    <div className="text-[10px] text-outline font-semibold">Speed</div>
                  </div>
                </div>

                {/* Corridor & Milestone */}
                <div className="text-xs text-teal-800 dark:text-teal-200 font-semibold mb-2 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  <span className="truncate">{t.nearestMilestone}</span>
                </div>

                {/* Fuel & Driver Footer */}
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span className="flex items-center gap-1 font-medium truncate max-w-[140px]">
                    Driver: <strong>{driver ? (driver.name || driver.first_name) : 'Unassigned'}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-sky-700 dark:text-sky-300">
                    <Fuel size={12} /> {t.fuelPercent}% ({t.fuelLiters}L)
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
