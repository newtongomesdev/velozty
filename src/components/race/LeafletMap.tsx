import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getGlowStyle } from "../../lib/colors";
import { detectLocale, getTranslation, LOCALE_STORAGE_KEY } from "../../lib/i18n";

const currentMapLocale = () => detectLocale(localStorage.getItem(LOCALE_STORAGE_KEY) || navigator.language);

// Import Leaflet styles
import "leaflet/dist/leaflet.css";

interface LatLng {
  lat: number;
  lng: number;
}

interface ParticipantMapData {
  id: string;
  display_name: string;
  color: string;
  lat: number;
  lng: number;
  isCurrentUser: boolean;
  status: "lobby" | "active" | "finished" | "abandoned";
}

interface LeafletMapProps {
  mode: "create" | "lobby" | "live" | "results";
  startPoint?: LatLng | null;
  finishPoint?: LatLng | null;
  waypoints?: LatLng[];
  routeCoords?: LatLng[] | null;
  participants?: ParticipantMapData[];
  historicalPaths?: { [participantId: string]: LatLng[] }; // For results mode
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerDragEnd?: (type: "start" | "finish", lat: number, lng: number) => void;
  onWaypointDragEnd?: (index: number, lat: number, lng: number) => void;
  center?: LatLng;
  zoom?: number;
}

