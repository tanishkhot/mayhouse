'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { MAP_CONFIG } from '@/lib/map-config';
import { reverseGeocode, searchLocation, type GeocodingResult } from '@/lib/osm-geocoding';
import { getWalkingRoute } from '@/lib/route-service';
import { cn } from '@/lib/utils';
import type { Map as LeafletMap, Marker as LeafletMarker, LayerGroup } from 'leaflet';

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'start' | 'stop' | 'end';
}

export interface MapPickerProps {
  value?: { lat: number; lng: number; name?: string };
  onChange?: (location: { lat: number; lng: number; name: string }) => void;
  height?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  showSearch?: boolean; // Now defaults to true internally if you want search always enabled
  className?: string;
  routeWaypoints?: Waypoint[];
  activeWaypointIndex?: number;
  readOnly?: boolean;
}

export function MapPicker({
  value,
  onChange,
  height = '400px',
  defaultCenter = MAP_CONFIG.center,
  defaultZoom = MAP_CONFIG.zoom,
  showSearch = true, // Enabled by default now
  className,
  routeWaypoints = [],
  activeWaypointIndex = -1,
  readOnly = false,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const [address, setAddress] = useState<string>(value?.name || '');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Initialize state from props
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update address when value changes
  useEffect(() => {
    if (value) {
      setAddress(value.name || '');
    } else {
      setAddress('');
    }
  }, [value]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const results = await searchLocation(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    // Dynamic import leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        // Import CSS safely
        if (typeof window !== 'undefined' && !document.querySelector('#leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Fix icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // If map already exists, skip
        if (mapInstanceRef.current || !mapContainerRef.current) return;

        // Create map
        const map = L.map(mapContainerRef.current).setView(
          value ? [value.lat, value.lng] : [defaultCenter.lat, defaultCenter.lng],
          defaultZoom
        );
        mapInstanceRef.current = map;
        routeLayerRef.current = L.layerGroup().addTo(map);

        // Add tile layer (using OSM default)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Click handler (only if not read-only)
        if (!readOnly) {
          map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            // Optimistic UI update
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              addMarker(lat, lng, L, map);
            }
            
            await updateMarker(lat, lng);
          });
        }

        // Initialize marker if value exists
        if (value) {
          addMarker(value.lat, value.lng, L, map);
        }

      } catch (error) {
        console.error('[MapPicker] Error initializing map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      // We purposefully don't destroy the map instance on simple re-renders to prevent flickering
      // Only destroy if component unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, readOnly]);

  // Route Drawing Logic
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    
    const drawRoute = async () => {
      const L = (await import('leaflet')).default;
      const layerGroup = routeLayerRef.current!;
      
      // Clear previous route layers (markers and polyline)
      layerGroup.clearLayers();

      // If we have waypoints, draw them
      if (routeWaypoints && routeWaypoints.length > 0) {
        
        // 1. Draw Markers for all waypoints
        routeWaypoints.forEach((wp, index) => {
          // Skip if this is the active waypoint being edited (main markerRef handles it)
          // actually, main markerRef handles the "single value" state. 
          // If we are in route mode, we might want to visualize all points.
          // But to avoid duplication with 'value' which is usually the 'active' one:
          
          const isActive = index === activeWaypointIndex;
          
          // Create a custom icon based on type
          // const color = wp.type === 'start' ? 'green' : wp.type === 'end' ? 'red' : 'blue';
          // Simple colored markers using L.divIcon or custom URL could be better, 
          // but for now let's use standard markers with popups.
          
          const marker = L.marker([wp.lat, wp.lng], {
             opacity: isActive ? 0.5 : 1.0, // Dim active one slightly as the main draggable marker is on top
          }).bindPopup(`${wp.type.toUpperCase()}: ${wp.name}`);
          
          layerGroup.addLayer(marker);
        });

        // 2. Fetch and Draw Route Polyline
        if (routeWaypoints.length >= 2) {
          const routeData = await getWalkingRoute(routeWaypoints);
          
          if (routeData && routeData.geometry) {
            // OSRM returns GeoJSON lineString
            const routeLine = L.geoJSON(routeData.geometry as any, {
              style: {
                color: '#ef4444', // terracotta-500 roughly
                weight: 5,
                opacity: 0.7,
                dashArray: '10, 10', // Dashed line for walking
              }
            });
            layerGroup.addLayer(routeLine);
            
            // Fit bounds to route
            mapInstanceRef.current?.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
          } else {
              // Fallback: straight lines
               const latlngs = routeWaypoints.map(wp => [wp.lat, wp.lng]);
               const polyline = L.polyline(latlngs as any, { color: 'gray', dashArray: '5, 10' });
               layerGroup.addLayer(polyline);
          }
        }
      }
    };

    drawRoute();
  }, [routeWaypoints, activeWaypointIndex]);


  // Function to add/update marker
  const addMarker = (lat: number, lng: number, L: any, map: LeafletMap) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: !readOnly }).addTo(map);
      markerRef.current = marker;
      
      if (!readOnly) {
        marker.on('dragend', async (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          updateMarker(lat, lng);
        });
      }
    }
    // Pan to marker
    map.panTo([lat, lng], { animate: true, duration: 0.5 });
  };

  // Helper to update marker state and callback
  const updateMarker = async (lat: number, lng: number) => {
    if (readOnly) return;
    
    setIsLoadingAddress(true);
    
    // Update marker visual position immediately
    if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
    }

    try {
      const result = await reverseGeocode(lat, lng);
      const name = result 
        ? (result.display_name.split(',')[0] || result.display_name) 
        : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      setAddress(name);
      if (onChange) {
        onChange({ lat, lng, name });
      }
    } catch (error) {
      console.error('[MapPicker] Reverse geocoding failed', error);
      const name = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(name);
      if (onChange) {
        onChange({ lat, lng, name });
      }
    } finally {
      setIsLoadingAddress(false);
    }
  };
  
  const handleSearchResultClick = async (result: GeocodingResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSearchQuery('');
    setShowResults(false);
    
    const L = (await import('leaflet')).default;
    if (mapInstanceRef.current) {
        addMarker(lat, lng, L, mapInstanceRef.current);
        await updateMarker(lat, lng);
    }
  };

  if (!isMounted) {
    return (
      <div className={cn('relative', className)}>
        <div style={{ height }} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full', className)}>
      {/* Search Bar Overlay */}
      {showSearch && !readOnly && (
        <div className="absolute top-2 left-2 right-2 z-1000 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
              onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="border-t border-gray-100 max-h-60 overflow-y-auto rounded-b-lg">
              {isSearching ? (
                <div className="p-3 text-xs text-gray-500 text-center">Searching...</div>
              ) : searchResults.length > 0 ? (
                <ul>
                  {searchResults.map((result) => (
                    <li 
                      key={result.place_id}
                      onClick={() => handleSearchResultClick(result)}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-start gap-2 border-b border-gray-50 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-terracotta-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{result.display_name.split(',')[0]}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{result.display_name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-xs text-gray-500 text-center">No results found</div>
              )}
            </div>
          )}
        </div>
      )}

      <div 
        ref={mapContainerRef}
        style={{ height }} 
        data-testid="leaflet-map-container"
        className="relative rounded-lg overflow-hidden border border-gray-200 z-0"
      />

      {/* Selected Location Info */}
      {(value || address) && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Selected Location</p>
              <p className="text-sm font-medium text-gray-900">
                {isLoadingAddress ? 'Loading...' : address || 'No address available'}
              </p>
              {value && (
                <p className="text-xs text-gray-500 mt-1">
                  {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
