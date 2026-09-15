import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Locate, Layers, Maximize2 } from 'lucide-react';

export default function FleetMap({
  telemetryList = [],
  selectedVehicleId = null,
  onSelectVehicle,
  followMode = false,
  onToggleFollowMode,
  playbackPosition = null, // [lat, lng] override during scrubber playback
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const activeRoutePolylineRef = useRef(null);
  const breadcrumbLayerRef = useRef(null);
  const endpointMarkersRef = useRef([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Kenya Northern Corridor (between Nairobi and Mtito Andei)
    const map = L.map(mapContainerRef.current, {
      center: [-1.2864, 36.8172],
      zoom: 7,
      zoomControl: false,
    });

    // High performance Carto Voyager / Positron tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Fit bounds to Southern/Central Kenya freight corridor initially
    const initialBounds = L.latLngBounds([
      [-4.1, 39.7], // Mombasa
      [0.65, 34.2], // Malaba
    ]);
    map.fitBounds(initialBounds, { padding: [40, 40] });

    // Setup ResizeObserver to smoothly invalidate map size on container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Truck Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Retain markers for existing vehicles, remove stale
    const currentVehicleIds = new Set(telemetryList.map(t => t.vehicleId));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentVehicleIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    telemetryList.forEach(t => {
      const isSelected = t.vehicleId === selectedVehicleId;
      // Use playback position override if scrubbing active truck
      const pos = (isSelected && playbackPosition) ? playbackPosition : t.coordinates;
      if (!pos || !pos[0] || !pos[1]) return;

      // Color coding by operational status
      let haloColor = '#10b981'; // Green: Laden
      let statusBg = 'bg-emerald-500';
      if (t.isOverspeeding) {
        haloColor = '#ef4444'; // Red: Overspeed
        statusBg = 'bg-red-500';
      } else if (t.operationStatus === 'empty') {
        haloColor = '#3b82f6'; // Blue: Empty
        statusBg = 'bg-blue-500';
      } else if (t.operationStatus === 'idle') {
        haloColor = '#f59e0b'; // Amber: Idle
        statusBg = 'bg-amber-500';
      } else if (t.operationStatus === 'maintenance') {
        haloColor = '#8b5cf6'; // Purple: Maintenance
        statusBg = 'bg-purple-500';
      }

      // Custom HTML Marker with Rotating Truck Arrow
      const markerHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <!-- Pulse Halo Beacon -->
          <div class="absolute -inset-2 rounded-full opacity-60 animate-ping" style="background-color: ${haloColor};"></div>
          
          <!-- Outer Badge Ring -->
          <div class="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
            isSelected ? 'border-white scale-125 z-30 ring-4 ring-lime-400' : 'border-slate-900'
          }" style="background: #0f172a;">
            
            <!-- Rotating Heading Arrow / Truck Cab -->
            <div style="transform: rotate(${t.heading}deg); transition: transform 0.4s ease;" class="flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${haloColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            
            <!-- Status Dot Indicator -->
            <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusBg} border border-white"></span>
          </div>

          <!-- Registration Tag Pill -->
          <div class="absolute left-1/2 -translate-x-1/2 top-11 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 shadow-md whitespace-nowrap text-[10px] font-extrabold flex items-center gap-1 pointer-events-none">
            <span>${t.registration}</span>
            <span class="text-lime-400 font-bold">${t.speed}kph</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-truck-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (markersRef.current[t.vehicleId]) {
        // Move existing marker smoothly
        markersRef.current[t.vehicleId].setLatLng(pos);
        markersRef.current[t.vehicleId].setIcon(customIcon);
      } else {
        // Create new marker
        const marker = L.marker(pos, { icon: customIcon }).addTo(map);
        marker.on('click', () => onSelectVehicle?.(t.vehicleId));
        markersRef.current[t.vehicleId] = marker;
      }
    });

    // Pan to selected vehicle if followMode is enabled
    if (selectedVehicleId && followMode) {
      const activeTruck = telemetryList.find(t => t.vehicleId === selectedVehicleId);
      const centerPos = playbackPosition || activeTruck?.coordinates;
      if (centerPos) {
        map.panTo(centerPos, { animate: true, duration: 1 });
      }
    }
  }, [telemetryList, selectedVehicleId, followMode, playbackPosition, onSelectVehicle]);

  // Update Active Route Polyline, Breadcrumbs, & Endpoint Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous route layers
    if (activeRoutePolylineRef.current) {
      activeRoutePolylineRef.current.remove();
      activeRoutePolylineRef.current = null;
    }
    if (breadcrumbLayerRef.current) {
      breadcrumbLayerRef.current.remove();
      breadcrumbLayerRef.current = null;
    }
    endpointMarkersRef.current.forEach(m => m.remove());
    endpointMarkersRef.current = [];

    const selectedTruck = telemetryList.find(t => t.vehicleId === selectedVehicleId);
    if (!selectedTruck || !selectedTruck.polyline) return;

    // Draw full corridor polyline
    const polyline = L.polyline(selectedTruck.polyline, {
      color: '#0d9488',
      weight: 5,
      opacity: 0.8,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map);
    activeRoutePolylineRef.current = polyline;

    // Draw Breadcrumb trail (traveled path)
    if (selectedTruck.breadcrumbs && selectedTruck.breadcrumbs.length > 0) {
      const crumbLayer = L.layerGroup();
      selectedTruck.breadcrumbs.forEach(c => {
        const circle = L.circleMarker([c.lat, c.lng], {
          radius: 3,
          color: '#a3e635',
          fillColor: '#a3e635',
          fillOpacity: 0.9,
          weight: 1,
        });
        circle.bindTooltip(`Time: ${c.timestamp}`, { permanent: false, direction: 'top' });
        crumbLayer.addLayer(circle);
      });
      crumbLayer.addTo(map);
      breadcrumbLayerRef.current = crumbLayer;
    }

    // Origin Pin
    const originCoords = selectedTruck.polyline[0];
    const destCoords = selectedTruck.polyline[selectedTruck.polyline.length - 1];

    if (originCoords) {
      const originIcon = L.divIcon({
        html: `
          <div class="px-2 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] shadow-md border border-white whitespace-nowrap flex items-center gap-1">
            <span>● Origin: ${selectedTruck.originName}</span>
          </div>
        `,
        className: 'endpoint-pin',
        iconAnchor: [40, 15],
      });
      const oMarker = L.marker(originCoords, { icon: originIcon }).addTo(map);
      endpointMarkersRef.current.push(oMarker);
    }

    // Destination Pin
    if (destCoords) {
      const destIcon = L.divIcon({
        html: `
          <div class="px-2 py-1 rounded-lg bg-red-600 text-white font-black text-[10px] shadow-md border border-white whitespace-nowrap flex items-center gap-1">
            <span>🏁 Dest: ${selectedTruck.destinationName}</span>
          </div>
        `,
        className: 'endpoint-pin',
        iconAnchor: [40, 15],
      });
      const dMarker = L.marker(destCoords, { icon: destIcon }).addTo(map);
      endpointMarkersRef.current.push(dMarker);
    }
  }, [selectedVehicleId, telemetryList]);

  // Fit all fleet vehicles in view
  const handleFitFleet = () => {
    const map = mapInstanceRef.current;
    if (!map || telemetryList.length === 0) return;

    const coords = telemetryList.map(t => t.coordinates).filter(c => c && c[0] && c[1]);
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[440px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-slate-900 shadow-sm">
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px]" style={{ zIndex: 1 }} />

      {/* Floating Map Controls Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleFitFleet}
          className="p-2.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 backdrop-blur-xs border border-slate-700 shadow-md transition-all flex items-center gap-1.5 text-xs font-bold"
          title="Zoom to fit all fleet trucks"
        >
          <Maximize2 size={15} />
          <span>Fit Fleet</span>
        </button>

        <button
          type="button"
          onClick={onToggleFollowMode}
          className={`p-2.5 rounded-xl backdrop-blur-xs border shadow-md transition-all flex items-center gap-1.5 text-xs font-bold ${
            followMode
              ? 'bg-lime-400 text-teal-950 border-lime-300 font-extrabold shadow-lime-500/20'
              : 'bg-slate-900/90 text-white hover:bg-slate-800 border-slate-700'
          }`}
          title="Toggle camera lock on moving vehicle"
        >
          <Locate size={15} className={followMode ? 'animate-pulse' : ''} />
          <span>{followMode ? 'Follow: On' : 'Follow: Off'}</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 p-2.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-xs border border-slate-700 shadow-md text-[11px] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Laden (On Work)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Empty (Deadhead)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Idle / Rest Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Overspeed (&gt;80 kph)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>In Maintenance</span>
        </div>
      </div>
    </div>
  );
}
