// SIRIAN Mock Data
const drivers = [
  { id: 'd1', name: 'James Moyo', email: 'james@sirian.co', phone: '+27 71 234 5678', role: 'driver', is_active: true },
  { id: 'd2', name: 'Sipho Ndlovu', email: 'sipho@sirian.co', phone: '+27 72 345 6789', role: 'driver', is_active: true },
  { id: 'd3', name: 'Peter Mabena', email: 'peter@sirian.co', phone: '+27 73 456 7890', role: 'driver', is_active: true },
  { id: 'd4', name: 'Thabo Dlamini', email: 'thabo@sirian.co', phone: '+27 74 567 8901', role: 'driver', is_active: true },
  { id: 'd5', name: 'Bongani Khumalo', email: 'bongani@sirian.co', phone: '+27 75 678 9012', role: 'driver', is_active: false },
];

const users = [
  { id: 'u1', name: 'Admin User', email: 'admin@sirian.co', phone: '+27 60 111 2222', role: 'admin', is_active: true, password: 'admin123' },
  { id: 'u2', name: 'Linda Finance', email: 'linda@sirian.co', phone: '+27 60 222 3333', role: 'finance', is_active: true, password: 'finance123' },
  { id: 'u3', name: 'Oscar Ops', email: 'oscar@sirian.co', phone: '+27 60 333 4444', role: 'operations', is_active: true, password: 'ops123' },
  ...drivers,
];

const clients = [
  { id: 'c1', company_name: 'Shoprite Holdings', contact_person: 'Maria van der Berg', email: 'maria@shoprite.co.za', phone: '+27 21 980 1234', address: '1 Shoprite Ln, Cape Town', payment_terms_days: 30, contract_type: 'Monthly', status: 'active' },
  { id: 'c2', company_name: 'PPC Cement', contact_person: 'John Botha', email: 'john@ppc.co.za', phone: '+27 11 386 9000', address: '148 Katherine St, Sandton', payment_terms_days: 14, contract_type: 'Per Trip', status: 'active' },
  { id: 'c3', company_name: 'Sasol Mining', contact_person: 'Nomsa Cele', email: 'nomsa@sasol.co.za', phone: '+27 17 614 2000', address: '1 Sturdee Ave, Rosebank', payment_terms_days: 30, contract_type: 'Contract', status: 'active' },
  { id: 'c4', company_name: 'Tiger Brands', contact_person: 'Pieter Smit', email: 'pieter@tigerbrands.com', phone: '+27 11 840 4000', address: '3010 William Nicol, Bryanston', payment_terms_days: 21, contract_type: 'Monthly', status: 'active' },
  { id: 'c5', company_name: 'Clover Industries', contact_person: 'Sarah Nkosi', email: 'sarah@clover.co.za', phone: '+27 11 987 6543', address: '200 Constantia Dr, Roodepoort', payment_terms_days: 30, contract_type: 'Per Trip', status: 'inactive' },
];

