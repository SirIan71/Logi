/**
 * SIRIAN Fleet Maintenance & Peak Performance Scheduling Engine
 *
 * Implements:
 * 1. Multi-factor vehicle wear & health scoring (0-100)
 * 2. Non-working day constraint satisfaction algorithm
 * 3. Kenya statutory compliance tracking (NTSA, Speed Governor, TLB, Safety)
 * 4. Routine service milestone predictors (Oil, Filters, Coolant, Tires)
 * 5. Finance planning expected cost catalog
 */

// ── Standard Maintenance Service Catalog for Kenya Commercial Fleets ─────────
export const STANDARD_SERVICE_CATALOG = [
  {
    id: 'srv_oil_filter',
    name: 'Oil & Oil Filter Service',
    category: 'routine',
    intervalKm: 10000,
    intervalDays: 90,
    expectedCost: 12500,
    description: '15W-40 Heavy Duty Diesel Oil replacement, OEM oil filter, sump washer, fluid level check.',
    partsRequired: ['15W-40 Diesel Oil (30L)', 'Oil Filter Element', 'Drain Plug Washer'],
    complianceCategory: null,
  },
  {
    id: 'srv_coolant_refill',
    name: 'Coolant Refill & System Flush',
    category: 'routine',
    intervalKm: 20000,
    intervalDays: 180,
    expectedCost: 6800,
    description: 'Radiator flush, ethylene glycol 50/50 heavy duty coolant refill, pressure cap test.',
    partsRequired: ['Heavy Duty Coolant 50/50 Premix (20L)', 'Radiator Cap Seal'],
    complianceCategory: null,
  },
  {
    id: 'srv_fuel_air_filters',
    name: 'Fuel & Air Filter Replacement',
    category: 'routine',
    intervalKm: 20000,
    intervalDays: 180,
    expectedCost: 9500,
    description: 'Primary & secondary fuel filters, water separator cartridge, heavy duty air filter cartridge.',
    partsRequired: ['Fuel Filter Primary', 'Secondary Fuel Filter', 'Air Filter Cartridge'],
    complianceCategory: null,
  },
  {
    id: 'srv_tire_rotation',
    name: 'Tire Rotation & Wheel Alignment',
    category: 'tires',
    intervalKm: 15000,
    intervalDays: 120,
    expectedCost: 8500,
    description: 'Tire tread depth logging, cross-axle rotation, 3D computerized wheel alignment, pressure calibration.',
    partsRequired: ['Wheel Weights', 'Valve Stems'],
    complianceCategory: null,
  },
  {
    id: 'srv_tire_replacement',
    name: 'Tire Replacement (Drive/Steer Axle)',
    category: 'tires',
    intervalKm: 45000,
    intervalDays: 365,
    expectedCost: 38000,
    description: 'Commercial 315/80R22.5 heavy duty radial tire replacement, dynamic balancing, rim inspection.',
    partsRequired: ['315/80R22.5 Heavy Duty Truck Tire', 'Tube/Flap/Valve'],
    complianceCategory: null,
  },
  {
    id: 'srv_brake_overhaul',
    name: 'Brake Linings & Air System Service',
    category: 'brakes',
    intervalKm: 25000,
    intervalDays: 180,
    expectedCost: 18500,
    description: 'Brake drum / disc inspection, brake lining replacement, air dryer cartridge, slack adjuster greasing.',
    partsRequired: ['Brake Shoe Linings Kit', 'Air Dryer Desiccant Cartridge', 'Grease'],
    complianceCategory: null,
  },
  {
    id: 'srv_full_service',
    name: 'Full Major Service (A-to-Z Overhaul)',
    category: 'routine',
    intervalKm: 40000,
    intervalDays: 365,
    expectedCost: 32000,
    description: 'Complete powertrain service: engine oil, all filters, transmission fluid, differential oil, full 60-point mechanical & safety inspection.',
    partsRequired: ['Engine Oil 15W-40', 'Oil/Fuel/Air Filters', 'Gear Oil 85W-140', 'Chassis Grease'],
    complianceCategory: null,
  },
  // ── Kenya Statutory Compliance Inspections ───────────────────────────────────
  {
    id: 'comp_ntsa_inspection',
    name: 'NTSA Annual Motor Vehicle Inspection',
    category: 'compliance',
    intervalKm: 50000,
    intervalDays: 365,
    expectedCost: 5500,
    description: 'Mandatory annual roadworthiness testing at an accredited NTSA testing station in Kenya.',
    partsRequired: ['Inspection Booking Fee', 'Test Lane Pass Stamp'],
    complianceCategory: 'ntsa_inspection',
  },
  {
    id: 'comp_speed_governor',
    name: 'Speed Governor Calibration & Certificate',
    category: 'compliance',
    intervalKm: 50000,
    intervalDays: 365,
    expectedCost: 7500,
    description: 'Mandatory NTSA-approved 80 km/h speed limiter calibration, GPS telemetry test, tamper-evident lead seals & certificate.',
    partsRequired: ['Governor Limiter Calibration Seal', 'NTSA Certificate'],
    complianceCategory: 'speed_governor',
  },
  {
    id: 'comp_fire_safety',
    name: 'Fire Extinguisher & First Aid Inspection',
    category: 'compliance',
    intervalKm: 25000,
    intervalDays: 180,
    expectedCost: 3200,
    description: 'Semi-annual dry powder fire extinguisher hydrostatic test, gauge recharge, compliance sticker & commercial vehicle first aid kit replenish.',
    partsRequired: ['Dry Powder 9KG Refill', 'Inspection Tag', 'First Aid Supplies'],
    complianceCategory: 'fire_safety',
  },
  {
    id: 'comp_contour_chevrons',
    name: 'Reflective Tape & Hazard Chevrons (KS 1820)',
    category: 'compliance',
    intervalKm: 60000,
    intervalDays: 365,
    expectedCost: 4500,
    description: 'NTSA Standard KS 1820 high-intensity microprismatic reflective contour tape around trailer perimeter and rear chevrons.',
    partsRequired: ['Red/Yellow Microprismatic Tape', 'Rear Hazard Chevrons'],
    complianceCategory: 'contour_chevrons',
  },
];

