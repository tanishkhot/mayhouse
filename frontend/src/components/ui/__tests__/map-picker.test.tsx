import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapPicker } from '../map-picker';

// Mock Leaflet
jest.mock('leaflet', () => ({
  map: jest.fn().mockReturnValue({
    setView: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  }),
  tileLayer: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
  }),
  marker: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setLatLng: jest.fn().mockReturnThis(),
  }),
  Icon: {
    Default: {
      prototype: { _getIconUrl: jest.fn() },
      mergeOptions: jest.fn(),
    },
  },
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('MapPicker Component', () => {
  it('renders the search bar and map container', () => {
    render(<MapPicker onChange={() => {}} />);
    
    // Check if search input is present
    const searchInput = screen.getByPlaceholderText('Search location...');
    expect(searchInput).toBeInTheDocument();
    
    // Check if map container is present
    const mapContainer = screen.getByTestId('leaflet-map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('updates search input value', () => {
    render(<MapPicker onChange={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText('Search location...');
    fireEvent.change(searchInput, { target: { value: 'Mumbai' } });
    
    expect(searchInput).toHaveValue('Mumbai');
  });
});






