/**
 * SIRIAN Fleet Real-Time Telemetry & Tracking Engine
 *
 * Models real-world freight corridors across Kenya and East Africa:
 * - Mombasa Port ↔ Nairobi ICD (A109 corridor)
 * - Nairobi ↔ Nakuru ↔ Eldoret ↔ Malaba Border (A104 Northern Corridor)
 * - Nakuru ↔ Kericho ↔ Kisumu Port (B1 Lake Victoria Corridor)
 *
 * Simulates real-time telemetry:
 * - Live GPS location, bearing/heading rotation
 * - Operational status: Laden (On Work) vs Empty (Deadhead) vs Idle vs Maintenance
 * - Speed (km/h) with NTSA 80 km/h legal limit compliance
 * - Fuel tank level (% and liters), consumption rate, remaining range
 * - Trip timestamps: Departure time, elapsed driving duration, dynamic ETA
 * - Trip history breadcrumbs for interactive playback scrubber
 */

// ── Key Geographic Corridors & Milestones in Kenya ───────────────────────────
export const KENYA_WAYPOINTS = {
  mombasa_port: { name: 'Mombasa Port Terminal', lat: -4.0435, lng: 39.6682, type: 'port' },
  mariakani:     { name: 'Mariakani Weighbridge', lat: -3.8647, lng: 39.4674, type: 'weighbridge' },
  voi:           { name: 'Voi Transit Stop', lat: -3.3967, lng: 38.5566, type: 'rest_stop' },
  mtito_andei:   { name: 'Mtito Andei Rest Stop', lat: -2.6896, lng: 38.1672, type: 'rest_stop' },
  sultan_hamud:  { name: 'Sultan Hamud Corridor Hub', lat: -2.0167, lng: 37.3667, type: 'town' },
  athi_river:    { name: 'Athi River Weighbridge', lat: -1.4468, lng: 36.9856, type: 'weighbridge' },
  nairobi_icd:   { name: 'Nairobi ICD Embakasi', lat: -1.3328, lng: 36.8872, type: 'depot' },
  nairobi_cbd:   { name: 'Nairobi Central Depot', lat: -1.2864, lng: 36.8172, type: 'depot' },
  naivasha_port: { name: 'Naivasha Inland Dry Port', lat: -0.7172, lng: 36.4310, type: 'depot' },
  gilgil:        { name: 'Gilgil Weighbridge', lat: -0.4933, lng: 36.2867, type: 'weighbridge' },
  nakuru:        { name: 'Nakuru Transit Hub', lat: -0.3031, lng: 36.0800, type: 'depot' },
  salgaa:        { name: 'Salgaa Commercial Stop', lat: -0.2185, lng: 35.8456, type: 'rest_stop' },
  eldoret:       { name: 'Eldoret Logistics Hub', lat: 0.5143, lng: 35.2698, type: 'depot' },
  webuye:        { name: 'Webuye Transit Station', lat: 0.5975, lng: 34.7711, type: 'town' },
  malaba:        { name: 'Malaba One-Stop Border', lat: 0.6333, lng: 34.2750, type: 'border' },
  kericho:       { name: 'Kericho Transit Station', lat: -0.3689, lng: 35.2863, type: 'town' },
  kisumu_port:   { name: 'Kisumu Pier & Port', lat: -0.0917, lng: 34.7680, type: 'port' },
};