const vehicles = [
  { id: 'v1', registration: 'KAB-123-GP', make: 'Mercedes-Benz', model: 'Actros 2645', year: 2021, capacity_tons: 30, current_odometer: 245000, status: 'active', assigned_driver_id: 'd1', tank_capacity_liters: 400 },
  { id: 'v2', registration: 'KBC-456-GP', make: 'Scania', model: 'R500', year: 2020, capacity_tons: 34, current_odometer: 312000, status: 'active', assigned_driver_id: 'd2', tank_capacity_liters: 450 },
  { id: 'v3', registration: 'KCD-789-GP', make: 'Volvo', model: 'FH 440', year: 2022, capacity_tons: 28, current_odometer: 178000, status: 'active', assigned_driver_id: 'd3', tank_capacity_liters: 380 },
  { id: 'v4', registration: 'KDE-012-GP', make: 'MAN', model: 'TGX 26.560', year: 2019, capacity_tons: 32, current_odometer: 420000, status: 'maintenance', assigned_driver_id: 'd4', tank_capacity_liters: 420 },
  { id: 'v5', registration: 'KEF-345-GP', make: 'DAF', model: 'XF 480', year: 2023, capacity_tons: 26, current_odometer: 95000, status: 'active', assigned_driver_id: null, tank_capacity_liters: 350 },
  { id: 'v6', registration: 'KFG-678-GP', make: 'Isuzu', model: 'FXZ 26-360', year: 2018, capacity_tons: 22, current_odometer: 510000, status: 'decommissioned', assigned_driver_id: null, tank_capacity_liters: 300 },
  { id: 'v7', registration: 'KGH-901-GP', make: 'Mercedes-Benz', model: 'Arocs 3345', year: 2022, capacity_tons: 30, current_odometer: 156000, status: 'active', assigned_driver_id: 'd5', tank_capacity_liters: 400 },
  { id: 'v8', registration: 'KHI-234-GP', make: 'Scania', model: 'G460', year: 2021, capacity_tons: 28, current_odometer: 267000, status: 'active', assigned_driver_id: null, tank_capacity_liters: 380 },
];

const routes = [
  { id: 'r1', name: 'JHB → Durban', origin: 'Johannesburg', destination: 'Durban', distance_km: 568, estimated_fuel_liters: 190, estimated_tolls: 850, estimated_duration_hours: 7, notes: 'N3 highway, busiest corridor' },
  { id: 'r2', name: 'JHB → Cape Town', origin: 'Johannesburg', destination: 'Cape Town', distance_km: 1400, estimated_fuel_liters: 470, estimated_tolls: 1200, estimated_duration_hours: 16, notes: 'N1 highway, long haul' },
  { id: 'r3', name: 'JHB → Maputo', origin: 'Johannesburg', destination: 'Maputo', distance_km: 560, estimated_fuel_liters: 185, estimated_tolls: 650, estimated_duration_hours: 7, notes: 'N4 Maputo corridor, border crossing' },
  { id: 'r4', name: 'Durban → PE', origin: 'Durban', destination: 'Port Elizabeth', distance_km: 680, estimated_fuel_liters: 225, estimated_tolls: 450, estimated_duration_hours: 8, notes: 'N2 coastal route' },
  { id: 'r5', name: 'JHB → Polokwane', origin: 'Johannesburg', destination: 'Polokwane', distance_km: 310, estimated_fuel_liters: 105, estimated_tolls: 350, estimated_duration_hours: 4, notes: 'N1 north' },
  { id: 'r6', name: 'Cape Town → PE', origin: 'Cape Town', destination: 'Port Elizabeth', distance_km: 770, estimated_fuel_liters: 260, estimated_tolls: 380, estimated_duration_hours: 9, notes: 'N2 Garden Route' },
  { id: 'r7', name: 'JHB → Bloemfontein', origin: 'Johannesburg', destination: 'Bloemfontein', distance_km: 400, estimated_fuel_liters: 135, estimated_tolls: 500, estimated_duration_hours: 5, notes: 'N1 south' },
];

