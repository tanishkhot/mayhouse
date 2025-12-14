// Simple in-memory cache
const geocodeCache: Record<string, any> = {};

export interface GeocodingResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  const key = `reverse-${lat.toFixed(6)}-${lng.toFixed(6)}`;
  if (geocodeCache[key]) return geocodeCache[key];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MayhouseApp/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    geocodeCache[key] = data; // Cache result
    return data as GeocodingResult;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  const key = `search-${query.trim().toLowerCase()}`;
  if (geocodeCache[key]) return geocodeCache[key];

  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
      {
        headers: {
          'User-Agent': 'MayhouseApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    geocodeCache[key] = data; // Cache result
    return data as GeocodingResult[];
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
}
