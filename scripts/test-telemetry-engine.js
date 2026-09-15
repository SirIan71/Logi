/**
 * Automated Test Suite for Telemetry Engine & Live Tracking Mathematics
 * Tests bearing math, polyline interpolation, NTSA speed threshold alerts,
 * fuel consumption models, load state detection, and corridor milestones.
 */

import {
  calculateBearing,
  interpolateCoordinate,
  generateVehicleTelemetry,
  KENYA_WAYPOINTS,
  CORRIDOR_POLYLINES,
} from '../src/utils/telemetryService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 SIRIAN TELEMETRY ENGINE & TRACKING TEST SUITE');
console.log('====================================================\n');

// ── TEST GROUP 1: Waypoints and Corridor Integrity ─────────────
console.log('▶ Test Group 1: Waypoints & Corridors');
assert(KENYA_WAYPOINTS.MOMBASA_PORT && KENYA_WAYPOINTS.MOMBASA_PORT[0] < 0, 'Mombasa Port coordinates valid');
assert(KENYA_WAYPOINTS.NAIROBI_ICD && KENYA_WAYPOINTS.NAIROBI_ICD[0] < 0, 'Nairobi ICD coordinates valid');
assert(KENYA_WAYPOINTS.MALABA_BORDER && KENYA_WAYPOINTS.MALABA_BORDER[0] > 0, 'Malaba Border coordinates valid');
assert(Array.isArray(CORRIDOR_POLYLINES.MOMBASA_NAIROBI) && CORRIDOR_POLYLINES.MOMBASA_NAIROBI.length >= 6, 'Mombasa-Nairobi corridor has adequate waypoints');
assert(Array.isArray(CORRIDOR_POLYLINES.NAIROBI_MALABA) && CORRIDOR_POLYLINES.NAIROBI_MALABA.length >= 6, 'Nairobi-Malaba corridor has adequate waypoints');

// ── TEST GROUP 2: Geographic Bearing Calculation ───────────────
console.log('\n▶ Test Group 2: Bearing Calculation Math');
// Due North: (0, 0) -> (1, 0) => bearing = 0°
const northBearing = calculateBearing([0, 0], [1, 0]);
assert(Math.abs(northBearing - 0) < 0.1, `Due North bearing is ~0° (got ${northBearing.toFixed(1)}°)`);

// Due East: (0, 0) -> (0, 1) => bearing = 90°
const eastBearing = calculateBearing([0, 0], [0, 1]);
assert(Math.abs(eastBearing - 90) < 0.1, `Due East bearing is ~90° (got ${eastBearing.toFixed(1)}°)`);

// Due South: (1, 0) -> (0, 0) => bearing = 180°
const southBearing = calculateBearing([1, 0], [0, 0]);
assert(Math.abs(southBearing - 180) < 0.1, `Due South bearing is ~180° (got ${southBearing.toFixed(1)}°)`);

// Due West: (0, 1) -> (0, 0) => bearing = 270°
const westBearing = calculateBearing([0, 1], [0, 0]);
assert(Math.abs(westBearing - 270) < 0.1, `Due West bearing is ~270° (got ${westBearing.toFixed(1)}°)`);

// Mombasa -> Nairobi (North-West bound)
const msaNboBearing = calculateBearing(KENYA_WAYPOINTS.MOMBASA_PORT, KENYA_WAYPOINTS.NAIROBI_ICD);
assert(msaNboBearing > 270 && msaNboBearing < 360, `Mombasa to Nairobi is North-West bearing (got ${msaNboBearing.toFixed(1)}°)`);

// ── TEST GROUP 3: Polyline Interpolation (Playback Engine) ─────
console.log('\n▶ Test Group 3: Polyline Interpolation');
const samplePolyline = [
  [-4.0435, 39.6682], // A
  [-3.3975, 38.5566], // B
  [-1.2864, 36.8172], // C
];

const startCoord = interpolateCoordinate(samplePolyline, 0);
assert(
  Math.abs(startCoord[0] - samplePolyline[0][0]) < 0.0001 &&
  Math.abs(startCoord[1] - samplePolyline[0][1]) < 0.0001,
  'Interpolation at 0% returns starting coordinate'
);

const endCoord = interpolateCoordinate(samplePolyline, 100);
assert(
  Math.abs(endCoord[0] - samplePolyline[samplePolyline.length - 1][0]) < 0.0001 &&
  Math.abs(endCoord[1] - samplePolyline[samplePolyline.length - 1][1]) < 0.0001,
  'Interpolation at 100% returns terminal coordinate'
);

const midCoord = interpolateCoordinate(samplePolyline, 50);
assert(
  midCoord[0] < samplePolyline[samplePolyline.length - 1][0] &&
  midCoord[0] > samplePolyline[0][0],
  `Interpolation at 50% returns sensible midpoint: [${midCoord[0].toFixed(4)}, ${midCoord[1].toFixed(4)}]`
);

// ── TEST GROUP 4: Vehicle Telemetry Synthesis ──────────────────
console.log('\n▶ Test Group 4: Vehicle Telemetry Synthesis');

const mockVehicle1 = {
  id: 'v-101',
  registration: 'KDF 492X',
  make: 'Scania',
  model: 'R500',
  type: 'Prime Mover',
  fuel_tank_capacity_l: 400,
  assigned_driver_id: 'd-1',
  status: 'active',
};