const trips = [
  { id: 't1', route_id: 'r1', vehicle_id: 'v1', driver_id: 'd1', client_id: 'c1', origin: 'Johannesburg', destination: 'Durban', cargo_type: 'FMCG Goods', cargo_weight_tons: 28, departure_date: '2026-03-15', arrival_date: '2026-03-15', estimated_distance_km: 568, actual_distance_km: 575, status: 'completed' },
  { id: 't2', route_id: 'r2', vehicle_id: 'v2', driver_id: 'd2', client_id: 'c2', origin: 'Johannesburg', destination: 'Cape Town', cargo_type: 'Cement (Bulk)', cargo_weight_tons: 32, departure_date: '2026-03-16', arrival_date: '2026-03-17', estimated_distance_km: 1400, actual_distance_km: 1415, status: 'completed' },
  { id: 't3', route_id: 'r3', vehicle_id: 'v3', driver_id: 'd3', client_id: 'c3', origin: 'Johannesburg', destination: 'Maputo', cargo_type: 'Mining Equipment', cargo_weight_tons: 25, departure_date: '2026-03-18', arrival_date: '2026-03-18', estimated_distance_km: 560, actual_distance_km: 565, status: 'completed' },
  { id: 't4', route_id: 'r1', vehicle_id: 'v1', driver_id: 'd1', client_id: 'c4', origin: 'Johannesburg', destination: 'Durban', cargo_type: 'Food Products', cargo_weight_tons: 26, departure_date: '2026-03-20', arrival_date: '2026-03-20', estimated_distance_km: 568, actual_distance_km: 570, status: 'completed' },
  { id: 't5', route_id: 'r5', vehicle_id: 'v3', driver_id: 'd3', client_id: 'c1', origin: 'Johannesburg', destination: 'Polokwane', cargo_type: 'FMCG Goods', cargo_weight_tons: 24, departure_date: '2026-03-21', arrival_date: '2026-03-21', estimated_distance_km: 310, actual_distance_km: 315, status: 'completed' },
  { id: 't6', route_id: 'r4', vehicle_id: 'v2', driver_id: 'd2', client_id: 'c2', origin: 'Durban', destination: 'Port Elizabeth', cargo_type: 'Cement (Bagged)', cargo_weight_tons: 30, departure_date: '2026-03-22', arrival_date: '2026-03-22', estimated_distance_km: 680, actual_distance_km: 690, status: 'completed' },
  { id: 't7', route_id: 'r7', vehicle_id: 'v7', driver_id: 'd5', client_id: 'c4', origin: 'Johannesburg', destination: 'Bloemfontein', cargo_type: 'Food Products', cargo_weight_tons: 22, departure_date: '2026-03-23', arrival_date: '2026-03-23', estimated_distance_km: 400, actual_distance_km: 408, status: 'completed' },
  { id: 't8', route_id: 'r2', vehicle_id: 'v1', driver_id: 'd1', client_id: 'c3', origin: 'Johannesburg', destination: 'Cape Town', cargo_type: 'Mining Supplies', cargo_weight_tons: 29, departure_date: '2026-03-25', arrival_date: '2026-03-26', estimated_distance_km: 1400, actual_distance_km: 1408, status: 'completed' },
  { id: 't9', route_id: 'r1', vehicle_id: 'v3', driver_id: 'd3', client_id: 'c1', origin: 'Johannesburg', destination: 'Durban', cargo_type: 'Retail Goods', cargo_weight_tons: 27, departure_date: '2026-03-27', arrival_date: '2026-03-27', estimated_distance_km: 568, actual_distance_km: 572, status: 'completed' },
  { id: 't10', route_id: 'r6', vehicle_id: 'v5', driver_id: 'd4', client_id: 'c5', origin: 'Cape Town', destination: 'Port Elizabeth', cargo_type: 'Dairy Products', cargo_weight_tons: 20, departure_date: '2026-03-28', arrival_date: '2026-03-28', estimated_distance_km: 770, actual_distance_km: 778, status: 'completed' },
  { id: 't11', route_id: 'r3', vehicle_id: 'v2', driver_id: 'd2', client_id: 'c3', origin: 'Johannesburg', destination: 'Maputo', cargo_type: 'Fuel Tanker', cargo_weight_tons: 33, departure_date: '2026-03-29', arrival_date: null, estimated_distance_km: 560, actual_distance_km: null, status: 'in_progress' },
  { id: 't12', route_id: 'r5', vehicle_id: 'v7', driver_id: 'd5', client_id: 'c4', origin: 'Johannesburg', destination: 'Polokwane', cargo_type: 'Packaged Foods', cargo_weight_tons: 23, departure_date: '2026-03-30', arrival_date: null, estimated_distance_km: 310, actual_distance_km: null, status: 'in_progress' },
  { id: 't13', route_id: 'r1', vehicle_id: 'v8', driver_id: 'd1', client_id: 'c2', origin: 'Johannesburg', destination: 'Durban', cargo_type: 'Cement', cargo_weight_tons: 27, departure_date: '2026-04-01', arrival_date: null, estimated_distance_km: 568, actual_distance_km: null, status: 'scheduled' },
  { id: 't14', route_id: 'r2', vehicle_id: 'v3', driver_id: 'd3', client_id: 'c1', origin: 'Johannesburg', destination: 'Cape Town', cargo_type: 'FMCG', cargo_weight_tons: 26, departure_date: '2026-04-03', arrival_date: null, estimated_distance_km: 1400, actual_distance_km: null, status: 'scheduled' },
  { id: 't15', route_id: 'r7', vehicle_id: 'v5', driver_id: 'd4', client_id: 'c4', origin: 'Johannesburg', destination: 'Bloemfontein', cargo_type: 'Beverages', cargo_weight_tons: 21, departure_date: '2026-04-05', arrival_date: null, estimated_distance_km: 400, actual_distance_km: null, status: 'scheduled' },
  { id: 't16', route_id: 'r1', vehicle_id: 'v1', driver_id: 'd1', client_id: 'c1', origin: 'Johannesburg', destination: 'Durban', cargo_type: 'FMCG Goods', cargo_weight_tons: 28, departure_date: '2026-03-10', arrival_date: null, estimated_distance_km: 568, actual_distance_km: 580, status: 'delayed' },
  { id: 't17', route_id: 'r4', vehicle_id: 'v4', driver_id: 'd4', client_id: 'c5', origin: 'Durban', destination: 'Port Elizabeth', cargo_type: 'Dairy', cargo_weight_tons: 18, departure_date: '2026-03-05', arrival_date: null, estimated_distance_km: 680, actual_distance_km: null, status: 'cancelled' },
];

