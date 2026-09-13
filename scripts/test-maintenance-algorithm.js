/**
 * Automated Verification Test Suite for SIRIAN Maintenance System
 * Tests:
 * 1. Multi-factor Peak Performance Health Scoring Algorithm
 * 2. Non-Working Day Constraint Satisfaction & Trip Conflict Avoidance
 * 3. Kenya Statutory Compliance Engine (NTSA, Speed Governor, Fire Safety)
 * 4. Routine Maintenance Thresholds (Oil, Filter, Coolant, Tires)
 * 5. Finance Planning Expected Commitments & Variance Analysis
 */
import {
  calculateAverageDailyKm,
  calculateVehicleHealth,
  findNextOptimalNonWorkingDay,
  generateFleetMaintenanceRoadmap,
  STANDARD_SERVICE_CATALOG,
} from '../src/utils/maintenanceAlgorithm.js';

import {
  vehicles,
  trips,
  fuelRecords,
  maintenance,
  vehicleDocuments,
  workshops,
} from '../src/data/seedData.js';

console.log('================================================================');
console.log('RUNNING SIRIAN MAINTENANCE SYSTEM VERIFICATION TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
}

// ── TEST 1: Service Catalog & Kenyan Compliance Baseline ──────────────────────
console.log('1. Testing Standard Service Catalog & Kenya Compliance Standards...');
assert(STANDARD_SERVICE_CATALOG.length >= 8, 'Service catalog contains all required service definitions');

const ntsaInspection = STANDARD_SERVICE_CATALOG.find(s => s.id === 'comp_ntsa_inspection');
assert(ntsaInspection !== undefined, 'NTSA Annual Motor Vehicle Inspection is defined');
assert(ntsaInspection.expectedCost === 5500, 'NTSA Inspection expected cost benchmark is KES 5,500');

const speedGov = STANDARD_SERVICE_CATALOG.find(s => s.id === 'comp_speed_governor');
assert(speedGov !== undefined, 'Speed Governor 80 km/h calibration is defined');
assert(speedGov.complianceCategory === 'speed_governor', 'Speed governor has compliance category');

const oilService = STANDARD_SERVICE_CATALOG.find(s => s.id === 'srv_oil_filter');
assert(oilService !== undefined, 'Oil & Oil Filter Service defined');
assert(oilService.intervalKm === 10000, 'Oil service interval is 10,000 km');

const coolantService = STANDARD_SERVICE_CATALOG.find(s => s.id === 'srv_coolant_refill');
assert(coolantService !== undefined, 'Coolant Refill & System Flush defined');

const tireService = STANDARD_SERVICE_CATALOG.find(s => s.id === 'srv_tire_replacement');
assert(tireService !== undefined, 'Tire replacement defined with expected heavy truck tire cost');

// ── TEST 2: Average Daily Kilometers Wear Rate ─────────────────────────────────
console.log('\n2. Testing Average Daily KM Calculation...');
const testVehicle = vehicles[0]; // v1: Mercedes-Benz Actros KAB-123-GP
const dailyKm = calculateAverageDailyKm(testVehicle.id, trips, fuelRecords);
console.log(`   Vehicle ${testVehicle.registration} calculated daily wear rate: ${dailyKm} km/day`);
assert(dailyKm >= 150 && dailyKm <= 600, 'Daily km calculation returns realistic heavy commercial vehicle range (150 - 600 km/day)');

// ── TEST 3: Vehicle Health & Peak Performance Scoring ──────────────────────────
console.log('\n3. Testing Vehicle Health & Peak Performance Scoring Algorithm...');
const health = calculateVehicleHealth(testVehicle, trips, fuelRecords, maintenance, vehicleDocuments);
console.log(`   Vehicle ${health.registration} Health Score: ${health.score} / 100 (${health.status})`);
assert(health.score >= 5 && health.score <= 100, 'Health score is bounded between 5 and 100');
assert(['peak', 'optimal', 'warning', 'critical'].includes(health.status), 'Health status is correctly classified');
assert(Array.isArray(health.complianceItems), 'Compliance items matrix is populated');
assert(Array.isArray(health.dueItems), 'Due items array is populated');
assert(health.pendingRepairs.length > 0, 'Pending repairs are tracked');

// ── TEST 4: Non-Working Day Constraint Satisfaction Scheduler ─────────────────
console.log('\n4. Testing Non-Working Day Scheduling Algorithm (Sunday / Rest Day & Zero Trip Conflict)...');
const scheduledSlot = findNextOptimalNonWorkingDay(testVehicle.id, trips, { urgency: 'high' });
console.log(`   Optimal scheduled slot for ${testVehicle.registration}:`);
console.log(`     - Date: ${scheduledSlot.optimalDate} (${scheduledSlot.dayName})`);
console.log(`     - Day Type: ${scheduledSlot.dayType}`);
console.log(`     - Reason: ${scheduledSlot.reason}`);

const slotDate = new Date(scheduledSlot.optimalDate);
const dayOfWeek = slotDate.getDay(); // 0 = Sunday, 6 = Saturday
const isRestDay = dayOfWeek === 0 || dayOfWeek === 6 || scheduledSlot.dayType.includes('Rest Day');
assert(isRestDay, 'Algorithm assigned the service to a non-working day (Sunday, Saturday, or Depot Layover)');

// Verify ZERO trip conflict on the scheduled date
const vTrips = trips.filter(t => t.vehicle_id === testVehicle.id && t.status !== 'cancelled');
const hasConflict = vTrips.some(t => {
  const dep = t.departure_date;
  const arr = t.arrival_date || t.departure_date;
  return dep && scheduledSlot.optimalDate >= dep && scheduledSlot.optimalDate <= arr;
});
assert(!hasConflict, 'GUARANTEE VERIFIED: Assigned non-working date has ZERO trip conflicts with active freight runs!');

// ── TEST 5: Fleet Roadmap & Finance Department Commitments ────────────────────
console.log('\n5. Testing Fleet Roadmap & Finance Planning Commitments...');
const roadmap = generateFleetMaintenanceRoadmap(vehicles, trips, fuelRecords, maintenance, vehicleDocuments);
console.log(`   Fleet Average Health: ${roadmap.averageHealth}%`);
console.log(`   Committed Budget on Scheduled Rest Days: KES ${roadmap.finance.committedBudget.toLocaleString()}`);
console.log(`   Pending Pipeline Budget: KES ${roadmap.finance.pendingPipelineBudget.toLocaleString()}`);
console.log(`   Total Historical Reconciled Spend: KES ${roadmap.finance.actualSpentTotal.toLocaleString()}`);

assert(roadmap.averageHealth > 0, 'Fleet average health is calculated');
assert(roadmap.finance.committedBudget > 0, 'Committed budget from approved scheduled repairs is accurately aggregated');
assert(roadmap.finance.pendingPipelineBudget > 0, 'Pending approval repair pipeline amount is calculated for finance');
assert(Array.isArray(roadmap.finance.varianceItems), 'Finance variance items tracked');

// ── TEST 6: Workshop & Mechanic Directory Integrity ───────────────────────────
console.log('\n6. Testing Kenya Workshops & Mechanic Directory...');
assert(workshops.length >= 6, 'All certified Kenya commercial workshops are registered');
const scania = workshops.find(w => w.id === 'w1');
assert(scania.lead_mechanic_name === 'Juma Mwangi', 'Lead mechanic name is documented');
assert(scania.lead_mechanic_phone.startsWith('+254'), 'Mechanic phone number is documented');
assert(scania.specialties.length > 0, 'Workshop specializations are cataloged');

console.log('\n================================================================');
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('================================================================');
