import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  searchFilter,
  exportToCSV,
} from '../utils/helpers';
import {
  STANDARD_SERVICE_CATALOG,
  calculateVehicleHealth,
  findNextOptimalNonWorkingDay,
  generateFleetMaintenanceRoadmap,
} from '../utils/maintenanceAlgorithm';
import AudioEvidenceRecorder from '../components/common/AudioEvidenceRecorder';
import PhotoEvidenceUploader from '../components/common/PhotoEvidenceUploader';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { workshops as defaultWorkshops } from '../data/seedData';
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  Search,
  Download,
  Filter,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  Truck,
  UserCheck,
  Building2,
  Volume2,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  XCircle,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function Maintenance() {
  const {
    vehicles,
    trips,
    fuelRecords,
    maintenance,
    vehicleDocuments,
    users,
    workshops: contextWorkshops = [],
    user,
    addItem,
    updateItem,
    deleteItem,
    submitRepairRequest,
    approveMaintenanceByOps,
    approveMaintenanceByAdmin,
    rejectMaintenance,
    startMaintenance,
    completeMaintenance,
    lookup,
  } = useApp();

  const workshops = (contextWorkshops && contextWorkshops.length > 0) ? contextWorkshops : defaultWorkshops;

  // Active tab state: 'overview' | 'pipeline' | 'routine_compliance' | 'workshops' | 'history' | 'finance'
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'report_repair' | 'ops_review' | 'admin_review' | 'complete_job' | 'view_record' | 'add_workshop'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});

  // Driver role check
  const isDriver = user?.role === 'driver';
  const isOps = user?.role === 'operations' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isFinance = user?.role === 'finance' || user?.role === 'admin';

  // Driver assigned vehicle
  const driverVehicle = useMemo(() => {
    if (!isDriver) return null;
    return vehicles.find(v => v.assigned_driver_id === user?.id);
  }, [vehicles, user, isDriver]);

  // Run Fleet-Wide Maintenance & Peak Performance Algorithm
  const fleetRoadmap = useMemo(() => {
    return generateFleetMaintenanceRoadmap(vehicles, trips, fuelRecords, maintenance, vehicleDocuments);
  }, [vehicles, trips, fuelRecords, maintenance, vehicleDocuments]);

  // Filtered maintenance records
  const filteredMaintenance = useMemo(() => {
    let list = [...maintenance];
    if (isDriver && driverVehicle) {
      list = list.filter(m => m.vehicle_id === driverVehicle.id);
    } else if (selectedVehicleFilter !== 'all') {
      list = list.filter(m => m.vehicle_id === selectedVehicleFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(m => (m.status || 'completed') === statusFilter);
    }
    return searchFilter(list, search, ['service_type', 'description', 'vendor', 'mechanic_name', 'non_working_day_type'])
      .sort((a, b) => new Date(b.created_at || b.service_date || 0) - new Date(a.created_at || a.service_date || 0));
  }, [maintenance, search, selectedVehicleFilter, statusFilter, isDriver, driverVehicle]);

  // Approval Pipeline Groups
  const pipeline = useMemo(() => {
    const pendingOps = maintenance.filter(m => m.status === 'pending_ops');
    const pendingAdmin = maintenance.filter(m => m.status === 'pending_admin');
    const approvedScheduled = maintenance.filter(m => m.status === 'approved_scheduled');
    const inProgress = maintenance.filter(m => m.status === 'in_progress');
    const completed = maintenance.filter(m => m.status === 'completed' || !m.status);
    const rejected = maintenance.filter(m => m.status === 'rejected');

    return { pendingOps, pendingAdmin, approvedScheduled, inProgress, completed, rejected };
  }, [maintenance]);

  // ── Open Modals ─────────────────────────────────────────────────────────────
  const openReportRepairModal = (preselectedVehicleId = null) => {
    const defaultVehicle = preselectedVehicleId || (isDriver ? driverVehicle?.id : vehicles[0]?.id);
    setFormData({
      vehicle_id: defaultVehicle || '',
      type: 'repair',
      service_type: 'Unscheduled Mechanical Repair',
      priority: 'high',
      description: '',
      expected_cost: 15000,
      evidence_photos: [],
      evidence_audio: null,
    });
    setModal('report_repair');
  };

  const openOpsReviewModal = (record) => {
    setSelectedRecord(record);
    // Find optimal non-working day using scheduling algorithm
    const optimalSlot = findNextOptimalNonWorkingDay(record.vehicle_id, trips, {
      urgency: record.priority || 'high',
    });

    const defaultWorkshop = workshops[0] || { id: 'w1', name: 'Scania East Africa Ltd (Baba Dogo)', lead_mechanic_name: 'Juma Mwangi', lead_mechanic_phone: '+254 711 029 000' };

    setFormData({
      expected_cost: record.expected_cost || 18000,
      scheduled_date: record.scheduled_date || optimalSlot.optimalDate,
      is_non_working_day: true,
      non_working_day_type: optimalSlot.dayType,
      workshop_id: record.workshop_id || defaultWorkshop.id,
      vendor: record.vendor || defaultWorkshop.name,
      mechanic_name: record.mechanic_name || defaultWorkshop.lead_mechanic_name || 'Chief Commercial Mechanic',
      mechanic_phone: record.mechanic_phone || defaultWorkshop.lead_mechanic_phone || '+254 700 000 000',
      ops_notes: `Inspected audio memo & fault images. Confirmed zero trip conflict for ${optimalSlot.dayType}.`,
    });
    setModal('ops_review');
  };

  const openAdminReviewModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      scheduled_date: record.scheduled_date,
      expected_cost: record.expected_cost,
      admin_notes: 'Budget allocation authorized. Repair confirmed on non-working day.',
    });
    setModal('admin_review');
  };

  const openCompleteModal = (record) => {
    setSelectedRecord(record);
    const vehicle = lookup('vehicles', record.vehicle_id);
    setFormData({
      cost: record.expected_cost || 20000,
      parts_cost: Math.round((record.expected_cost || 20000) * 0.65),
      labor_cost: Math.round((record.expected_cost || 20000) * 0.35),
      odometer_at_service: vehicle?.current_odometer || 250000,
      next_due_km: (vehicle?.current_odometer || 250000) + 15000,
      next_due_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      service_date: new Date().toISOString().split('T')[0],
      notes: 'Work completed by certified lead mechanic. Road test certified fit.',
    });
    setModal('complete_job');
  };

  const openViewRecordModal = (record) => {
    setSelectedRecord(record);
    setModal('view_record');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedRecord(null);
    setFormData({});
  };

  // ── Form Handlers ───────────────────────────────────────────────────────────
  const handleSaveRepairRequest = async () => {
    if (!formData.vehicle_id) return alert('Please select a vehicle');
    if (!formData.description) return alert('Please describe the fault or symptom');

    await submitRepairRequest({
      ...formData,
      expected_cost: Number(formData.expected_cost) || 0,
      status: 'pending_ops',
    });
    closeModal();
  };

  const handleOpsApproval = async () => {
    if (!selectedRecord) return;
    await approveMaintenanceByOps(selectedRecord.id, {
      ...formData,
      expected_cost: Number(formData.expected_cost) || 0,
      is_non_working_day: true,
    });
    closeModal();
  };

  const handleAdminApproval = async () => {
    if (!selectedRecord) return;
    await approveMaintenanceByAdmin(selectedRecord.id, {
      ...formData,
      is_non_working_day: true,
    });
    closeModal();
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejecting this maintenance request:');
    if (!reason) return;
    await rejectMaintenance(selectedRecord.id, reason);
    closeModal();
  };

  const handleCompleteService = async () => {
    if (!selectedRecord) return;
    await completeMaintenance(selectedRecord.id, {
      ...formData,
      cost: Number(formData.cost) || 0,
      parts_cost: Number(formData.parts_cost) || 0,
      labor_cost: Number(formData.labor_cost) || 0,
      odometer_at_service: Number(formData.odometer_at_service) || 0,
      next_due_km: Number(formData.next_due_km) || 0,
    });
    closeModal();
  };

  // 1-Click Routine Scheduler
  const handleOneClickScheduleRoutine = (vehicleId, serviceItem) => {
    const optimalSlot = findNextOptimalNonWorkingDay(vehicleId, trips, { urgency: 'medium' });
    const workshop = workshops[0] || { name: 'Scania East Africa Ltd (Baba Dogo)', lead_mechanic_name: 'Juma Mwangi', lead_mechanic_phone: '+254 711 029 000' };

    setFormData({
      vehicle_id: vehicleId,
      type: serviceItem.category === 'compliance' ? 'compliance' : 'routine',
      service_type: serviceItem.name,
      description: serviceItem.description,
      priority: serviceItem.isOverdue ? 'critical' : 'medium',
      expected_cost: serviceItem.expectedCost || 12000,
      scheduled_date: optimalSlot.optimalDate,
      is_non_working_day: true,
      non_working_day_type: optimalSlot.dayType,
      vendor: workshop.name,
      mechanic_name: workshop.lead_mechanic_name || 'Certified Fleet Technician',
      mechanic_phone: workshop.lead_mechanic_phone || '+254 711 000 000',
      compliance_category: serviceItem.complianceCategory || null,
      evidence_photos: [],
      evidence_audio: null,
    });
    setModal('report_repair');
  };

  // Export CSV
  const handleExportHistory = () => {
    const cols = [
      { label: 'ID', accessor: r => r.id },
      { label: 'Vehicle', accessor: r => lookup('vehicles', r.vehicle_id)?.registration || '—' },
      { label: 'Type', accessor: r => r.type },
      { label: 'Service', accessor: r => r.service_type },
      { label: 'Status', accessor: r => r.status || 'completed' },
      { label: 'Scheduled Date', accessor: r => r.scheduled_date || '—' },
      { label: 'Non-Working Day', accessor: r => r.non_working_day_type || (r.is_non_working_day ? 'Yes' : 'No') },
      { label: 'Workshop', accessor: r => r.vendor || '—' },
      { label: 'Mechanic', accessor: r => r.mechanic_name || '—' },
      { label: 'Expected (KES)', accessor: r => r.expected_cost || 0 },
      { label: 'Actual Cost (KES)', accessor: r => r.cost || 0 },
      { label: 'Service Date', accessor: r => r.service_date || '—' },
    ];
    exportToCSV(filteredMaintenance, 'truck_repair_history', cols);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-lime-400 text-teal-950">
              Kenya Fleet Compliance & Operations
            </span>
            <span className="text-xs text-on-surface-variant">• Optimal Non-Working Day Scheduling</span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-teal-950 dark:text-teal-50 tracking-tight">
            Vehicle Maintenance & Health Engine
          </h1>
          <p className="text-sm text-on-surface-variant font-body">
            Predictive scheduling algorithm, multi-stage approval workflow (Driver → Ops → Admin), Kenya statutory compliance, and truck repair ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openReportRepairModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 text-teal-950 font-bold text-sm hover:bg-lime-300 active:scale-98 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>Schedule Repair / Report Fault</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
              <TrendingUp size={18} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {fleetRoadmap.peakCount} Peak Trucks
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Fleet Peak Readiness</p>
          <div className="text-2xl font-headline font-black text-teal-950 dark:text-teal-50 mt-0.5">
            {fleetRoadmap.averageHealth}%
          </div>
          <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80 mt-1">Algorithm health index</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Clock size={18} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {pipeline.pendingOps.length} Ops / {pipeline.pendingAdmin.length} Admin
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Approval Sequence</p>
          <div className="text-2xl font-headline font-black text-amber-600 mt-0.5">
            {pipeline.pendingOps.length + pipeline.pendingAdmin.length} Pending
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Requires manager review</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Calendar size={18} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              0 Downtime Loss
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Non-Working Day Jobs</p>
          <div className="text-2xl font-headline font-black text-sky-600 mt-0.5">
            {pipeline.approvedScheduled.length} Scheduled
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Assigned to rest/depot days</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <DollarSign size={18} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Finance Pipeline
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Approved Commitments</p>
          <div className="text-xl font-headline font-black text-emerald-600 mt-0.5">
            {formatCurrency(fleetRoadmap.finance.committedBudget)}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Forecasted maintenance cashflow</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <ShieldCheck size={18} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              NTSA / Safety
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Kenya Compliance</p>
          <div className="text-2xl font-headline font-black text-purple-600 mt-0.5">
            {fleetRoadmap.warningCount + fleetRoadmap.criticalCount > 0 ? `${fleetRoadmap.criticalCount} Critical` : '100% Valid'}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Speed limiter & NTSA inspection</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Fleet Health & Scheduling', icon: Wrench },
          { id: 'pipeline', label: `Approval Pipeline (${pipeline.pendingOps.length + pipeline.pendingAdmin.length})`, icon: Clock },
          { id: 'routine_compliance', label: 'Routine & Kenya Compliance', icon: ShieldCheck },
          { id: 'workshops', label: `Workshops & Mechanics (${workshops.length})`, icon: Building2 },
          { id: 'history', label: 'Truck Repair History Ledger', icon: FileText },
          { id: 'finance', label: 'Finance Planning & Variance', icon: DollarSign },
        ].map(item => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'border-lime-500 text-teal-950 dark:text-lime-300 font-extrabold'
                  : 'border-transparent text-on-surface-variant hover:text-teal-900 dark:hover:text-teal-100'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: FLEET HEALTH & PREDICTIVE SCHEDULING ─────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-teal-950 text-white p-5 rounded-2xl shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-lime-400" />
                <h3 className="text-lg font-headline font-bold text-white">Peak Performance Scheduling Algorithm</h3>
              </div>
              <p className="text-xs text-teal-200/80 max-w-2xl">
                Monitors real-time odometer wear rates, time-based fluid degradation, and upcoming freight trips. Automatically projects next service milestones and secures non-working rest day slots to eliminate fleet downtime.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-teal-300">Target Operational Day</div>
                <div className="text-sm font-bold text-lime-400">Sunday / Depot Off-Day</div>
              </div>
              <div className="h-9 w-px bg-teal-800" />
              <div className="text-right">
                <div className="text-xs text-teal-300">Compliance Standard</div>
                <div className="text-sm font-bold text-white">NTSA / Kenya KS 1820</div>
              </div>
            </div>
          </div>

          {/* Vehicle Health Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fleetRoadmap.fleetHealth.map(vh => {
              const vehicle = lookup('vehicles', vh.vehicleId);
              const bestSlot = findNextOptimalNonWorkingDay(vh.vehicleId, trips, {
                urgency: vh.status === 'critical' ? 'critical' : 'medium',
              });

              return (
                <div
                  key={vh.vehicleId}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-xs flex flex-col justify-between hover:border-lime-500/50 hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-headline font-black text-teal-950 dark:text-teal-50">{vh.registration}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            vh.status === 'peak' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            vh.status === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {vh.status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{vehicle?.make} {vehicle?.model} ({vehicle?.year})</p>
                      </div>

                      {/* Health Ring/Badge */}
                      <div className="text-right">
                        <div className={`text-xl font-headline font-black ${
                          vh.score >= 80 ? 'text-emerald-600' : vh.score >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {vh.score}%
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-semibold">Health Score</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-teal-950 rounded-full h-2 mb-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          vh.score >= 80 ? 'bg-emerald-500' : vh.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${vh.score}%` }}
                      />
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-teal-950/60 border border-outline-variant/30">
                      <div>
                        <span className="text-[11px] text-on-surface-variant block">Odometer</span>
                        <span className="font-bold text-teal-950 dark:text-teal-50">{formatNumber(vh.currentOdometer)} km</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-on-surface-variant block">Daily Wear Rate</span>
                        <span className="font-bold text-teal-950 dark:text-teal-50">{vh.avgDailyKm} km/day</span>
                      </div>
                    </div>

                    {/* Service & Compliance Alerts */}
                    <div className="space-y-1.5 mb-4">
                      {vh.dueItems.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-red-600 font-semibold p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span className="truncate">{item.name} is OVERDUE ({Math.abs(item.kmUntilDue)} km)</span>
                        </div>
                      ))}

                      {vh.complianceItems.filter(c => c.isOverdue || c.isDueSoon).slice(0, 2).map((comp, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-amber-700 font-semibold p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                          <ShieldCheck size={14} className="shrink-0" />
                          <span className="truncate">{comp.name} {comp.isOverdue ? 'EXPIRED' : `due in ${comp.daysRemaining}d`}</span>
                        </div>
                      ))}

                      {vh.dueItems.length === 0 && vh.complianceItems.filter(c => c.isOverdue || c.isDueSoon).length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span>All routine fluids & Kenya compliance up to date</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Algorithm Recommendation Footer */}
                  <div className="pt-3 border-t border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <Calendar size={13} className="text-teal-600" /> Next Rest Slot:
                      </span>
                      <span className="font-bold text-teal-900 dark:text-teal-100">{bestSlot.formattedDisplay}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReportRepairModal(vh.vehicleId)}
                      className="w-full py-2 px-3 rounded-xl border border-teal-800/20 hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-teal-900/60 font-bold text-xs text-teal-950 dark:text-teal-50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Wrench size={14} />
                      <span>Schedule Maintenance</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: MULTI-STAGE APPROVAL PIPELINE ──────────────────────────── */}
      {tab === 'pipeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-headline font-bold text-teal-950 dark:text-teal-50">
                Repair Approval Sequence Pipeline
              </h3>
              <p className="text-xs text-on-surface-variant">
                Driver schedules repair with photos/audio → Operations approves workshop & non-working day → Admin authorizes budget.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openReportRepairModal()}
              className="px-3 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> New Request
            </button>
          </div>

          {/* Kanban / Pipeline Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Column 1: Pending Operations Review */}
            <div className="flex flex-col rounded-2xl bg-surface-container-low p-3.5 border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-50 uppercase tracking-wider">1. Ops Review</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {pipeline.pendingOps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {pipeline.pendingOps.length === 0 ? (
                  <p className="text-xs text-outline text-center py-8 italic">No requests awaiting Ops review</p>
                ) : (
                  pipeline.pendingOps.map(item => {
                    const vehicle = lookup('vehicles', item.vehicle_id);
                    const driver = lookup('users', item.driver_id);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-teal-950 border border-outline-variant/40 shadow-xs space-y-2.5 hover:border-amber-500 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-teal-950 dark:text-teal-50">{vehicle?.registration || 'Truck'}</span>
                            <p className="text-[11px] text-on-surface-variant font-medium">{item.service_type}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.priority === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.priority || 'high'}
                          </span>
                        </div>

                        <p className="text-xs text-teal-900 dark:text-teal-100 line-clamp-2 italic">
                          "{item.description}"
                        </p>

                        {/* Evidence Indicators */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-teal-900 text-[11px] text-teal-700/80">
                          {item.evidence_audio && (
                            <span className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
                              <Volume2 size={13} /> Voice Note
                            </span>
                          )}
                          {item.evidence_photos?.length > 0 && (
                            <span className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
                              <Camera size={13} /> {item.evidence_photos.length} Photo{item.evidence_photos.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-teal-950 dark:text-teal-50">{formatCurrency(item.expected_cost)}</span>
                          {isOps && (
                            <button
                              type="button"
                              onClick={() => openOpsReviewModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                            >
                              <span>Review</span>
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Pending Admin Final Authorization */}
            <div className="flex flex-col rounded-2xl bg-surface-container-low p-3.5 border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-50 uppercase tracking-wider">2. Admin Approval</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {pipeline.pendingAdmin.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {pipeline.pendingAdmin.length === 0 ? (
                  <p className="text-xs text-outline text-center py-8 italic">No requests awaiting Admin authorization</p>
                ) : (
                  pipeline.pendingAdmin.map(item => {
                    const vehicle = lookup('vehicles', item.vehicle_id);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-teal-950 border border-outline-variant/40 shadow-xs space-y-2.5 hover:border-purple-500 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-teal-950 dark:text-teal-50">{vehicle?.registration || 'Truck'}</span>
                            <p className="text-[11px] text-on-surface-variant font-medium">{item.service_type}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Ops Approved
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-teal-900/40 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Scheduled Date:</span>
                            <span className="font-bold text-teal-950 dark:text-teal-50">{formatDate(item.scheduled_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Workshop:</span>
                            <span className="font-bold truncate max-w-[120px]">{item.vendor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Non-Working Day:</span>
                            <span className="font-bold text-emerald-600">{item.non_working_day_type || 'Rest Day'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{formatCurrency(item.expected_cost)}</span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openAdminReviewModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                            >
                              <span>Authorize</span>
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Approved & Scheduled on Non-Working Day */}
            <div className="flex flex-col rounded-2xl bg-surface-container-low p-3.5 border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-50 uppercase tracking-wider">3. Scheduled</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {pipeline.approvedScheduled.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {pipeline.approvedScheduled.length === 0 ? (
                  <p className="text-xs text-outline text-center py-8 italic">No upcoming scheduled jobs</p>
                ) : (
                  pipeline.approvedScheduled.map(item => {
                    const vehicle = lookup('vehicles', item.vehicle_id);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-teal-950 border border-outline-variant/40 shadow-xs space-y-2.5 hover:border-sky-500 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-teal-950 dark:text-teal-50">{vehicle?.registration || 'Truck'}</span>
                            <p className="text-[11px] text-on-surface-variant font-medium">{item.service_type}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                            Locked
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 text-[11px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Slot:</span>
                            <span className="font-bold text-sky-800 dark:text-sky-200">{formatDate(item.scheduled_date)}</span>
                          </div>
                          <div className="text-[10px] text-sky-700/80 font-semibold">{item.non_working_day_type}</div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => openViewRecordModal(item)}
                            className="text-xs text-teal-700 font-bold hover:underline"
                          >
                            Details
                          </button>
                          {isOps && (
                            <button
                              type="button"
                              onClick={() => startMaintenance(item.id)}
                              className="px-2 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs"
                            >
                              Send to Shop
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 4: In Progress (In Workshop) */}
            <div className="flex flex-col rounded-2xl bg-surface-container-low p-3.5 border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-50 uppercase tracking-wider">4. In Workshop</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {pipeline.inProgress.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {pipeline.inProgress.length === 0 ? (
                  <p className="text-xs text-outline text-center py-8 italic">No vehicles currently in workshop</p>
                ) : (
                  pipeline.inProgress.map(item => {
                    const vehicle = lookup('vehicles', item.vehicle_id);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-teal-950 border border-outline-variant/40 shadow-xs space-y-2.5 hover:border-indigo-500 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-teal-950 dark:text-teal-50">{vehicle?.registration || 'Truck'}</span>
                            <p className="text-[11px] text-on-surface-variant font-medium">{item.service_type}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            Underway
                          </span>
                        </div>

                        <div className="text-[11px] text-on-surface-variant">
                          <span>Mechanic: </span>
                          <span className="font-bold text-teal-950 dark:text-teal-50">{item.mechanic_name || 'Chief Tech'}</span>
                          <p className="text-[10px] text-outline">{item.vendor}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openCompleteModal(item)}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 size={13} />
                          <span>Complete & Log Cost</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 5: Completed History */}
            <div className="flex flex-col rounded-2xl bg-surface-container-low p-3.5 border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-50 uppercase tracking-wider">5. Completed</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {pipeline.completed.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {pipeline.completed.slice(0, 5).map(item => {
                  const vehicle = lookup('vehicles', item.vehicle_id);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-teal-950 border border-outline-variant/40 shadow-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-teal-950 dark:text-teal-50">{vehicle?.registration || 'Truck'}</span>
                        <span className="text-[11px] font-bold text-emerald-600">{formatCurrency(item.cost)}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">{item.service_type}</p>
                      <div className="flex justify-between items-center text-[10px] text-outline pt-1">
                        <span>{formatDate(item.service_date)}</span>
                        <span>{item.vendor}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ROUTINE SERVICE & KENYA COMPLIANCE MATRIX ───────────────── */}
      {tab === 'routine_compliance' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
            <h3 className="text-base font-headline font-bold text-teal-950 dark:text-teal-50">
              Kenya Statutory Transport Compliance & Routine Service Standards
            </h3>
            <p className="text-xs text-on-surface-variant max-w-3xl">
              Strictly monitors requirements mandated by the National Transport and Safety Authority (NTSA) in Kenya, including annual motor vehicle inspections, accredited 80 km/h speed governor calibration, fire equipment certification, and OEM recommended interval servicing (oil, filters, coolant, tires).
            </p>
          </div>

          {/* Standard Service Catalog Reference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_SERVICE_CATALOG.map(srv => {
              const isCompliance = srv.category === 'compliance';
              return (
                <div
                  key={srv.id}
                  className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${
                    isCompliance
                      ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40'
                      : 'bg-surface-container-lowest border-outline-variant/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isCompliance ? 'bg-purple-100 text-purple-800' : 'bg-lime-100 text-teal-900'
                      }`}>
                        {isCompliance ? 'Kenya Statutory' : srv.category}
                      </span>
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-100">{formatCurrency(srv.expectedCost)}</span>
                    </div>
                    <h4 className="text-sm font-headline font-bold text-teal-950 dark:text-teal-50">{srv.name}</h4>
                    <p className="text-xs text-on-surface-variant">{srv.description}</p>

                    <div className="text-[11px] text-teal-700/80 space-y-0.5 pt-1">
                      <div>Interval: <strong>Every {formatNumber(srv.intervalKm)} km / {srv.intervalDays} days</strong></div>
                      <div>Key Parts: <span className="italic">{srv.partsRequired.join(', ')}</span></div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-outline-variant/20 flex justify-between items-center">
                    <span className="text-[11px] text-outline">Benchmark Cost</span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetVeh = vehicles[0]?.id;
                        if (targetVeh) handleOneClickScheduleRoutine(targetVeh, srv);
                      }}
                      className="text-xs font-bold text-teal-800 hover:text-lime-600 flex items-center gap-1"
                    >
                      <span>Queue Service</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vehicle Compliance Matrix Table */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
              <h4 className="text-sm font-headline font-bold text-teal-950 dark:text-teal-50">Fleet Compliance Roster (Kenya)</h4>
              <span className="text-xs text-on-surface-variant">{vehicles.length} Trucks Monitored</span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Make / Model</th>
                    <th>Odometer</th>
                    <th>Engine Oil & Filter</th>
                    <th>Coolant Service</th>
                    <th>NTSA Inspection</th>
                    <th>Speed Governor (80 km/h)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetRoadmap.fleetHealth.map(vh => {
                    const vehicle = lookup('vehicles', vh.vehicleId);
                    const oilItem = vh.dueItems.find(i => i.id === 'srv_oil_filter') || vh.upcomingItems.find(i => i.id === 'srv_oil_filter');
                    const coolantItem = vh.dueItems.find(i => i.id === 'srv_coolant_refill') || vh.upcomingItems.find(i => i.id === 'srv_coolant_refill');
                    const ntsaDoc = vh.complianceItems.find(c => c.docType === 'inspection' || c.complianceCategory === 'ntsa_inspection');
                    const govDoc = vh.complianceItems.find(c => c.docType === 'fitness' || c.complianceCategory === 'speed_governor');

                    return (
                      <tr key={vh.vehicleId}>
                        <td className="primary font-bold">{vh.registration}</td>
                        <td>{vehicle?.make} {vehicle?.model}</td>
                        <td className="numeric font-bold">{formatNumber(vh.currentOdometer)} km</td>
                        <td>
                          {oilItem ? (
                            <span className="text-xs font-bold text-red-600">Overdue ({Math.abs(oilItem.kmUntilDue)} km)</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={13} /> Good
                            </span>
                          )}
                        </td>
                        <td>
                          {coolantItem ? (
                            <span className="text-xs font-bold text-amber-600">Due in {coolantItem.daysRemaining}d</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={13} /> Good
                            </span>
                          )}
                        </td>
                        <td>
                          {ntsaDoc?.isOverdue ? (
                            <span className="text-xs font-bold text-red-600">EXPIRED</span>
                          ) : (
                            <span className="text-xs text-teal-800 font-bold">Valid ({ntsaDoc?.daysRemaining || 180}d)</span>
                          )}
                        </td>
                        <td>
                          {govDoc?.isOverdue ? (
                            <span className="text-xs font-bold text-red-600">Calibration Due</span>
                          ) : (
                            <span className="text-xs text-emerald-700 font-bold">Calibrated (80 km/h)</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openReportRepairModal(vh.vehicleId)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-lime-300 font-bold text-xs text-teal-950 transition-all"
                          >
                            Schedule
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: WORKSHOPS & MECHANIC DIRECTORY ─────────────────────────── */}
      {tab === 'workshops' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-headline font-bold text-teal-950 dark:text-teal-50">
                Authorized Repair Shops & Lead Mechanics Directory
              </h3>
              <p className="text-xs text-on-surface-variant">
                Certified commercial vehicle service centers, engine rebuild specialists, tire alignment depots, and NTSA inspection lanes in Kenya.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: '',
                  city: 'Nairobi',
                  address: '',
                  phone: '+254 ',
                  lead_mechanic_name: '',
                  lead_mechanic_phone: '+254 ',
                  specialties: ['Heavy Commercial Maintenance'],
                });
                setModal('add_workshop');
              }}
              className="px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Add Repair Shop
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workshops.map(ws => (
              <div
                key={ws.id}
                className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between hover:border-lime-500/50 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-headline font-black text-teal-950 dark:text-teal-50">{ws.name}</h4>
                      <p className="text-xs text-on-surface-variant">{ws.address || ws.city}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-lime-100 text-teal-950">
                      ★ {ws.rating || 4.8}
                    </span>
                  </div>

                  {/* Lead Mechanic Profile Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-teal-950/60 border border-outline-variant/30 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-outline">Lead Commercial Mechanic</div>
                    <div className="text-xs font-black text-teal-950 dark:text-teal-50 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-teal-700" />
                      <span>{ws.lead_mechanic_name || 'Senior Fleet Specialist'}</span>
                    </div>
                    <div className="text-[11px] text-teal-800/80 font-mono">{ws.lead_mechanic_phone || ws.phone}</div>
                  </div>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1">
                    {ws.specialties?.map((spec, i) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-outline-variant/20 flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">{ws.phone}</span>
                  <span className="font-bold text-emerald-600">Accredited</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: TRUCK REPAIR HISTORY LEDGER ────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-xl font-headline font-bold text-teal-950 dark:text-teal-50">
                Chronological Truck Repair History
              </h3>
              <p className="text-xs text-on-surface-variant">
                Audit ledger of all maintenance events, service receipts, mechanic notes, and photo/audio evidence per truck.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Vehicle Filter */}
              <select
                value={selectedVehicleFilter}
                onChange={e => setSelectedVehicleFilter(e.target.value)}
                className="form-select text-xs font-bold py-2 rounded-xl"
              >
                <option value="all">All Fleet Trucks</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration} ({v.make})</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="form-select text-xs font-bold py-2 rounded-xl"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="approved_scheduled">Scheduled</option>
                <option value="in_progress">In Workshop</option>
                <option value="pending_ops">Pending Ops</option>
                <option value="pending_admin">Pending Admin</option>
              </select>

              <button
                type="button"
                onClick={handleExportHistory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/40 hover:bg-slate-100 dark:hover:bg-teal-900/40 text-xs font-bold transition-all"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* History Data Table */}
          <div className="table-container shadow-xs">
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <div className="search-input">
                  <Search size={15} />
                  <input
                    placeholder="Search repair history by service, mechanic, workshop..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Service / Scheduled Date</th>
                    <th>Non-Working Slot</th>
                    <th>Workshop & Mechanic</th>
                    <th>Expected</th>
                    <th>Actual Cost</th>
                    <th>Evidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaintenance.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="table-empty">
                        No maintenance records found matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredMaintenance.map(item => {
                      const vehicle = lookup('vehicles', item.vehicle_id);
                      return (
                        <tr key={item.id}>
                          <td className="primary font-bold">{vehicle?.registration || '—'}</td>
                          <td>
                            <div className="font-bold text-xs">{item.service_type}</div>
                            <div className="text-[11px] text-outline line-clamp-1">{item.description}</div>
                          </td>
                          <td>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                              item.status === 'approved_scheduled' ? 'bg-sky-100 text-sky-800' :
                              item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status ? item.status.replace(/_/g, ' ') : 'completed'}
                            </span>
                          </td>
                          <td>{formatDate(item.service_date || item.scheduled_date)}</td>
                          <td>
                            <span className="text-xs font-semibold text-teal-800 dark:text-teal-200">
                              {item.non_working_day_type || (item.is_non_working_day ? 'Rest Day' : '—')}
                            </span>
                          </td>
                          <td>
                            <div className="text-xs font-bold">{item.vendor || 'Authorized Workshop'}</div>
                            <div className="text-[11px] text-outline">{item.mechanic_name || 'Lead Mechanic'}</div>
                          </td>
                          <td className="numeric text-xs font-semibold text-on-surface-variant">
                            {formatCurrency(item.expected_cost || item.cost)}
                          </td>
                          <td className="numeric text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(item.cost || item.expected_cost)}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              {item.evidence_audio && (
                                <span className="p-1 rounded bg-teal-50 text-teal-700" title="Audio voice note attached">
                                  <Volume2 size={14} />
                                </span>
                              )}
                              {item.evidence_photos?.length > 0 && (
                                <span className="p-1 rounded bg-teal-50 text-teal-700" title={`${item.evidence_photos.length} photos attached`}>
                                  <Camera size={14} />
                                </span>
                              )}
                              {!item.evidence_audio && !item.evidence_photos?.length && (
                                <span className="text-outline text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openViewRecordModal(item)}
                                className="btn-icon"
                                title="View Record Details"
                              >
                                <Eye size={15} />
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => deleteItem('maintenance', item.id)}
                                  className="btn-icon text-red-600 hover:text-red-700"
                                  title="Delete Record"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: FINANCE PLANNING & BUDGET VARIANCE ─────────────────────── */}
      {tab === 'finance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-teal-950 text-white space-y-2">
            <h3 className="text-lg font-headline font-bold text-white">Finance Department Maintenance Forecasting</h3>
            <p className="text-xs text-teal-200/80 max-w-2xl">
              Tracks expected repair amounts from approval workflows, monitors maintenance cash commitments for upcoming non-working day jobs, and analyzes budget accuracy (expected quote vs. final mechanic invoice).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">Approved Scheduled Commitments</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(fleetRoadmap.finance.committedBudget)}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Approved by Admin, locked for upcoming rest days</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">Pending Approval Pipeline</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {formatCurrency(fleetRoadmap.finance.pendingPipelineBudget)}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Estimated cost of requests awaiting Ops / Admin review</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">Total Historical Maintenance Spend</span>
              <div className="text-2xl font-black text-teal-950 dark:text-teal-50 mt-1">
                {formatCurrency(fleetRoadmap.finance.actualSpentTotal)}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Fully reconciled & synced to Expenses ledger</p>
            </div>
          </div>

          {/* Variance Table */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
              <h4 className="text-sm font-headline font-bold text-teal-950 dark:text-teal-50">Budget Accuracy & Variance Analysis (Expected vs Actual)</h4>
              <span className="text-xs text-on-surface-variant">{fleetRoadmap.finance.varianceItems.length} Reconciled Services</span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Expected Cost (KES)</th>
                    <th>Actual Invoice (KES)</th>
                    <th>Variance (KES)</th>
                    <th>Variance %</th>
                    <th>Budget Health</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetRoadmap.finance.varianceItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty">No variance entries logged yet</td>
                    </tr>
                  ) : (
                    fleetRoadmap.finance.varianceItems.map(v => (
                      <tr key={v.id}>
                        <td className="primary font-bold">{v.serviceType}</td>
                        <td className="numeric">{formatCurrency(v.expected)}</td>
                        <td className="numeric font-bold">{formatCurrency(v.actual)}</td>
                        <td className={`numeric font-bold ${v.diff > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {v.diff > 0 ? `+${formatCurrency(v.diff)}` : formatCurrency(v.diff)}
                        </td>
                        <td className="numeric font-bold">{v.pct}%</td>
                        <td>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            Math.abs(v.diff) <= 1500 ? 'bg-emerald-100 text-emerald-800' :
                            v.diff > 1500 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {Math.abs(v.diff) <= 1500 ? 'Accurate' : v.diff > 1500 ? 'Over Budget' : 'Under Budget'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: REPORT REPAIR / SCHEDULE FAULT (DRIVER / OPS) ────────── */}
      {modal === 'report_repair' && (
        <Modal
          title="Schedule Vehicle Repair / Report Fault"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveRepairRequest}>
                Submit Request for Approval
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Vehicle</label>
                <select
                  className="form-select"
                  value={formData.vehicle_id}
                  onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                  disabled={isDriver && !!driverVehicle}
                >
                  <option value="">Select Vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency / Severity</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="critical">Critical (Unsafe / Breakdown)</option>
                  <option value="high">High (Repair Before Next Trip)</option>
                  <option value="medium">Medium (Next Depot Stop)</option>
                  <option value="low">Low (Minor / Aesthetic)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service / Repair Type</label>
                <input
                  className="form-input"
                  placeholder="e.g. Brake Disc Scoring, Engine Knocking, Oil Leak..."
                  value={formData.service_type || ''}
                  onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Repair Amount (KES)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Estimated cost for finance planning"
                  value={formData.expected_cost || ''}
                  onChange={e => setFormData({ ...formData, expected_cost: e.target.value })}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Fault Description & Mechanical Symptoms</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe abnormal sounds, dashboard alerts, performance drop, or visual leaks..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Audio Evidence Voice Note / Sound Recorder */}
            <AudioEvidenceRecorder
              value={formData.evidence_audio}
              onChange={meta => setFormData({ ...formData, evidence_audio: meta })}
            />

            {/* Photo Evidence Gallery */}
            <PhotoEvidenceUploader
              photos={formData.evidence_photos}
              onChange={photos => setFormData({ ...formData, evidence_photos: photos })}
            />
          </div>
        </Modal>
      )}

      {/* ── MODAL 2: OPERATIONS MANAGER REVIEW & WORKSHOP ASSIGNMENT ──────── */}
      {modal === 'ops_review' && selectedRecord && (
        <Modal
          title={`Operations Review: ${lookup('vehicles', selectedRecord.vehicle_id)?.registration} — ${selectedRecord.service_type}`}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-secondary text-red-600" onClick={handleReject}>
                Reject Request
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleOpsApproval}>
                Approve & Submit to Admin
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 space-y-1">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Clock size={15} />
                <span>Stage 1: Operations Assessment & Non-Working Day Allocation</span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                Inspect evidence submitted by driver. The scheduling algorithm automatically selects a rest day slot with zero scheduled trip conflicts.
              </p>
            </div>

            {/* Inspect Driver Evidence */}
            {selectedRecord.evidence_audio && (
              <AudioEvidenceRecorder value={selectedRecord.evidence_audio} readOnly />
            )}
            {selectedRecord.evidence_photos?.length > 0 && (
              <PhotoEvidenceUploader photos={selectedRecord.evidence_photos} readOnly />
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Scheduled Date (Non-Working Day)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.scheduled_date || ''}
                  onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Non-Working Day Type</label>
                <input
                  className="form-input"
                  value={formData.non_working_day_type || 'Sunday Fleet Rest Day'}
                  onChange={e => setFormData({ ...formData, non_working_day_type: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Certified Repair Shop</label>
                <select
                  className="form-select"
                  value={formData.workshop_id}
                  onChange={e => {
                    const ws = workshops.find(w => w.id === e.target.value);
                    setFormData({
                      ...formData,
                      workshop_id: e.target.value,
                      vendor: ws?.name || formData.vendor,
                      mechanic_name: ws?.lead_mechanic_name || formData.mechanic_name,
                      mechanic_phone: ws?.lead_mechanic_phone || formData.mechanic_phone,
                    });
                  }}
                >
                  {workshops.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name} ({ws.city})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Lead Mechanic Name</label>
                <input
                  className="form-input"
                  value={formData.mechanic_name || ''}
                  onChange={e => setFormData({ ...formData, mechanic_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mechanic Phone</label>
                <input
                  className="form-input"
                  value={formData.mechanic_phone || ''}
                  onChange={e => setFormData({ ...formData, mechanic_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approved Expected Amount (KES)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.expected_cost || ''}
                  onChange={e => setFormData({ ...formData, expected_cost: e.target.value })}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Operations Instructions for Workshop</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.ops_notes || ''}
                  onChange={e => setFormData({ ...formData, ops_notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL 3: ADMIN FINAL APPROVAL ─────────────────────────────────── */}
      {modal === 'admin_review' && selectedRecord && (
        <Modal
          title={`Admin Authorization: ${lookup('vehicles', selectedRecord.vehicle_id)?.registration}`}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-secondary text-red-600" onClick={handleReject}>
                Reject
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-primary bg-purple-600 hover:bg-purple-700" onClick={handleAdminApproval}>
                Authorize & Lock Schedule
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 space-y-1">
              <div className="text-xs font-bold text-purple-950 dark:text-purple-200">Stage 2: Admin Financial Authorization</div>
              <p className="text-[11px] text-purple-900/80">
                Authorize expenditure of <strong>{formatCurrency(selectedRecord.expected_cost)}</strong> at <strong>{selectedRecord.vendor}</strong> scheduled for <strong>{selectedRecord.scheduled_date}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-teal-950/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Service Type:</span>
                <span className="font-bold">{selectedRecord.service_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Assigned Workshop:</span>
                <span className="font-bold">{selectedRecord.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Lead Mechanic:</span>
                <span className="font-bold">{selectedRecord.mechanic_name} ({selectedRecord.mechanic_phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Rest Day Slot:</span>
                <span className="font-bold text-emerald-600">{selectedRecord.non_working_day_type}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Approval Notes</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.admin_notes || ''}
                onChange={e => setFormData({ ...formData, admin_notes: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL 4: COMPLETE SERVICE & LOG ACTUAL COSTS ──────────────────── */}
      {modal === 'complete_job' && selectedRecord && (
        <Modal
          title={`Complete Service & Log Invoices: ${lookup('vehicles', selectedRecord.vehicle_id)?.registration}`}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={handleCompleteService}>
                Complete Service & Sync Expenses
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-xs space-y-1 text-emerald-900 border border-emerald-200">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Finalize Service & Return Vehicle to Active Fleet
              </div>
              <p className="text-[11px]">
                Upon completion, an expense record will be automatically posted to Finance under Repairs & Maintenance.
              </p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Total Final Cost (KES)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.cost || ''}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parts Cost (KES)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.parts_cost || ''}
                  onChange={e => setFormData({ ...formData, parts_cost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Labor Cost (KES)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.labor_cost || ''}
                  onChange={e => setFormData({ ...formData, labor_cost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Odometer at Service (km)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.odometer_at_service || ''}
                  onChange={e => setFormData({ ...formData, odometer_at_service: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Service Due (km)</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.next_due_km || ''}
                  onChange={e => setFormData({ ...formData, next_due_km: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Service Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.next_due_date || ''}
                  onChange={e => setFormData({ ...formData, next_due_date: e.target.value })}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Mechanic Work Notes / Replaced Parts Summary</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL 5: VIEW DETAILS ─────────────────────────────────────────── */}
      {modal === 'view_record' && selectedRecord && (
        <Modal
          title={`Maintenance Record: ${lookup('vehicles', selectedRecord.vehicle_id)?.registration}`}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 dark:bg-teal-950/60">
              <div>
                <span className="text-on-surface-variant block">Service Type</span>
                <span className="font-bold text-teal-950 dark:text-teal-50">{selectedRecord.service_type}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Status</span>
                <span className="font-bold text-emerald-600 uppercase">{selectedRecord.status || 'completed'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Workshop</span>
                <span className="font-bold">{selectedRecord.vendor || '—'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Lead Mechanic</span>
                <span className="font-bold">{selectedRecord.mechanic_name || '—'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Non-Working Day</span>
                <span className="font-bold text-sky-600">{selectedRecord.non_working_day_type || 'Sunday Rest Day'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Cost</span>
                <span className="font-bold text-emerald-700">{formatCurrency(selectedRecord.cost || selectedRecord.expected_cost)}</span>
              </div>
            </div>

            {selectedRecord.description && (
              <div>
                <span className="text-xs font-bold text-teal-950 dark:text-teal-50 block mb-1">Issue Description</span>
                <p className="text-xs text-on-surface-variant p-2.5 rounded-lg bg-slate-50 dark:bg-teal-950/40">
                  {selectedRecord.description}
                </p>
              </div>
            )}

            {selectedRecord.evidence_audio && (
              <AudioEvidenceRecorder value={selectedRecord.evidence_audio} readOnly />
            )}

            {selectedRecord.evidence_photos?.length > 0 && (
              <PhotoEvidenceUploader photos={selectedRecord.evidence_photos} readOnly />
            )}
          </div>
        </Modal>
      )}

      {/* ── MODAL 6: ADD WORKSHOP ─────────────────────────────────────────── */}
      {modal === 'add_workshop' && (
        <Modal
          title="Register Commercial Repair Shop / Inspection Station"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (!formData.name) return alert('Workshop name is required');
                  const newWs = {
                    ...formData,
                    id: 'ws_' + Math.random().toString(36).substr(2, 9),
                    rating: 4.9,
                    is_active: true,
                    created_at: new Date().toISOString(),
                  };
                  await addItem('workshops', newWs);
                  closeModal();
                }}
              >
                Save Workshop
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Repair Shop / Station Name</label>
              <input
                className="form-input"
                placeholder="e.g. Scania East Africa (Mombasa Branch)"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City / Hub</label>
              <input
                className="form-input"
                placeholder="e.g. Nairobi, Mombasa, Nakuru, Eldoret"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Physical Address</label>
              <input
                className="form-input"
                placeholder="e.g. Changamwe Commercial Zone"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Workshop Phone</label>
              <input
                className="form-input"
                placeholder="+254 700 000 000"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Mechanic Name</label>
              <input
                className="form-input"
                placeholder="e.g. Samuel Kilonzo"
                value={formData.lead_mechanic_name || ''}
                onChange={e => setFormData({ ...formData, lead_mechanic_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Mechanic Phone</label>
              <input
                className="form-input"
                placeholder="+254 722 000 000"
                value={formData.lead_mechanic_phone || ''}
                onChange={e => setFormData({ ...formData, lead_mechanic_phone: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
