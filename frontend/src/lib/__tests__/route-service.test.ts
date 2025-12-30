import { getWalkingRoute } from '../route-service';

// Mock fetch global
global.fetch = jest.fn();

describe('Route Service', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('returns null if fewer than 2 waypoints', async () => {
    const waypoints = [{ lat: 10, lng: 10 }];
    const result = await getWalkingRoute(waypoints);
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches route successfully', async () => {
    const mockResponse = {
      code: 'Ok',
      routes: [
        {
          geometry: { coordinates: [[10, 10], [11, 11]], type: 'LineString' },
          duration: 100,
          distance: 500
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const waypoints = [
      { lat: 10, lng: 10 },
      { lat: 11, lng: 11 }
    ];

    const result = await getWalkingRoute(waypoints);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('10,10;11,11')
    );
    expect(result).toEqual({
      geometry: mockResponse.routes[0].geometry,
      duration: 100,
      distance: 500
    });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request'
    });

    const waypoints = [
      { lat: 10, lng: 10 },
      { lat: 11, lng: 11 }
    ];

    const result = await getWalkingRoute(waypoints);
    expect(result).toBeNull();
  });
});






