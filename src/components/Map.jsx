import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const MapEvents = ({ onClick }) => {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng);
    },
  });
  return null;
};

export const Map = ({ 
  center = [36.8065, 10.1815], // Default center Tunis
  zoom = 12, 
  markers = [], 
  className = '',
  height = '400px',
  onMapClick,
  routeColor = 'var(--primary)'
}) => {
  // If we have at least 2 markers, we can draw a line between them
  const routePositions = markers.length >= 2 ? markers.map(m => m.position) : [];

  return (
    <div className={`map-wrapper ${className}`} style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', zIndex: 0 }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents onClick={onMapClick} />

        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}

        {routePositions.length >= 2 && (
          <Polyline positions={routePositions} color={routeColor} weight={4} opacity={0.6} dashArray="10, 10" />
        )}
      </MapContainer>
    </div>
  );
};