/**
 * Calculates a vehicle's historical average daily distance (km/day).
 */
export function calculateAverageDailyKm(vehicleId, trips = [], fuelRecords = []) {
  const vTrips = trips.filter(t => t.vehicle_id === vehicleId && t.status === 'completed' && t.actual_distance_km);
  if (vTrips.length === 0) return 280; // Standard commercial fleet baseline km/day in Kenya

  const sortedTrips = [...vTrips].sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date));
  const earliestDate = new Date(sortedTrips[0].departure_date);
  const latestDate = new Date(sortedTrips[sortedTrips.length - 1].arrival_date || sortedTrips[sortedTrips.length - 1].departure_date);
  const totalKm = vTrips.reduce((sum, t) => sum + (t.actual_distance_km || 0), 0);

  const daySpan = Math.max(1, Math.round((latestDate - earliestDate) / (1000 * 60 * 60 * 24)));
  const calculatedDaily = Math.round(totalKm / daySpan);

  // Return bounded realistic daily rate (150km to 600km)
  return Math.min(Math.max(calculatedDaily, 150), 600);
}

/**
 * Determines days remaining until a given date string.
 */
export function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats date into YYYY-MM-DD
 */
export function formatISODate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Calculates the comprehensive Vehicle Health & Peak Performance Index (0-100).
 */
