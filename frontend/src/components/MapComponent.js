import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different complaint statuses
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const statusIcons = {
  PENDING: createCustomIcon('#f59e0b'),
  ASSIGNED: createCustomIcon('#3b82f6'),
  IN_PROGRESS: createCustomIcon('#0ea5e9'),
  RESOLVED: createCustomIcon('#10b981'),
  REJECTED: createCustomIcon('#ef4444'),
};

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect, clickable = false }) => {
  useMapEvents({
    click: (e) => {
      if (clickable && onLocationSelect) {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    },
  });
  return null;
};

const MapComponent = ({ 
  complaints = [], 
  selectedLocation = null, 
  onLocationSelect = null,
  clickable = false,
  height = '400px',
  center = null,
  zoom = 13
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(
    center || {
      lat: parseFloat(process.env.REACT_APP_MAP_DEFAULT_LAT) || 40.7580,
      lng: parseFloat(process.env.REACT_APP_MAP_DEFAULT_LNG) || -73.9855
    }
  );

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation && !center) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Keep default center if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, [center]);

  // Update map center when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter(selectedLocation);
    }
  }, [selectedLocation]);

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map click handler */}
        <MapClickHandler 
          onLocationSelect={onLocationSelect} 
          clickable={clickable} 
        />
        
        {/* User's current location */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={createCustomIcon('#6366f1')}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Selected location marker */}
        {selectedLocation && (
          <Marker 
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon('#dc2626')}
          >
            <Popup>
              <div className="text-center">
                <strong>Selected Location</strong>
                <br />
                <small>
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </small>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Complaint markers */}
        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[complaint.latitude, complaint.longitude]}
            icon={statusIcons[complaint.status] || statusIcons.PENDING}
          >
            <Popup maxWidth={300}>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{complaint.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {complaint.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`badge badge-${complaint.status.toLowerCase().replace('_', '-')}`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {complaint.address && (
                  <p className="text-xs text-gray-500">
                    📍 {complaint.address}
                  </p>
                )}
                <div className="pt-2 border-t">
                  <a
                    href={`/complaints/${complaint.id}`}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/complaints/${complaint.id}`;
                    }}
                  >
                    View Details →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      {complaints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md border z-[1000]">
          <h5 className="text-xs font-semibold mb-2">Status Legend</h5>
          <div className="space-y-1">
            {Object.entries(statusIcons).map(([status, icon]) => (
              <div key={status} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ 
                    backgroundColor: status === 'PENDING' ? '#f59e0b' :
                                   status === 'ASSIGNED' ? '#3b82f6' :
                                   status === 'IN_PROGRESS' ? '#0ea5e9' :
                                   status === 'RESOLVED' ? '#10b981' : '#ef4444'
                  }}
                ></div>
                <span className="text-xs text-gray-600">
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Click instruction for interactive maps */}
      {clickable && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md border z-[1000]">
          <p className="text-xs text-gray-600">
            📍 Click on the map to select location
          </p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;