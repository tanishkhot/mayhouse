import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DesignExperienceV2 from '../DesignExperienceV2';
import { getWalkingRoute } from '@/lib/route-service';
import { searchLocation, reverseGeocode } from '@/lib/osm-geocoding';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('@/lib/route-service', () => ({
  getWalkingRoute: jest.fn(),
}));

jest.mock('@/lib/osm-geocoding', () => ({
  searchLocation: jest.fn(),
  reverseGeocode: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  AuthAPI: { me: jest.fn().mockResolvedValue({ id: 'user1', name: 'Test User' }) },
  api: { post: jest.fn() },
}));

// Mock Leaflet (reuse from map-picker.test.tsx logic)
jest.mock('leaflet', () => ({
  map: jest.fn().mockReturnValue({
    setView: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    panTo: jest.fn(),
    fitBounds: jest.fn(),
  }),
  tileLayer: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
  }),
  marker: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setLatLng: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
  }),
  polyline: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    getBounds: jest.fn().mockReturnValue([0, 0]),
  }),
  geoJSON: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    getBounds: jest.fn().mockReturnValue([0, 0]),
  }),
  layerGroup: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    clearLayers: jest.fn(),
    addLayer: jest.fn(),
  }),
  Icon: {
    Default: {
      prototype: { _getIconUrl: jest.fn() },
      mergeOptions: jest.fn(),
    },
  },
}));

// ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ScrollTo
window.scrollTo = jest.fn();

describe('DesignExperienceV2 Route Planning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getWalkingRoute as jest.Mock).mockResolvedValue({
      geometry: { coordinates: [[0, 0], [1, 1]], type: 'LineString' },
      duration: 300,
      distance: 1000,
    });
    (reverseGeocode as jest.Mock).mockResolvedValue({
      display_name: 'Test Location',
    });
  });

  const fillStep1 = async () => {
    fireEvent.click(screen.getByText('Start from scratch instead'));
    
    // Step 1 keeps the form panel closed by default; open it via Manual Edit.
    fireEvent.click(await screen.findByText(/Manual Edit/i));
    
    // Title
    fireEvent.change(await screen.findByPlaceholderText(/e.g., Mumbai Street Food/i), {
      target: { value: 'Test Experience Title That Is Long Enough' },
    });
    
    // Description
    fireEvent.change(await screen.findByPlaceholderText(/Describe what makes your experience unique/i), {
      target: { value: 'This is a test description that is definitely longer than one hundred characters. It needs to be very descriptive to pass the validation check. almost there... done.' },
    });
    
    // Category
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'food' },
    });
    
    fireEvent.click(screen.getByText('Next'));
  };

  it('allows planning a route with multiple stops', async () => {
    await act(async () => {
      render(<DesignExperienceV2 />);
    });

    // 1. Navigate to Step 2
    await fillStep1();
    
    // Verify we are on Step 2
    expect(screen.getByText('Experience Details')).toBeInTheDocument();
    
    // 2. Find and click "Plan a Walking Route"
    const planButton = screen.getByText('Plan a Walking Route with Multiple Stops');
    expect(planButton).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(planButton);
    });

    // 3. Verify Route UI appears
    expect(screen.getByText('Your Route')).toBeInTheDocument();
    expect(screen.getByText(/1 stops/)).toBeInTheDocument(); // Initially just Start Point
    
    // 4. Add a stop
    const addStopButton = screen.getByText('Add Stop');
    await act(async () => {
        fireEvent.click(addStopButton);
    });

    // 5. Verify 2 stops
    expect(screen.getByText(/2 stops/)).toBeInTheDocument();
    expect(screen.getByText('Meeting Point')).toBeInTheDocument(); // Default name when adding route
    
    // 6. Verify getWalkingRoute called
    // Wait for debounce/effect
    await waitFor(() => {
      expect(getWalkingRoute).toHaveBeenCalled();
    });
  });
});