// ── Corridors Coordinate Polylines ───────────────────────────────────────────
// Sequence of coordinates tracing real East African freight highways
export const CORRIDOR_POLYLINES = {
  // Corridor 1: Mombasa Port → Nairobi ICD (480 km, A109)
  mombasa_nairobi: [
    [-4.0435, 39.6682], // Mombasa Port
    [-3.9850, 39.5800], // Changamwe
    [-3.8647, 39.4674], // Mariakani
    [-3.6500, 39.1200], // Samburu
    [-3.5200, 38.8500], // Mackinnon Road
    [-3.3967, 38.5566], // Voi
    [-3.0500, 38.3500], // Manyani
    [-2.6896, 38.1672], // Mtito Andei
    [-2.4200, 37.9500], // Kibwezi
    [-2.2300, 37.7500], // Makindu
    [-2.1200, 37.5800], // Emali
    [-2.0167, 37.3667], // Sultan Hamud
    [-1.7500, 37.1500], // Machakos Junction
    [-1.4468, 36.9856], // Athi River Weighbridge
    [-1.3328, 36.8872], // Nairobi ICD
  ],

  // Corridor 2: Nairobi → Nakuru → Eldoret → Malaba Border (450 km, A104)
  nairobi_malaba: [
    [-1.2864, 36.8172], // Nairobi CBD
    [-1.1500, 36.6500], // Limuru Escarpment
    [-0.7172, 36.4310], // Naivasha Dry Port
    [-0.4933, 36.2867], // Gilgil Weighbridge
    [-0.3031, 36.0800], // Nakuru
    [-0.2185, 35.8456], // Salgaa
    [-0.1500, 35.6000], // Mau Summit
    [0.0500, 35.3800],  // Timboroa
    [0.3200, 35.3100],  // Burnt Forest
    [0.5143, 35.2698],  // Eldoret
    [0.5800, 35.0500],  // Turbo
    [0.5975, 34.7711],  // Webuye
    [0.6100, 34.5500],  // Bungoma
    [0.6333, 34.2750],  // Malaba One-Stop Border
  ],

  // Corridor 3: Nakuru → Kericho → Kisumu Port (180 km, B1)
  nakuru_kisumu: [
    [-0.3031, 36.0800], // Nakuru
    [-0.2185, 35.8456], // Salgaa
    [-0.1500, 35.6000], // Mau Summit
    [-0.2500, 35.4000], // Londiani
    [-0.3689, 35.2863], // Kericho
    [-0.2800, 35.0500], // Awasi
    [-0.1800, 34.9000], // Ahero
    [-0.0917, 34.7680], // Kisumu Port
  ],
};

// Aliases for convenience
KENYA_WAYPOINTS.MOMBASA_PORT = [-4.0435, 39.6682];
KENYA_WAYPOINTS.NAIROBI_ICD = [-1.3328, 36.8872];
KENYA_WAYPOINTS.MALABA_BORDER = [0.6333, 34.2750];
KENYA_WAYPOINTS.NAIROBI_CBD = [-1.2864, 36.8172];
KENYA_WAYPOINTS.KISUMU_PORT = [-0.0917, 34.7680];

CORRIDOR_POLYLINES.MOMBASA_NAIROBI = CORRIDOR_POLYLINES.mombasa_nairobi;
CORRIDOR_POLYLINES.NAIROBI_MALABA = CORRIDOR_POLYLINES.nairobi_malaba;
CORRIDOR_POLYLINES.NAKURU_KISUMU = CORRIDOR_POLYLINES.nakuru_kisumu;

/**
 * Calculates bearing angle in degrees between two coordinate points
 * Accepts either:
 * - calculateBearing([lat1, lng1], [lat2, lng2])
 * - calculateBearing(lat1, lng1, lat2, lng2)
 */
