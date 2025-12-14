import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ModeratorDashboard from '../page';
import { api } from '@/lib/api';
import { normalizeModeratorExperience } from '@/lib/experience-preview-normalizer';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
  AuthAPI: {
    logout: jest.fn(),
    me: jest.fn().mockResolvedValue({ id: 'admin-123', name: 'Admin User' }),
  },
}));

// Mock ExperiencePreviewModal
jest.mock('@/components/experience-preview', () => ({
  ExperiencePreviewModal: ({
    experience,
    onClose,
  }: {
    experience: any;
    onClose: () => void;
  }) => (
    <div data-testid="experience-preview-modal">
      <div data-testid="experience-title">{experience.title}</div>
      <div data-testid="experience-route-data">
        {experience.routeData?.waypoints?.length || 0} waypoints
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock normalizeModeratorExperience to use real implementation
jest.mock('@/lib/experience-preview-normalizer', () => ({
  ...jest.requireActual('@/lib/experience-preview-normalizer'),
  normalizeModeratorExperience: jest.fn((exp, photos) => {
    const actual = jest.requireActual('@/lib/experience-preview-normalizer');
    return actual.normalizeModeratorExperience(exp, photos);
  }),
  convertPhotosToArray: jest.fn((photos) => photos),
}));

// Mock ProtectedRoute
jest.mock('@/components/ProtectedRoute', () => ({
  AdminOnlyRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ModeratorSkeleton
jest.mock('@/components/skeletons', () => ({
  ModeratorSkeleton: () => <div>Loading...</div>,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Moderator Dashboard - Route Visualization Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('mayhouse_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.removeItem('mayhouse_token');
  });

  it('displays route visualization when viewing experience with route_data', async () => {
    const mockExperienceWithRoute = {
      id: 'exp-123',
      title: 'Test Experience with Route',
      status: 'submitted',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      experience_domain: 'culture',
      duration_minutes: 120,
      price_inr: 1000,
      traveler_max_capacity: 10,
      promise: 'Test promise',
      description: 'Test description',
      unique_element: 'Test unique',
      neighborhood: 'Test Neighborhood',
      meeting_landmark: 'Test Meeting Point',
      meeting_point_details: 'Test details',
      inclusions: ['Item 1'],
      traveler_should_bring: ['Item A'],
      experience_safety_guidelines: 'Test safety',
      route_data: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
          { id: 'stop-1', lat: 19.0765, lng: 72.8780, name: 'Stop 1', type: 'stop' },
          { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
        ],
      },
    };

    const mockPhotos = [
      {
        id: 'photo-1',
        photo_url: 'https://example.com/photo.jpg',
        is_cover_photo: true,
        display_order: 1,
      },
    ];

    // Mock API responses
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/experiences/exp-123')) {
        return Promise.resolve({ data: mockExperienceWithRoute });
      }
      if (url.includes('/admin/experiences/exp-123/photos')) {
        return Promise.resolve({ data: mockPhotos });
      }
      if (url.includes('/admin/experiences')) {
        return Promise.resolve({ data: [mockExperienceWithRoute] });
      }
      return Promise.reject(new Error('Unexpected API call'));
    });

    await act(async () => {
      render(<ModeratorDashboard />);
    });

    // Wait for experiences to load
    await waitFor(() => {
      expect(screen.getByText('Test Experience with Route')).toBeInTheDocument();
    });

    // Click "View Details" button
    const viewDetailsButton = screen.getByText('View Details');
    await act(async () => {
      viewDetailsButton.click();
    });

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('experience-preview-modal')).toBeInTheDocument();
    });

    // Verify route data is passed through
    await waitFor(() => {
      const routeDataElement = screen.getByTestId('experience-route-data');
      expect(routeDataElement).toHaveTextContent('3 waypoints');
    });

    // Verify normalizeModeratorExperience was called with route_data
    expect(normalizeModeratorExperience).toHaveBeenCalledWith(
      expect.objectContaining({
        route_data: {
          waypoints: expect.arrayContaining([
            expect.objectContaining({ id: 'start', name: 'Start Point' }),
          ]),
        },
      }),
      expect.any(Array)
    );
  });

  it('handles experience without route_data gracefully', async () => {
    const mockExperienceWithoutRoute = {
      id: 'exp-456',
      title: 'Test Experience without Route',
      status: 'submitted',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      experience_domain: 'culture',
      duration_minutes: 120,
      price_inr: 1000,
      traveler_max_capacity: 10,
      promise: 'Test promise',
      description: 'Test description',
      unique_element: 'Test unique',
      neighborhood: 'Test Neighborhood',
      meeting_landmark: 'Test Meeting Point',
      meeting_point_details: 'Test details',
      inclusions: ['Item 1'],
      traveler_should_bring: ['Item A'],
      experience_safety_guidelines: 'Test safety',
      // No route_data field
    };

    const mockPhotos: any[] = [];

    // Mock API responses
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/experiences/exp-456')) {
        return Promise.resolve({ data: mockExperienceWithoutRoute });
      }
      if (url.includes('/admin/experiences/exp-456/photos')) {
        return Promise.resolve({ data: mockPhotos });
      }
      if (url.includes('/admin/experiences')) {
        return Promise.resolve({ data: [mockExperienceWithoutRoute] });
      }
      return Promise.reject(new Error('Unexpected API call'));
    });

    await act(async () => {
      render(<ModeratorDashboard />);
    });

    // Wait for experiences to load
    await waitFor(() => {
      expect(screen.getByText('Test Experience without Route')).toBeInTheDocument();
    });

    // Click "View Details" button
    const viewDetailsButton = screen.getByText('View Details');
    await act(async () => {
      viewDetailsButton.click();
    });

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('experience-preview-modal')).toBeInTheDocument();
    });

    // Verify route data shows 0 waypoints (or undefined)
    await waitFor(() => {
      const routeDataElement = screen.getByTestId('experience-route-data');
      expect(routeDataElement).toHaveTextContent('0 waypoints');
    });

    // Verify normalizeModeratorExperience was called without route_data
    expect(normalizeModeratorExperience).toHaveBeenCalledWith(
      expect.not.objectContaining({
        route_data: expect.anything(),
      }),
      expect.any(Array)
    );
  });
});

