import { normalizeModeratorExperience, normalizeExperienceResponse } from '../experience-preview-normalizer';
import { ExperiencePhoto } from '../experience-preview-types';
import { ExperienceResponse } from '../experience-api';

const mockPhotos: ExperiencePhoto[] = [
  {
    id: 'photo-1',
    photo_url: 'https://example.com/photo.jpg',
    is_cover_photo: true,
    display_order: 1,
  },
];

describe('Experience Preview Normalizer - Route Data', () => {
  describe('normalizeModeratorExperience', () => {
    const baseModeratorExperience = {
      id: 'exp-123',
      title: 'Test Experience',
      status: 'submitted' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      experience_domain: 'culture',
      duration_minutes: 120,
      price_inr: 1000,
      traveler_max_capacity: 10,
      promise: 'Test promise',
      description: 'Test description',
      unique_element: 'Test unique element',
      neighborhood: 'Test Neighborhood',
      meeting_landmark: 'Test Meeting Point',
      meeting_point_details: 'Test meeting details',
      inclusions: ['Item 1', 'Item 2'],
      traveler_should_bring: ['Item A', 'Item B'],
      experience_safety_guidelines: 'Test safety guidelines',
    };

    it('maps route_data to routeData correctly', () => {
      const moderatorExp = {
        ...baseModeratorExperience,
        route_data: {
          waypoints: [
            { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
            { id: 'stop-1', lat: 19.0765, lng: 72.8780, name: 'Stop 1', type: 'stop' },
            { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
          ],
        },
      };

      const result = normalizeModeratorExperience(moderatorExp, mockPhotos);

      expect(result.routeData).toBeDefined();
      expect(result.routeData?.waypoints).toHaveLength(3);
      expect(result.routeData?.waypoints[0]).toMatchObject({
        id: 'start',
        lat: 19.0760,
        lng: 72.8777,
        name: 'Start Point',
        type: 'start',
      });
      expect(result.routeData?.waypoints[1]).toMatchObject({
        id: 'stop-1',
        lat: 19.0765,
        lng: 72.8780,
        name: 'Stop 1',
        type: 'stop',
      });
      expect(result.routeData?.waypoints[2]).toMatchObject({
        id: 'end',
        lat: 19.0770,
        lng: 72.8785,
        name: 'End Point',
        type: 'end',
      });
    });

    it('handles missing route_data gracefully', () => {
      const moderatorExp = {
        ...baseModeratorExperience,
        // No route_data field
      };

      const result = normalizeModeratorExperience(moderatorExp, mockPhotos);

      expect(result.routeData).toBeUndefined();
      // Other fields should still be normalized correctly
      expect(result.id).toBe('exp-123');
      expect(result.title).toBe('Test Experience');
    });

    it('handles empty waypoints array', () => {
      const moderatorExp = {
        ...baseModeratorExperience,
        route_data: {
          waypoints: [],
        },
      };

      const result = normalizeModeratorExperience(moderatorExp, mockPhotos);

      // Empty array is truthy, so normalizer returns it (component will check length > 0)
      expect(result.routeData).toBeDefined();
      expect(result.routeData?.waypoints).toEqual([]);
    });

    it('handles route_data without waypoints property', () => {
      const moderatorExp = {
        ...baseModeratorExperience,
        route_data: {
          // No waypoints property
          geometry: { type: 'LineString', coordinates: [] },
        },
      };

      const result = normalizeModeratorExperience(moderatorExp, mockPhotos);

      // Should handle gracefully and return undefined
      expect(result.routeData).toBeUndefined();
    });
  });

  describe('normalizeExperienceResponse', () => {
    const baseExperienceResponse: ExperienceResponse = {
      id: 'exp-123',
      title: 'Test Experience',
      description: 'Test description',
      experience_domain: 'culture',
      neighborhood: 'Test Neighborhood',
      duration_minutes: 120,
      traveler_max_capacity: 10,
      price_inr: 1000,
      status: 'submitted',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('maps route_data to routeData correctly', () => {
      const expResponse = {
        ...baseExperienceResponse,
        route_data: {
          waypoints: [
            { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
            { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
          ],
        },
      };

      const result = normalizeExperienceResponse(expResponse, mockPhotos);

      expect(result.routeData).toBeDefined();
      expect(result.routeData?.waypoints).toHaveLength(2);
      expect(result.routeData?.waypoints[0]).toMatchObject({
        id: 'start',
        lat: 19.0760,
        lng: 72.8777,
        name: 'Start Point',
        type: 'start',
      });
    });

    it('handles missing route_data gracefully', () => {
      const expResponse = {
        ...baseExperienceResponse,
        // No route_data field
      };

      const result = normalizeExperienceResponse(expResponse, mockPhotos);

      expect(result.routeData).toBeUndefined();
      expect(result.id).toBe('exp-123');
      expect(result.title).toBe('Test Experience');
    });

    it('handles empty waypoints array', () => {
      const expResponse = {
        ...baseExperienceResponse,
        route_data: {
          waypoints: [],
        },
      };

      const result = normalizeExperienceResponse(expResponse, mockPhotos);

      // Empty array is truthy, so normalizer returns it (component will check length > 0)
      expect(result.routeData).toBeDefined();
      expect(result.routeData?.waypoints).toEqual([]);
    });
  });
});