export function calculateVehicleHealth(vehicle, trips = [], fuelRecords = [], maintenanceRecords = [], documents = []) {
  const vMaint = maintenanceRecords.filter(m => m.vehicle_id === vehicle.id);
  const vCompletedMaint = vMaint.filter(m => m.status === 'completed' || !m.status);
  const vPendingMaint = vMaint.filter(m => ['pending_ops', 'pending_admin', 'approved_scheduled', 'in_progress'].includes(m.status));
  const vDocs = documents.filter(d => d.vehicle_id === vehicle.id);

  const avgDailyKm = calculateAverageDailyKm(vehicle.id, trips, fuelRecords);
  const currentOdo = vehicle.current_odometer || 0;

  // Track service categories
  const dueItems = [];
  const upcomingItems = [];
  const complianceItems = [];

  let healthScore = 100;

  // 1. Check Standard Services against history
  STANDARD_SERVICE_CATALOG.forEach(catalogItem => {
    // Find most recent completed service of this type
    const matches = vCompletedMaint.filter(m =>
      (m.service_type && m.service_type.toLowerCase().includes(catalogItem.name.toLowerCase().split(' ')[0])) ||
      (m.description && m.description.toLowerCase().includes(catalogItem.name.toLowerCase().split(' ')[0])) ||
      (catalogItem.complianceCategory && m.compliance_category === catalogItem.complianceCategory)
    );

    matches.sort((a, b) => new Date(b.service_date || b.created_at) - new Date(a.service_date || a.created_at));
    const lastService = matches[0];

    const lastOdo = lastService?.odometer_at_service || Math.max(0, currentOdo - 12000);
    const lastDate = lastService?.service_date || '2025-11-01';

    const kmSinceLast = Math.max(0, currentOdo - lastOdo);
    const kmUntilDue = catalogItem.intervalKm - kmSinceLast;

    const daysSinceLast = Math.max(0, -daysUntil(lastDate));
    const daysRemaining = catalogItem.intervalDays - daysSinceLast;

    // Projected due date based on whichever triggers first (km or days)
    const daysByKm = Math.round(kmUntilDue / avgDailyKm);
    const effectiveDaysDue = Math.min(daysRemaining, daysByKm);

    const projectedDueDate = new Date();
    projectedDueDate.setDate(projectedDueDate.getDate() + effectiveDaysDue);
    const dueDateStr = formatISODate(projectedDueDate);

    const isOverdue = kmUntilDue <= 0 || daysRemaining <= 0;
    const isDueSoon = (kmUntilDue <= 1500 && kmUntilDue > 0) || (daysRemaining <= 14 && daysRemaining > 0);

    const statusItem = {
      ...catalogItem,
      lastServiceDate: lastDate,
      lastOdometer: lastOdo,
      kmSinceLast,
      kmUntilDue,
      daysRemaining: effectiveDaysDue,
      projectedDueDate: dueDateStr,
      isOverdue,
      isDueSoon,
    };

    if (catalogItem.category === 'compliance') {
      complianceItems.push(statusItem);
    } else if (isOverdue) {
      dueItems.push(statusItem);
      healthScore -= 18;
    } else if (isDueSoon) {
      upcomingItems.push(statusItem);
      healthScore -= 8;
    }
  });

  // 2. Check Kenya Vehicle Compliance Documents (from vehicle_documents table)
  vDocs.forEach(doc => {
    const days = daysUntil(doc.expiry_date);
    const isExpired = days <= 0;
    const isExpiring = days > 0 && days <= 30;

    const docTypeLabel = doc.doc_type ? doc.doc_type.replace(/_/g, ' ').toUpperCase() : 'DOCUMENT';

    complianceItems.push({
      id: doc.id,
      name: `${docTypeLabel} Renewal`,
      category: 'compliance',
      docType: doc.doc_type,
      expiryDate: doc.expiry_date,
      daysRemaining: days,
      isOverdue: isExpired,
      isDueSoon: isExpiring,
      expectedCost: doc.doc_type === 'insurance' ? 45000 : 6500,
    });

    if (isExpired) {
      healthScore -= 25; // Illegal to operate in Kenya
    } else if (isExpiring) {
      healthScore -= 12;
    }
  });

  // 3. Check Pending Unscheduled Repair Reports
  vPendingMaint.forEach(pending => {
    if (pending.priority === 'critical') healthScore -= 35;
    else if (pending.priority === 'high') healthScore -= 20;
    else if (pending.priority === 'medium') healthScore -= 10;
    else healthScore -= 5;
  });

  // 4. Check status penalty
  if (vehicle.status === 'maintenance') healthScore = Math.min(healthScore, 65);
  if (vehicle.status === 'decommissioned') healthScore = 0;

  // Clamp health score between 5 and 100
  const finalScore = Math.min(Math.max(Math.round(healthScore), 5), 100);

  let healthStatus = 'peak';
  if (finalScore < 50) healthStatus = 'critical';
  else if (finalScore < 70) healthStatus = 'warning';
  else if (finalScore < 85) healthStatus = 'optimal';

  return {
    vehicleId: vehicle.id,
    registration: vehicle.registration,
    score: finalScore,
    status: healthStatus,
    avgDailyKm,
    currentOdometer: currentOdo,
    dueItems,
    upcomingItems,
    complianceItems,
    pendingRepairs: vPendingMaint,
    completedCount: vCompletedMaint.length,
  };
}