const income = [
  { id: 'i1', trip_id: 't1', client_id: 'c1', invoice_number: 'INV-2026-001', amount: 45000, amount_paid: 45000, payment_status: 'paid', payment_date: '2026-03-20', due_date: '2026-04-15' },
  { id: 'i2', trip_id: 't2', client_id: 'c2', invoice_number: 'INV-2026-002', amount: 85000, amount_paid: 85000, payment_status: 'paid', payment_date: '2026-03-25', due_date: '2026-03-30' },
  { id: 'i3', trip_id: 't3', client_id: 'c3', invoice_number: 'INV-2026-003', amount: 52000, amount_paid: 30000, payment_status: 'partially_paid', payment_date: '2026-03-28', due_date: '2026-04-18' },
  { id: 'i4', trip_id: 't4', client_id: 'c4', invoice_number: 'INV-2026-004', amount: 42000, amount_paid: 42000, payment_status: 'paid', payment_date: '2026-03-28', due_date: '2026-04-10' },
  { id: 'i5', trip_id: 't5', client_id: 'c1', invoice_number: 'INV-2026-005', amount: 28000, amount_paid: 0, payment_status: 'unpaid', payment_date: null, due_date: '2026-04-20' },
  { id: 'i6', trip_id: 't6', client_id: 'c2', invoice_number: 'INV-2026-006', amount: 55000, amount_paid: 55000, payment_status: 'paid', payment_date: '2026-04-01', due_date: '2026-04-05' },
  { id: 'i7', trip_id: 't7', client_id: 'c4', invoice_number: 'INV-2026-007', amount: 32000, amount_paid: 15000, payment_status: 'partially_paid', payment_date: '2026-04-01', due_date: '2026-04-13' },
  { id: 'i8', trip_id: 't8', client_id: 'c3', invoice_number: 'INV-2026-008', amount: 78000, amount_paid: 0, payment_status: 'unpaid', payment_date: null, due_date: '2026-04-25' },
  { id: 'i9', trip_id: 't9', client_id: 'c1', invoice_number: 'INV-2026-009', amount: 44000, amount_paid: 44000, payment_status: 'paid', payment_date: '2026-04-02', due_date: '2026-04-27' },
  { id: 'i10', trip_id: 't10', client_id: 'c5', invoice_number: 'INV-2026-010', amount: 61000, amount_paid: 0, payment_status: 'unpaid', payment_date: null, due_date: '2026-04-28' },
  { id: 'i11', trip_id: 't11', client_id: 'c3', invoice_number: 'INV-2026-011', amount: 50000, amount_paid: 0, payment_status: 'unpaid', payment_date: null, due_date: '2026-04-30' },
  { id: 'i12', trip_id: 't12', client_id: 'c4', invoice_number: 'INV-2026-012', amount: 26000, amount_paid: 0, payment_status: 'unpaid', payment_date: null, due_date: '2026-04-30' },
];