export function calculateBearing(startLatOrCoord1, startLngOrCoord2, destLat, destLng) {
  let lat1, lon1, lat2, lon2;
  if (Array.isArray(startLatOrCoord1) && Array.isArray(startLngOrCoord2)) {
    lat1 = startLatOrCoord1[0];
    lon1 = startLatOrCoord1[1];
    lat2 = startLngOrCoord2[0];
    lon2 = startLngOrCoord2[1];
  } else {
    lat1 = startLatOrCoord1;
    lon1 = startLngOrCoord2;
    lat2 = destLat;
    lon2 = destLng;
  }

  const startLatRad = (lat1 * Math.PI) / 180;
  const startLngRad = (lon1 * Math.PI) / 180;
  const destLatRad = (lat2 * Math.PI) / 180;
  const destLngRad = (lon2 * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Linear interpolation between two coordinates along a polyline
 */
export function interpolateCoordinate(polyline, progressPercent) {
  if (!polyline || polyline.length === 0) return [-1.2864, 36.8172];
  if (progressPercent <= 0) return polyline[0];
  if (progressPercent >= 100) return polyline[polyline.length - 1];

  const totalSegments = polyline.length - 1;
  const segmentFraction = (progressPercent / 100) * totalSegments;
  const segmentIndex = Math.floor(segmentFraction);
  const remainder = segmentFraction - segmentIndex;

  if (segmentIndex >= totalSegments) return polyline[totalSegments];

  const p1 = polyline[segmentIndex];
  const p2 = polyline[segmentIndex + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * remainder;
  const lng = p1[1] + (p2[1] - p1[1]) * remainder;

  return [lat, lng];
}

/**
 * Maps vehicles to active corridors and computes live telemetry
 */
export function generateVehicleTelemetry(vehicle, activeTrip = null, timeSeed = Date.now()) {
  const isMaintenance = vehicle.status === 'maintenance';
  const isDecommissioned = vehicle.status === 'decommissioned';
  const isExplicitIdle = vehicle.status === 'idle';

  // Seed variations using vehicle ID
  const hash = (vehicle.id || 'v1').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cycleTime = ((timeSeed / 1000 + hash * 17) % 600) / 600; // 0 to 1 loop over 10 minutes

  // Default baseline corridor assignment
  let corridorKey = 'mombasa_nairobi';
  let corridorName = 'Mombasa ↔ Nairobi (A109)';
  let originName = 'Mombasa Port';
  let destinationName = 'Nairobi ICD';

  if (hash % 3 === 1) {
    corridorKey = 'nairobi_malaba';
    corridorName = 'Nairobi ↔ Malaba Border (A104)';
    originName = 'Nairobi Central';
    destinationName = 'Malaba Border';
  } else if (hash % 3 === 2) {
    corridorKey = 'nakuru_kisumu';
    corridorName = 'Nakuru ↔ Kisumu Port (B1)';
    originName = 'Nakuru Depot';
    destinationName = 'Kisumu Pier';
  }

  // Override with active trip if present
  if (activeTrip) {
    originName = activeTrip.origin_city || activeTrip.origin || originName;
    destinationName = activeTrip.destination_city || activeTrip.destination || destinationName;
    corridorName = `${originName} → ${destinationName}`;
  }

  const polyline = CORRIDOR_POLYLINES[corridorKey] || CORRIDOR_POLYLINES.mombasa_nairobi;

  // Determine operational state
  let operationStatus = 'laden'; // 'laden' | 'empty' | 'idle' | 'maintenance'
  let isLaden = true;
  let cargoDescription = '28 Tons — FMCG Goods (Dry Freight)';
  let cargoWeightTons = vehicle.capacity_tons ? vehicle.capacity_tons * 0.9 : 28;
  let clientName = 'Shoprite East Africa / Naivas Distribution';

  if (isMaintenance) {
    operationStatus = 'maintenance';
    isLaden = false;
    cargoDescription = 'Vehicle Undergoing Maintenance';
  } else if (isExplicitIdle) {
    operationStatus = 'idle';
    isLaden = false;
    cargoDescription = 'Stationary at Depot Yard (Awaiting Dispatch)';
  } else if (activeTrip) {
    const desc = activeTrip.cargo_description || activeTrip.cargo_type || '';
    const weight = activeTrip.cargo_weight_tons || (activeTrip.cargo_weight_kg ? activeTrip.cargo_weight_kg / 1000 : 0);
    const isExplicitEmpty = desc.toLowerCase().includes('empty') || (activeTrip.cargo_weight_kg === 0 && !activeTrip.cargo_type);
    isLaden = !isExplicitEmpty && (desc.length > 0 || weight > 0);
    operationStatus = isLaden ? 'laden' : 'empty';
    cargoDescription = desc || (isLaden ? 'Laden Freight' : 'Empty / Deadhead Return');
    cargoWeightTons = weight || (isLaden ? 26 : 0);
  } else if (hash % 4 === 0) {
    operationStatus = 'empty';
    isLaden = false;
    cargoDescription = 'Empty / Deadhead (Returning to Depot)';
    cargoWeightTons = 0;
    clientName = 'Internal Fleet Repositioning';
  } else if (hash % 5 === 0 && cycleTime > 0.8) {
    operationStatus = 'idle';
    isLaden = false;
    cargoDescription = 'Parked / Idling at Commercial Rest Stop';
  }

  // Calculate live progress % (0 - 100)
  let progressPercent = Math.min(Math.max(Math.round(cycleTime * 100), 2), 98);
  if (operationStatus === 'idle') progressPercent = 50; // At midpoint rest stop
  if (operationStatus === 'maintenance') progressPercent = 0; // At depot workshop

  // Current coordinate & bearing
  const currentCoords = interpolateCoordinate(polyline, progressPercent);
  const nextTargetCoords = interpolateCoordinate(polyline, Math.min(progressPercent + 2, 100));
  const heading = calculateBearing(
    currentCoords[0],
    currentCoords[1],
    nextTargetCoords[0],
    nextTargetCoords[1]
  );

  // Speed calculation with NTSA 80 km/h compliance
  let currentSpeed = 0;
  if (operationStatus === 'maintenance' || operationStatus === 'idle') {
    currentSpeed = 0;
  } else {
    // Cruising speed between 62 and 78 km/h, with occasional slight overspeed for testing alerts
    const speedNoise = Math.sin(timeSeed / 4000 + hash) * 8;
    currentSpeed = Math.round(68 + speedNoise);
    // Force one truck to exhibit overspeeding alert for compliance verification
    if (vehicle.id === 'v2') {
      currentSpeed = 86; // Over NTSA 80 km/h limit!
    }
  }

  const isOverspeeding = currentSpeed > 80;

  // Fuel calculation
  const tankCapacity = vehicle.tank_capacity_liters || 400;
  // Fuel drains as journey progresses
  const fuelPercentRemaining = Math.max(15, Math.round(88 - (progressPercent * 0.6)));
  const fuelLitersRemaining = Math.round((fuelPercentRemaining / 100) * tankCapacity);
  const currentBurnRate = operationStatus === 'idle' ? 3.5 : isLaden ? 34.8 : 28.2; // L/100km
  const estimatedRangeKm = Math.round((fuelLitersRemaining / (currentBurnRate || 32)) * 100);
  const isLowFuel = fuelPercentRemaining <= 20;

  // Trip timings
  const totalCorridorKm = 480;
  const distanceCoveredKm = Math.round((progressPercent / 100) * totalCorridorKm);
  const distanceRemainingKm = Math.max(0, totalCorridorKm - distanceCoveredKm);

  // Timestamps
  const now = new Date(timeSeed);
  const elapsedHours = distanceCoveredKm / Math.max(currentSpeed || 65, 30);
  const departureTimestamp = new Date(now.getTime() - elapsedHours * 3600 * 1000).toLocaleTimeString('en-UK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hoursToArrival = distanceRemainingKm / Math.max(currentSpeed || 65, 45);
  const etaTimestamp = new Date(now.getTime() + hoursToArrival * 3600 * 1000).toLocaleTimeString('en-UK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Nearest milestone along corridor
  let nearestMilestone = 'En Route A109 Corridor';
  if (corridorKey === 'mombasa_nairobi') {
    if (progressPercent < 15) nearestMilestone = 'Near Mariakani Weighbridge';
    else if (progressPercent < 40) nearestMilestone = 'Passing Voi Transit Corridor';
    else if (progressPercent < 60) nearestMilestone = 'Mtito Andei Rest Zone';
    else if (progressPercent < 85) nearestMilestone = 'Approaching Athi River Weighbridge';
    else nearestMilestone = 'Arriving Nairobi ICD';
  } else if (corridorKey === 'nairobi_malaba') {
    if (progressPercent < 25) nearestMilestone = 'Naivasha Dry Port';
    else if (progressPercent < 50) nearestMilestone = 'Approaching Gilgil Weighbridge';
    else if (progressPercent < 75) nearestMilestone = 'Eldoret Hub Ascent';
    else nearestMilestone = 'Approaching Malaba Border';
  } else {
    nearestMilestone = 'Kericho Highland Route';
  }

  // Generate historical breadcrumbs for scrubber playback
  const breadcrumbs = [];
  const totalCrumbSteps = 20;
  for (let step = 0; step <= totalCrumbSteps; step++) {
    const p = (step / totalCrumbSteps) * progressPercent;
    const coord = interpolateCoordinate(polyline, p);
    breadcrumbs.push({
      step,
      progress: p,
      lat: coord[0],
      lng: coord[1],
      timestamp: new Date(now.getTime() - (elapsedHours * (1 - p / progressPercent)) * 3600 * 1000).toLocaleTimeString('en-UK', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return {
    vehicleId: vehicle.id,
    registration: vehicle.registration,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    assignedDriverId: vehicle.assigned_driver_id,
    corridorKey,
    corridorName,
    originName,
    destinationName,
    coordinates: currentCoords,
    heading: Math.round(heading),
    polyline,
    progressPercent,
    operationStatus, // 'laden' | 'empty' | 'idle' | 'maintenance'
    isLaden,
    cargoDescription,
    cargoWeightTons,
    clientName,
    speed: currentSpeed,
    isOverspeeding,
    fuelPercent: fuelPercentRemaining,
    fuelLiters: fuelLitersRemaining,
    tankCapacity,
    burnRate: currentBurnRate,
    estimatedRangeKm,
    isLowFuel,
    totalDistanceKm: totalCorridorKm,
    distanceCoveredKm,
    distanceRemainingKm,
    departureTime: departureTimestamp,
    eta: etaTimestamp,
    elapsedHours: elapsedHours.toFixed(1),
    hoursToArrival: hoursToArrival.toFixed(1),
    nearestMilestone,
    engine: {
      status: operationStatus === 'maintenance' ? 'Off' : operationStatus === 'idle' ? 'Idling' : 'Running',
      rpm: currentSpeed > 0 ? Math.round(1350 + (currentSpeed / 80) * 400) : 650,
      coolantTempC: operationStatus === 'maintenance' ? 24 : 88,
      oilPressureBar: operationStatus === 'maintenance' ? 0 : 4.3,
      batteryVoltage: 27.8,
    },
    breadcrumbs,
  };
}