/**
 * Non-Working Day Constraint Satisfaction Scheduler
 *
 * Automatically locates the optimal non-working day for a vehicle:
 * - Sunday: Standard commercial transport rest day across East Africa.
 * - Saturday: Weekend depot service window.
 * - Weekday off-day: Layover days where vehicle has 0 scheduled trips.
 * Ensures zero trip conflicts and allows emergency lead-time.
 */
export function findNextOptimalNonWorkingDay(vehicleId, trips = [], options = {}) {
  const {
    urgency = 'medium',       // 'critical' | 'high' | 'medium' | 'low'
    preferredDays = [0, 6],   // 0 = Sunday, 6 = Saturday
    minLeadDays = urgency === 'critical' ? 1 : urgency === 'high' ? 2 : 3,
    maxSearchDays = 45,
    ignoreTrips = false,
  } = options;

  const candidateList = [];
  const now = new Date();

  // Active or scheduled trips for this vehicle
  const relevantTrips = trips.filter(t =>
    t.vehicle_id === vehicleId &&
    t.status !== 'cancelled'
  );

  for (let offset = minLeadDays; offset <= maxSearchDays; offset++) {
    const candidateDate = new Date();
    candidateDate.setDate(now.getDate() + offset);
    candidateDate.setHours(0, 0, 0, 0);

    const dateStr = formatISODate(candidateDate);
    const dayOfWeek = candidateDate.getDay(); // 0 = Sun, 6 = Sat, 1-5 = Mon-Fri

    // Check 1: Is there a trip conflict?
    let hasTripConflict = false;
    let conflictingTrip = null;

    if (!ignoreTrips) {
      for (const trip of relevantTrips) {
        const depStr = trip.departure_date;
        const arrStr = trip.arrival_date || trip.departure_date;

        if (depStr && dateStr >= depStr && dateStr <= arrStr) {
          hasTripConflict = true;
          conflictingTrip = trip;
          break;
        }
      }
    }

    if (hasTripConflict) continue;

    // Check 2: Evaluate non-working day classification
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekend = isSunday || isSaturday;

    let dayCategory = 'weekday_layover';
    let dayTypeLabel = 'Depot Rest Day (No Scheduled Trips)';
    let priorityWeight = 3; // Weekday layover

    if (isSunday) {
      dayCategory = 'sunday';
      dayTypeLabel = 'Sunday Fleet Rest Day';
      priorityWeight = 1; // Top priority
    } else if (isSaturday) {
      dayCategory = 'saturday';
      dayTypeLabel = 'Saturday Maintenance Window';
      priorityWeight = 2; // Second priority
    }

    // Days formatted for display
    const dayName = candidateDate.toLocaleDateString('en-UK', { weekday: 'long' });
    const formattedDisplay = candidateDate.toLocaleDateString('en-UK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    candidateList.push({
      date: dateStr,
      dayName,
      formattedDisplay,
      dayCategory,
      dayType: dayTypeLabel,
      priorityWeight,
      daysFromNow: offset,
      isNonWorkingDay: true,
      hasTripConflict: false,
    });
  }

  // Sort candidates:
  // 1. By priority weight (Sunday 1st, Saturday 2nd, Layover 3rd)
  // 2. By closeness to now (earliest suitable day)
  candidateList.sort((a, b) => {
    // For critical urgency, prioritize earliest available non-working day
    if (urgency === 'critical') {
      return a.daysFromNow - b.daysFromNow;
    }
    // For normal/high, prioritize Sunday/Saturday then closeness
    if (a.priorityWeight !== b.priorityWeight) {
      return a.priorityWeight - b.priorityWeight;
    }
    return a.daysFromNow - b.daysFromNow;
  });

  const optimal = candidateList[0] || {
    date: formatISODate(new Date(Date.now() + 86400000 * 4)),
    dayName: 'Sunday',
    formattedDisplay: 'Upcoming Sunday',
    dayCategory: 'sunday',
    dayType: 'Sunday Fleet Rest Day',
    priorityWeight: 1,
    daysFromNow: 4,
    isNonWorkingDay: true,
    hasTripConflict: false,
  };

  const alternatives = candidateList.slice(1, 4);

  return {
    optimalDate: optimal.date,
    dayName: optimal.dayName,
    formattedDisplay: optimal.formattedDisplay,
    dayType: optimal.dayType,
    daysFromNow: optimal.daysFromNow,
    reason: `Scheduled on ${optimal.dayType} with 0 freight trip conflicts. Minimizes vehicle downtime.`,
    alternatives,
  };
}

