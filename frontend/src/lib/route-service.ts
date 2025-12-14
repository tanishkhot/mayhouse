
interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResponse {
  geometry: {
    coordinates: number[][]; // [lon, lat] pairs
    type: string;
  };
  duration: number; // in seconds
  distance: number; // in meters
}

export async function getWalkingRoute(waypoints: LatLng[]): Promise<RouteResponse | null> {
  if (waypoints.length < 2) return null;

  // Format coordinates for OSRM: lon,lat;lon,lat;...
  const coordinates = waypoints
    .map(p => `${p.lng},${p.lat}`)
    .join(';');

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    // Return the first (best) route
    const route = data.routes[0];
    return {
      geometry: route.geometry,
      duration: route.duration,
      distance: route.distance
    };
  } catch (error) {
    console.error('Error fetching walking route:', error);
    return null;
  }
}