const expenseCategories = [
  { id: 'ec1', name: 'Fuel', default_redeemable: false, icon: 'Fuel' },
  { id: 'ec2', name: 'Repairs & Maintenance', default_redeemable: false, icon: 'Wrench' },
  { id: 'ec3', name: 'Tolls', default_redeemable: true, icon: 'CircleDollarSign' },
  { id: 'ec4', name: 'Driver Allowances', default_redeemable: false, icon: 'Wallet' },
  { id: 'ec5', name: 'Parking', default_redeemable: true, icon: 'ParkingCircle' },
  { id: 'ec6', name: 'Loading / Offloading', default_redeemable: true, icon: 'Package' },
  { id: 'ec7', name: 'Insurance', default_redeemable: false, icon: 'Shield' },
  { id: 'ec8', name: 'Licenses & Permits', default_redeemable: false, icon: 'FileText' },
  { id: 'ec9', name: 'Fines & Penalties', default_redeemable: false, icon: 'AlertTriangle' },
  { id: 'ec10', name: 'Miscellaneous', default_redeemable: false, icon: 'MoreHorizontal' },
];

const expenses = [
  { id: 'e1', trip_id: 't1', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec1', amount: 5700, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-15', notes: 'Fuel JHB-DBN', approval_status: 'approved' },
  { id: 'e2', trip_id: 't1', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec3', amount: 850, is_redeemable: true, is_redeemed: true, expense_date: '2026-03-15', notes: 'N3 Tolls', approval_status: 'approved' },
  { id: 'e3', trip_id: 't1', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec4', amount: 500, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-15', notes: 'Driver daily allowance', approval_status: 'approved' },
  { id: 'e4', trip_id: 't2', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec1', amount: 14100, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-16', notes: 'Fuel JHB-CPT', approval_status: 'approved' },
  { id: 'e5', trip_id: 't2', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec3', amount: 1200, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-16', notes: 'N1 Tolls', approval_status: 'approved' },
  { id: 'e6', trip_id: 't2', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec4', amount: 1000, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-16', notes: 'Driver 2-day allowance', approval_status: 'approved' },
  { id: 'e7', trip_id: 't2', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec6', amount: 1500, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-17', notes: 'Offloading at CPT depot', approval_status: 'approved' },
  { id: 'e8', trip_id: 't3', vehicle_id: 'v3', driver_id: 'd3', category_id: 'ec1', amount: 5550, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-18', notes: 'Fuel JHB-Maputo', approval_status: 'approved' },
  { id: 'e9', trip_id: 't3', vehicle_id: 'v3', driver_id: 'd3', category_id: 'ec3', amount: 650, is_redeemable: true, is_redeemed: true, expense_date: '2026-03-18', notes: 'N4 Tolls', approval_status: 'approved' },
  { id: 'e10', trip_id: 't4', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec1', amount: 5800, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-20', notes: 'Fuel JHB-DBN', approval_status: 'approved' },
  { id: 'e11', trip_id: 't4', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec3', amount: 850, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-20', notes: 'N3 Tolls', approval_status: 'approved' },
  { id: 'e12', trip_id: 't5', vehicle_id: 'v3', driver_id: 'd3', category_id: 'ec1', amount: 3150, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-21', notes: 'Fuel JHB-Polokwane', approval_status: 'approved' },
  { id: 'e13', trip_id: 't5', vehicle_id: 'v3', driver_id: 'd3', category_id: 'ec3', amount: 350, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-21', notes: 'N1 Tolls', approval_status: 'approved' },
  { id: 'e14', trip_id: 't6', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec1', amount: 6750, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-22', notes: 'Fuel DBN-PE', approval_status: 'approved' },
  { id: 'e15', trip_id: 't6', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec3', amount: 450, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-22', notes: 'N2 Tolls', approval_status: 'approved' },
  { id: 'e16', trip_id: 't7', vehicle_id: 'v7', driver_id: 'd5', category_id: 'ec1', amount: 4050, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-23', notes: 'Fuel JHB-BFN', approval_status: 'approved' },
  { id: 'e17', trip_id: 't8', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec1', amount: 14200, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-25', notes: 'Fuel JHB-CPT', approval_status: 'approved' },
  { id: 'e18', trip_id: 't8', vehicle_id: 'v1', driver_id: 'd1', category_id: 'ec3', amount: 1200, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-25', notes: 'N1 Tolls', approval_status: 'approved' },
  { id: 'e19', trip_id: 't9', vehicle_id: 'v3', driver_id: 'd3', category_id: 'ec1', amount: 5600, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-27', notes: 'Fuel JHB-DBN', approval_status: 'approved' },
  { id: 'e20', trip_id: 't10', vehicle_id: 'v5', driver_id: 'd4', category_id: 'ec1', amount: 7800, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-28', notes: 'Fuel CPT-PE', approval_status: 'approved' },
  { id: 'e21', trip_id: null, vehicle_id: 'v4', driver_id: null, category_id: 'ec2', amount: 18500, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-28', notes: 'Engine overhaul MAN TGX', approval_status: 'approved' },
  { id: 'e22', trip_id: null, vehicle_id: 'v1', driver_id: null, category_id: 'ec7', amount: 35000, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-01', notes: 'Annual insurance MB Actros', approval_status: 'approved' },
  { id: 'e23', trip_id: null, vehicle_id: 'v2', driver_id: null, category_id: 'ec8', amount: 4500, is_redeemable: false, is_redeemed: false, expense_date: '2026-03-05', notes: 'Operating license renewal', approval_status: 'approved' },
  { id: 'e24', trip_id: 't11', vehicle_id: 'v2', driver_id: 'd2', category_id: 'ec5', amount: 250, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-29', notes: 'Overnight parking', approval_status: 'pending' },
  { id: 'e25', trip_id: 't12', vehicle_id: 'v7', driver_id: 'd5', category_id: 'ec6', amount: 800, is_redeemable: true, is_redeemed: false, expense_date: '2026-03-30', notes: 'Loading at warehouse', approval_status: 'pending' },
];

const fuelRecords = [
  { id: 'f1', vehicle_id: 'v1', trip_id: 't1', recorded_by: 'd1', liters: 190, cost: 5700, odometer_reading: 243500, station: 'Engen Midrand', date: '2026-03-15' },
  { id: 'f2', vehicle_id: 'v2', trip_id: 't2', recorded_by: 'd2', liters: 235, cost: 7050, odometer_reading: 310000, station: 'Shell Alberton', date: '2026-03-16' },
  { id: 'f3', vehicle_id: 'v2', trip_id: 't2', recorded_by: 'd2', liters: 235, cost: 7050, odometer_reading: 310700, station: 'BP Beaufort West', date: '2026-03-16' },
  { id: 'f4', vehicle_id: 'v3', trip_id: 't3', recorded_by: 'd3', liters: 185, cost: 5550, odometer_reading: 176500, station: 'Total Witbank', date: '2026-03-18' },
  { id: 'f5', vehicle_id: 'v1', trip_id: 't4', recorded_by: 'd1', liters: 193, cost: 5800, odometer_reading: 244100, station: 'Engen Midrand', date: '2026-03-20' },
  { id: 'f6', vehicle_id: 'v3', trip_id: 't5', recorded_by: 'd3', liters: 105, cost: 3150, odometer_reading: 177100, station: 'Sasol Pretoria', date: '2026-03-21' },
  { id: 'f7', vehicle_id: 'v2', trip_id: 't6', recorded_by: 'd2', liters: 225, cost: 6750, odometer_reading: 311500, station: 'Caltex Durban', date: '2026-03-22' },
  { id: 'f8', vehicle_id: 'v7', trip_id: 't7', recorded_by: 'd5', liters: 135, cost: 4050, odometer_reading: 155100, station: 'BP Vereeniging', date: '2026-03-23' },
  { id: 'f9', vehicle_id: 'v1', trip_id: 't8', recorded_by: 'd1', liters: 240, cost: 7200, odometer_reading: 244700, station: 'Shell Alberton', date: '2026-03-25' },
  { id: 'f10', vehicle_id: 'v1', trip_id: 't8', recorded_by: 'd1', liters: 233, cost: 7000, odometer_reading: 245400, station: 'Engen Three Sisters', date: '2026-03-25' },
  { id: 'f11', vehicle_id: 'v3', trip_id: 't9', recorded_by: 'd3', liters: 187, cost: 5600, odometer_reading: 177500, station: 'Total Heidelberg', date: '2026-03-27' },
  { id: 'f12', vehicle_id: 'v5', trip_id: 't10', recorded_by: 'd4', liters: 260, cost: 7800, odometer_reading: 94200, station: 'BP Cape Town', date: '2026-03-28' },
];

const maintenance = [
  { id: 'm1', vehicle_id: 'v1', type: 'scheduled', service_type: 'Full Service', description: 'Oil change, filter replacement, brake inspection', cost: 8500, service_date: '2026-02-15', odometer_at_service: 240000, next_due_km: 260000, next_due_date: '2026-05-15', vendor: 'Mercedes-Benz Centurion' },
  { id: 'm2', vehicle_id: 'v2', type: 'scheduled', service_type: 'Oil Service', description: 'Engine oil and filter change', cost: 4200, service_date: '2026-03-01', odometer_at_service: 308000, next_due_km: 328000, next_due_date: '2026-06-01', vendor: 'Scania Kempton Park' },
  { id: 'm3', vehicle_id: 'v3', type: 'scheduled', service_type: 'Full Service', description: 'Complete service including brakes and clutch', cost: 12000, service_date: '2026-01-20', odometer_at_service: 165000, next_due_km: 185000, next_due_date: '2026-04-20', vendor: 'Volvo Trucks Isando' },
  { id: 'm4', vehicle_id: 'v4', type: 'unscheduled', service_type: 'Engine Repair', description: 'Engine overhaul — cylinder head replacement', cost: 18500, service_date: '2026-03-28', odometer_at_service: 420000, next_due_km: 440000, next_due_date: '2026-06-28', vendor: 'MAN Truck Centre JHB' },
  { id: 'm5', vehicle_id: 'v5', type: 'scheduled', service_type: 'Oil Service', description: 'Oil and filter change', cost: 3800, service_date: '2026-03-10', odometer_at_service: 92000, next_due_km: 112000, next_due_date: '2026-06-10', vendor: 'DAF Dealer Germiston' },
  { id: 'm6', vehicle_id: 'v7', type: 'scheduled', service_type: 'Brake Service', description: 'Brake pad replacement and disc inspection', cost: 6500, service_date: '2026-02-01', odometer_at_service: 150000, next_due_km: 170000, next_due_date: '2026-05-01', vendor: 'Mercedes-Benz Centurion' },
];

const vehicleDocuments = [
  { id: 'vd1', vehicle_id: 'v1', doc_type: 'insurance', issue_date: '2026-03-01', expiry_date: '2027-02-28' },
  { id: 'vd2', vehicle_id: 'v1', doc_type: 'license', issue_date: '2026-01-15', expiry_date: '2027-01-14' },
  { id: 'vd3', vehicle_id: 'v2', doc_type: 'insurance', issue_date: '2025-09-01', expiry_date: '2026-08-31' },
  { id: 'vd4', vehicle_id: 'v2', doc_type: 'license', issue_date: '2026-03-05', expiry_date: '2027-03-04' },
  { id: 'vd5', vehicle_id: 'v3', doc_type: 'insurance', issue_date: '2026-02-01', expiry_date: '2027-01-31' },
  { id: 'vd6', vehicle_id: 'v3', doc_type: 'fitness', issue_date: '2025-06-01', expiry_date: '2026-05-31' },
  { id: 'vd7', vehicle_id: 'v4', doc_type: 'insurance', issue_date: '2025-07-01', expiry_date: '2026-06-30' },
  { id: 'vd8', vehicle_id: 'v5', doc_type: 'insurance', issue_date: '2026-01-01', expiry_date: '2026-12-31' },
  { id: 'vd9', vehicle_id: 'v7', doc_type: 'insurance', issue_date: '2025-11-01', expiry_date: '2026-10-31' },
  { id: 'vd10', vehicle_id: 'v7', doc_type: 'inspection', issue_date: '2025-12-01', expiry_date: '2026-05-31' },
];

const auditLogs = [
  { id: 'al1', user_id: 'u3', entity_type: 'trip', entity_id: 't1', action: 'create', old_values: null, new_values: { status: 'scheduled' }, created_at: '2026-03-14T08:00:00Z' },
  { id: 'al2', user_id: 'u3', entity_type: 'trip', entity_id: 't1', action: 'update', old_values: { status: 'scheduled' }, new_values: { status: 'in_progress' }, created_at: '2026-03-15T06:00:00Z' },
  { id: 'al3', user_id: 'u3', entity_type: 'trip', entity_id: 't1', action: 'update', old_values: { status: 'in_progress' }, new_values: { status: 'completed' }, created_at: '2026-03-15T15:00:00Z' },
  { id: 'al4', user_id: 'u2', entity_type: 'income', entity_id: 'i1', action: 'create', old_values: null, new_values: { amount: 45000, payment_status: 'unpaid' }, created_at: '2026-03-16T09:00:00Z' },
  { id: 'al5', user_id: 'u2', entity_type: 'income', entity_id: 'i1', action: 'update', old_values: { payment_status: 'unpaid' }, new_values: { payment_status: 'paid', amount_paid: 45000 }, created_at: '2026-03-20T14:00:00Z' },
  { id: 'al6', user_id: 'u1', entity_type: 'vehicle', entity_id: 'v4', action: 'update', old_values: { status: 'active' }, new_values: { status: 'maintenance' }, created_at: '2026-03-28T10:00:00Z' },
  { id: 'al7', user_id: 'u2', entity_type: 'expense', entity_id: 'e21', action: 'update', old_values: { approval_status: 'pending' }, new_values: { approval_status: 'approved' }, created_at: '2026-03-28T12:00:00Z' },
  { id: 'al8', user_id: 'u3', entity_type: 'trip', entity_id: 't11', action: 'create', old_values: null, new_values: { status: 'scheduled' }, created_at: '2026-03-28T16:00:00Z' },
];

export { users, drivers, clients, vehicles, routes, trips, income, expenses, expenseCategories, fuelRecords, maintenance, vehicleDocuments, auditLogs };
