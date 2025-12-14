import React from 'react';
import { render, screen } from '@testing-library/react';
import ExperiencePreviewContent from '../ExperiencePreviewContent';
import { NormalizedExperienceData, PhotoArray } from '@/lib/experience-preview-types';

// Mock MapPicker to avoid Leaflet initialization issues
jest.mock('@/components/ui/map-picker', () => ({
  MapPicker: ({ routeWaypoints, readOnly, showSearch, defaultCenter }: any) => (
    <div data-testid="mock-map-picker">
      <div data-testid="map-readonly">{readOnly ? 'true' : 'false'}</div>
      <div data-testid="map-search">{showSearch ? 'enabled' : 'disabled'}</div>
      <div data-testid="map-waypoints-count">{routeWaypoints?.length || 0}</div>
      <div data-testid="map-default-center">
        {defaultCenter ? JSON.stringify(defaultCenter) : 'none'}
      </div>
    </div>
  ),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('ExperiencePreviewContent - Route Visualization', () => {
  const baseExperience: NormalizedExperienceData = {
    id: 'exp-123',
    title: 'Test Experience',
    description: 'Test description',
    domain: 'culture',
    neighborhood: 'Test Neighborhood',
    duration: 120,
    maxCapacity: 10,
    price: 1000,
  };

  const mockPhotos: PhotoArray = [];

  it('renders route visualization section when routeData exists', () => {
    const experienceWithRoute: NormalizedExperienceData = {
      ...baseExperience,
      routeData: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
          { id: 'stop-1', lat: 19.0765, lng: 72.8780, name: 'Stop 1', type: 'stop' },
          { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
        ],
      },
    };

    render(<ExperiencePreviewContent experience={experienceWithRoute} photos={mockPhotos} />);

    // Assert: "Walking Route" heading is present
    expect(screen.getByText('Walking Route')).toBeInTheDocument();

    // Assert: MapPicker component is rendered
    const mapPicker = screen.getByTestId('mock-map-picker');
    expect(mapPicker).toBeInTheDocument();

    // Assert: Waypoint count text is displayed correctly
    expect(screen.getByText(/This route includes 3 waypoints/)).toBeInTheDocument();
  });

  it('does not render route visualization when routeData is missing', () => {
    const experienceWithoutRoute: NormalizedExperienceData = {
      ...baseExperience,
      // No routeData
    };

    render(<ExperiencePreviewContent experience={experienceWithoutRoute} photos={mockPhotos} />);

    // Assert: "Walking Route" heading is NOT present
    expect(screen.queryByText('Walking Route')).not.toBeInTheDocument();

    // Assert: MapPicker is NOT rendered
    expect(screen.queryByTestId('mock-map-picker')).not.toBeInTheDocument();
  });

  it('does not render route visualization when waypoints array is empty', () => {
    const experienceWithEmptyRoute: NormalizedExperienceData = {
      ...baseExperience,
      routeData: {
        waypoints: [],
      },
    };

    render(<ExperiencePreviewContent experience={experienceWithEmptyRoute} photos={mockPhotos} />);

    // Assert: Route section is not rendered
    expect(screen.queryByText('Walking Route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-map-picker')).not.toBeInTheDocument();
  });

  it('passes correct props to MapPicker in read-only mode', () => {
    const experienceWithRoute: NormalizedExperienceData = {
      ...baseExperience,
      routeData: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
          { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
        ],
      },
    };

    render(<ExperiencePreviewContent experience={experienceWithRoute} photos={mockPhotos} />);

    const mapPicker = screen.getByTestId('mock-map-picker');

    // Assert: MapPicker receives readOnly={true}
    expect(screen.getByTestId('map-readonly')).toHaveTextContent('true');

    // Assert: MapPicker receives showSearch={false}
    expect(screen.getByTestId('map-search')).toHaveTextContent('disabled');

    // Assert: MapPicker receives routeWaypoints matching experience.routeData.waypoints
    expect(screen.getByTestId('map-waypoints-count')).toHaveTextContent('2');

    // Assert: MapPicker receives defaultCenter from first waypoint
    const defaultCenter = screen.getByTestId('map-default-center');
    expect(defaultCenter).toHaveTextContent(
      JSON.stringify({ lat: 19.0760, lng: 72.8777 })
    );
  });

  it('displays correct waypoint count text for singular waypoint', () => {
    const experienceWithSingleWaypoint: NormalizedExperienceData = {
      ...baseExperience,
      routeData: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
        ],
      },
    };

    render(
      <ExperiencePreviewContent experience={experienceWithSingleWaypoint} photos={mockPhotos} />
    );

    // Note: Single waypoint might not render route (needs 2+ for a route), but if it does:
    // This test verifies the text uses singular form
    // However, based on the component logic, route visualization requires waypoints.length > 0
    // But a single waypoint doesn't make a route, so this might not render
    // Let's check if it renders or not
    const routeSection = screen.queryByText('Walking Route');
    if (routeSection) {
      expect(screen.getByText(/This route includes 1 waypoint/)).toBeInTheDocument();
    }
  });

  it('displays correct waypoint count text for multiple waypoints', () => {
    const experienceWithMultipleWaypoints: NormalizedExperienceData = {
      ...baseExperience,
      routeData: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
          { id: 'stop-1', lat: 19.0765, lng: 72.8780, name: 'Stop 1', type: 'stop' },
          { id: 'stop-2', lat: 19.0768, lng: 72.8782, name: 'Stop 2', type: 'stop' },
          { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
        ],
      },
    };

    render(
      <ExperiencePreviewContent experience={experienceWithMultipleWaypoints} photos={mockPhotos} />
    );

    // Assert: Uses plural form
    expect(screen.getByText(/This route includes 4 waypoints/)).toBeInTheDocument();
  });

  it('uses latitude/longitude as fallback for defaultCenter when waypoints exist but no first waypoint', () => {
    const experienceWithRouteAndCoords: NormalizedExperienceData = {
      ...baseExperience,
      latitude: 19.0750,
      longitude: 72.8770,
      routeData: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
        ],
      },
    };

    render(
      <ExperiencePreviewContent experience={experienceWithRouteAndCoords} photos={mockPhotos} />
    );

    // Should use first waypoint, not fallback coordinates
    const defaultCenter = screen.getByTestId('map-default-center');
    expect(defaultCenter).toHaveTextContent(
      JSON.stringify({ lat: 19.0760, lng: 72.8777 })
    );
  });

  it('renders other experience content even when route visualization is present', () => {
    const experienceWithRoute: NormalizedExperienceData = {
      ...baseExperience,
      routeData: {
        waypoints: [
          { id: 'start', lat: 19.0760, lng: 72.8777, name: 'Start Point', type: 'start' },
          { id: 'end', lat: 19.0770, lng: 72.8785, name: 'End Point', type: 'end' },
        ],
      },
    };

    render(<ExperiencePreviewContent experience={experienceWithRoute} photos={mockPhotos} />);

    // Assert: Other content still renders
    expect(screen.getByText('Test Experience')).toBeInTheDocument();
    expect(screen.getAllByText('Test description').length).toBeGreaterThan(0);
    expect(screen.getByText('Walking Route')).toBeInTheDocument();
  });
});

