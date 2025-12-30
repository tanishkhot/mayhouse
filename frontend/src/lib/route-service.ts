export type RouteWaypoint = {
  lat: number;
  lng: number;
};

export type WalkingRouteResult = {
  geometry: {
    type: "LineString";
    coordinates: Array<[number, number]>;
  };
  duration: number;
  distance: number;
};

export async function getWalkingRoute(
  waypoints: RouteWaypoint[]
): Promise<WalkingRouteResult | null> {
  if (!waypoints || waypoints.length < 2) return null;

  try {
    const encodedWaypoints = waypoints
      .map((wp) => `${wp.lng},${wp.lat}`)
      .join(";");

    const response = await fetch(
      `/api/proxy/routes/walking?waypoints=${encodeURIComponent(encodedWaypoints)}`
    );

    if (!response.ok) return null;

    const data = (await response.json()) as any;
    const route = data?.routes?.[0];
    const geometry = route?.geometry;
    const duration = route?.duration;
    const distance = route?.distance;

    if (!geometry || typeof duration !== "number" || typeof distance !== "number") {
      return null;
    }

    return { geometry, duration, distance };
  } catch {
    return null;
  }
}