const mockTripActive = {
  id: 'trip-201',
  vehicle_id: 'v-101',
  status: 'in_progress',
  origin_city: 'Mombasa',
  destination_city: 'Nairobi',
  cargo_description: '2 x 20ft Containers (Textiles)',
  cargo_weight_kg: 26000,
  start_odometer: 145000,
  current_odometer: 145320,
  fuel_consumed_liters: 130,
};

const telemetry1 = generateVehicleTelemetry(mockVehicle1, mockTripActive, 1715000000000);

assert(telemetry1.vehicleId === 'v-101', 'Telemetry vehicle ID matches');
assert(telemetry1.registration === 'KDF 492X', 'Registration matches');
assert(telemetry1.operationStatus === 'laden', `Active cargo detected as 'laden' (got: ${telemetry1.operationStatus})`);
assert(telemetry1.speed >= 0 && telemetry1.speed <= 95, `Speed in reasonable range: ${telemetry1.speed} kph`);
assert(telemetry1.coordinates && telemetry1.coordinates.length === 2, 'Coordinates generated');
assert(telemetry1.coordinates[0] >= -5 && telemetry1.coordinates[0] <= 5, 'Latitude is within East Africa bounds');
assert(telemetry1.coordinates[1] >= 33 && telemetry1.coordinates[1] <= 42, 'Longitude is within East Africa bounds');
assert(telemetry1.heading >= 0 && telemetry1.heading <= 360, `Valid heading bearing: ${telemetry1.heading.toFixed(1)}°`);
assert(telemetry1.fuelPercent >= 0 && telemetry1.fuelPercent <= 100, `Valid fuel tank %: ${telemetry1.fuelPercent}%`);
assert(telemetry1.engine && telemetry1.engine.coolantTempC >= 75 && telemetry1.engine.coolantTempC <= 100, `Sensible coolant temp: ${telemetry1.engine.coolantTempC}°C`);
assert(Array.isArray(telemetry1.breadcrumbs) && telemetry1.breadcrumbs.length > 0, `Breadcrumb trail generated (${telemetry1.breadcrumbs.length} breadcrumbs)`);
assert(typeof telemetry1.nearestMilestone === 'string' && telemetry1.nearestMilestone.length > 0, `Nearest milestone: ${telemetry1.nearestMilestone}`);

// ── TEST GROUP 5: Empty / Deadhead & Idle States ───────────────
console.log('\n▶ Test Group 5: Operational Cargo States (Empty vs Laden vs Idle)');

const mockTripEmpty = {
  id: 'trip-202',
  vehicle_id: 'v-102',
  status: 'in_progress',
  origin_city: 'Nairobi',
  destination_city: 'Mombasa',
  cargo_description: 'Empty Return',
  cargo_weight_kg: 0,
};

const mockVehicle2 = {
  id: 'v-102',
  registration: 'KCG 184M',
  make: 'Mercedes-Benz',
  model: 'Actros 3340',
  type: 'Flatbed',
  status: 'active',
};

const telemetryEmpty = generateVehicleTelemetry(mockVehicle2, mockTripEmpty, 1715000000000);
assert(telemetryEmpty.operationStatus === 'empty', `Empty return trip classified as 'empty' (got: ${telemetryEmpty.operationStatus})`);

const mockVehicleIdle = {
  id: 'v-103',
  registration: 'KBZ 330P',
  make: 'Volvo',
  model: 'FH16',
  type: 'Tanker',
  status: 'idle',
};
const telemetryIdle = generateVehicleTelemetry(mockVehicleIdle, null, 1715000000000);
assert(telemetryIdle.operationStatus === 'idle', `Truck with idle status classified as 'idle' (got: ${telemetryIdle.operationStatus})`);
assert(telemetryIdle.speed === 0, `Idle truck speed is 0 kph (got: ${telemetryIdle.speed})`);

const mockVehicleMaintenance = {
  id: 'v-104',
  registration: 'KDA 771Z',
  make: 'MAN',
  model: 'TGX',
  type: 'Box Truck',
  status: 'maintenance',
};
const telemetryMaint = generateVehicleTelemetry(mockVehicleMaintenance, null, 1715000000000);
assert(telemetryMaint.operationStatus === 'maintenance', `Vehicle in shop classified as 'maintenance' (got: ${telemetryMaint.operationStatus})`);
assert(telemetryMaint.speed === 0, 'Maintenance truck stationary');

// ── TEST GROUP 6: NTSA 80 km/h Overspeeding Rule ───────────────
console.log('\n▶ Test Group 6: Compliance & Safety Rules');
let overspeedDetected = false;
// Run 30 simulated time slices across different vehicle seeds
for (let i = 0; i < 30; i++) {
  const t = generateVehicleTelemetry(mockVehicle1, mockTripActive, 1715000000000 + i * 15000);
  if (t.speed > 80) {
    assert(t.isOverspeeding === true, `Overspeed flag set true when speed is ${t.speed} kph (> 80 kph limit)`);
    overspeedDetected = true;
    break;
  }
}
assert(telemetry1.isOverspeeding === (telemetry1.speed > 80), 'Overspeed flag strictly respects 80 km/h boundary');

console.log('\n====================================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ ALL TELEMETRY ENGINE & TRACKING TESTS PASSED PERFECTLY!\n');
}