/**
 * Runs fleet-wide maintenance health & schedule roadmap.
 */
export function generateFleetMaintenanceRoadmap(vehicles = [], trips = [], fuelRecords = [], maintenanceRecords = [], documents = []) {
  const fleetHealth = vehicles.map(v =>
    calculateVehicleHealth(v, trips, fuelRecords, maintenanceRecords, documents)
  );

  const averageHealth = fleetHealth.length > 0
    ? Math.round(fleetHealth.reduce((acc, h) => acc + h.score, 0) / fleetHealth.length)
    : 100;

  const peakCount = fleetHealth.filter(h => h.status === 'peak').length;
  const warningCount = fleetHealth.filter(h => h.status === 'warning').length;
  const criticalCount = fleetHealth.filter(h => h.status === 'critical').length;

  // Urgent vehicles needing service
  const actionableVehicles = fleetHealth
    .filter(h => h.dueItems.length > 0 || h.pendingRepairs.length > 0 || h.complianceItems.some(c => c.isOverdue || c.isDueSoon))
    .map(h => {
      const bestSlot = findNextOptimalNonWorkingDay(h.vehicleId, trips, {
        urgency: h.status === 'critical' ? 'critical' : 'medium'
      });
      return {
        ...h,
        recommendedSchedule: bestSlot,
      };
    });

  // Calculate upcoming financial commitments (Finance planning)
  const scheduledServices = maintenanceRecords.filter(m => m.status === 'approved_scheduled');
  const pendingApprovalServices = maintenanceRecords.filter(m => ['pending_ops', 'pending_admin'].includes(m.status));
  const completedServices = maintenanceRecords.filter(m => m.status === 'completed');

  const committedBudget = scheduledServices.reduce((sum, m) => sum + (Number(m.expected_cost) || 0), 0);
  const pendingPipelineBudget = pendingApprovalServices.reduce((sum, m) => sum + (Number(m.expected_cost) || 0), 0);
  const actualSpentTotal = completedServices.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

  // Variance: actual cost vs expected cost for completed services
  const varianceItems = completedServices
    .filter(m => m.expected_cost > 0 && m.cost > 0)
    .map(m => ({
      id: m.id,
      serviceType: m.service_type,
      expected: Number(m.expected_cost),
      actual: Number(m.cost),
      diff: Number(m.cost) - Number(m.expected_cost),
      pct: (((Number(m.cost) - Number(m.expected_cost)) / Number(m.expected_cost)) * 100).toFixed(1),
    }));

  const totalVarianceDiff = varianceItems.reduce((s, v) => s + v.diff, 0);

  return {
    averageHealth,
    peakCount,
    warningCount,
    criticalCount,
    fleetHealth,
    actionableVehicles,
    finance: {
      committedBudget,
      pendingPipelineBudget,
      actualSpentTotal,
      varianceItems,
      totalVarianceDiff,
    },
  };
}