// -------------------------------------------------------------
// CUSTOM DIVICON CREATORS (Avoids broken default Leaflet marker assets)
// -------------------------------------------------------------
const createStartIcon = () => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="flex items-center justify-center w-8 h-8">
        <span class="absolute inline-flex h-full w-full rounded-full bg-volt opacity-50 animate-ping"></span>
        <div class="relative w-4 h-4 rounded-full bg-volt border border-black shadow-[0_0_10px_#C6FF00]"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createFinishIcon = () => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="flex items-center justify-center w-10 h-10">
        <span class="absolute inline-flex h-8 w-8 rounded-full bg-hyperpink opacity-40 animate-pulse"></span>
        <div class="relative w-5 h-5 rounded-full bg-hyperpink border-2 border-white shadow-[0_0_12px_#FF2BD6] flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createWaypointIcon = (index: number) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="flex flex-col items-center justify-center">
        <div class="px-1.5 py-0.5 mb-1 text-[8px] font-black text-black rounded bg-cyan-300 shadow-md select-none border border-black/10 uppercase tracking-tight">
          ${getTranslation(currentMapLocale(), "map.point", { count: index + 1 })}
        </div>
        <div class="relative w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_rgba(34,211,238,0.6)] flex items-center justify-center">
          <div class="w-1 h-1 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createParticipantIcon = (color: string, name: string, isCurrentUser: boolean) => {
  const truncatedName = name.slice(0, 10) + (name.length > 10 ? ".." : "");
  const sizeClass = isCurrentUser ? "w-6 h-6 border-2 border-white" : "w-4 h-4";
  const glowStyle = getGlowStyle(color, 0.6);
  
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="flex flex-col items-center justify-center">
        <!-- Label bubble -->
        <div class="px-1.5 py-0.5 mb-1 text-[9px] font-bold text-black rounded bg-white shadow-md select-none border border-black/10 uppercase tracking-tight">
          ${isCurrentUser ? getTranslation(currentMapLocale(), "map.you") : truncatedName}
        </div>
        <!-- Pulse ring -->
        <div class="flex items-center justify-center">
          <span class="absolute inline-flex h-5 w-5 rounded-full bg-[${color}] opacity-30 animate-ping"></span>
          <div class="${sizeClass} rounded-full" style="background-color: ${color}; border-color: ${isCurrentUser ? '#white' : 'rgba(0,0,0,0.4)'}; box-shadow: ${glowStyle.boxShadow}"></div>
        </div>
      </div>
    `,
    iconSize: [60, 45],
    iconAnchor: [30, 38],
  });
};

// -------------------------------------------------------------
// INTERNAL HELPERS TO INTERACT WITH LEAFLET ENGINE
// -------------------------------------------------------------
const MapClickHandler: React.FC<{ onClick?: (lat: number, lng: number) => void }> = ({ onClick }) => {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapBoundsUpdater: React.FC<{
  start?: LatLng | null;
  finish?: LatLng | null;
  waypoints?: LatLng[];
  positions?: ParticipantMapData[];
  paths?: { [id: string]: LatLng[] };
  mode: string;
}> = ({ start, finish, waypoints = [], positions, paths, mode }) => {
  const map = useMap();

  useEffect(() => {
    const bounds: L.LatLngExpression[] = [];

    if (start) bounds.push([start.lat, start.lng]);
    waypoints.forEach(w => bounds.push([w.lat, w.lng]));
    if (finish) bounds.push([finish.lat, finish.lng]);

    if (mode === "live" && positions) {
      positions.forEach(p => {
        if (p.status === "active") bounds.push([p.lat, p.lng]);
      });
    }

    if (mode === "results" && paths) {
      Object.values(paths).forEach(points => {
        points.forEach(pt => bounds.push([pt.lat, pt.lng]));
      });
    }

    if (bounds.length >= 2) {
      const latLngBounds = L.latLngBounds(bounds);
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 16, animate: true });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15, { animate: true });
    }
  }, [start, finish, positions, paths, map, mode]);

  return null;
};

const MapCenterUpdater: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

// -------------------------------------------------------------
// MAIN COMPONENT EXPORT
// -------------------------------------------------------------
export const LeafletMap: React.FC<LeafletMapProps> = ({
  mode,
  startPoint,
  finishPoint,
  waypoints = [],
  routeCoords = [],
  participants = [],
  historicalPaths = {},
  onMapClick,
  onMarkerDragEnd,
  onWaypointDragEnd,
  center = { lat: -23.55052, lng: -46.633308 }, // São Paulo default center
  zoom = 13,
}) => {
  
  // Choose standard coordinate if start is not selected
  const initialCenter: L.LatLngExpression = startPoint 
    ? [startPoint.lat, startPoint.lng] 
    : [center.lat, center.lng];

  // Dynamically detect light theme on document.body using MutationObserver
  const [isLightTheme, setIsLightTheme] = React.useState(() => {
    return document.body.classList.contains("light-theme") || localStorage.getItem("velocity_theme") === "light";
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsLightTheme(document.body.classList.contains("light-theme"));
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const tileUrl = isLightTheme
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-full relative border border-white/5 rounded-2xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      
      {/* Decorative cyber grid scanning effect */}
      <div className="absolute inset-0 pointer-events-none z-[1000] border-2 border-white/5 rounded-2xl"></div>

      <MapContainer
        center={initialCenter}
        zoom={zoom}
        className="w-full h-full bg-[#050508]"
        zoomControl={false}
      >
        {/* Futuristic style using CartoDB Dark Matter / Positron based on active theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        {/* Center tracker */}
        <MapCenterUpdater center={center} />

        {/* 1. Map Click Interceptor for creation */}
        {mode === "create" && <MapClickHandler onClick={onMapClick} />}

        {/* 2. Boundary Autoframer */}
        <MapBoundsUpdater 
          start={startPoint} 
          finish={finishPoint} 
          waypoints={waypoints}
          positions={participants} 
          paths={historicalPaths} 
          mode={mode} 
        />

        {/* 3. Start Pin */}
        {startPoint && (
          <Marker 
            position={[startPoint.lat, startPoint.lng]} 
            icon={createStartIcon()} 
            draggable={mode === "create"}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                if (onMarkerDragEnd) {
                  onMarkerDragEnd("start", position.lat, position.lng);
                }
              }
            }}
          />
        )}

        {/* 3b. Draggable Waypoint Pins */}
        {mode === "create" && waypoints.map((wp, idx) => (
          <Marker
            key={`wp-${idx}`}
            position={[wp.lat, wp.lng]}
            icon={createWaypointIcon(idx)}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                if (onWaypointDragEnd) {
                  onWaypointDragEnd(idx, position.lat, position.lng);
                }
              }
            }}
          />
        ))}

        {/* 4. Finish Target */}
        {finishPoint && (
          <Marker 
            position={[finishPoint.lat, finishPoint.lng]} 
            icon={createFinishIcon()} 
            draggable={mode === "create"}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                if (onMarkerDragEnd) {
                  onMarkerDragEnd("finish", position.lat, position.lng);
                }
              }
            }}
          />
        )}

        {/* 5. Line connecting start to finish (snapped OSRM route or straight line fallback) */}
        {startPoint && finishPoint && (
          <>
            {routeCoords && routeCoords.length > 0 ? (
              <Polyline
                positions={routeCoords.map(c => [c.lat, c.lng] as L.LatLngExpression)}
                pathOptions={{
                  color: "#C6FF00",
                  weight: 4,
                  opacity: 0.8,
                  lineCap: "round",
                  lineJoin: "round"
                }}
              />
            ) : (mode === "create" || mode === "lobby") ? (
              <Polyline
                positions={[
                  [startPoint.lat, startPoint.lng],
                  [finishPoint.lat, finishPoint.lng]
                ]}
                pathOptions={{
                  color: "#C6FF00",
                  dashArray: "8, 8",
                  weight: 2,
                  opacity: 0.6
                }}
              />
            ) : null}
          </>
        )}

        {/* 6. Active Live Racers */}
        {(mode === "live" || mode === "lobby") && 
          participants
            .filter(p => p.status === "active" || p.status === "lobby")
            .map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createParticipantIcon(p.color, p.display_name, p.isCurrentUser)}
              />
            ))
        }

        {/* 7. Draw local user trail path in Live Mode */}
        {mode === "live" && participants.length > 0 && (() => {
          const currentUser = participants.find(p => p.isCurrentUser);
          if (!currentUser) return null;
          
          // Re-assemble current user historical tracking coordinates from historicalPaths props
          const userHistory = historicalPaths[currentUser.id] || [];
          const currentPoint: LatLng = { lat: currentUser.lat, lng: currentUser.lng };
          const coords = [...userHistory, currentPoint].map(pt => [pt.lat, pt.lng] as L.LatLngExpression);
          
          if (coords.length < 2) return null;

          return (
            <Polyline
              positions={coords}
              pathOptions={{
                color: currentUser.color,
                weight: 4,
                opacity: 0.8
              }}
            />
          );
        })()}

        {/* 8. Render full trails in Results Mode */}
        {mode === "results" && 
          Object.entries(historicalPaths).map(([partId, points]) => {
            const racer = participants.find(p => p.id === partId);
            const color = racer ? racer.color : "#FFFFFF";
            const coords = points.map(pt => [pt.lat, pt.lng] as L.LatLngExpression);
            
            if (coords.length < 2) return null;

            return (
              <Polyline
                key={partId}
                positions={coords}
                pathOptions={{
                  color: color,
                  weight: 4,
                  opacity: 0.85
                }}
              />
            );
          })
        }
      </MapContainer>
    </div>
  );
};
