import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DesignExperienceV2 from '../DesignExperienceV2';
import { experienceAPI } from '@/lib/experience-api';
import { AuthAPI } from '@/lib/api';

// --- Mocks ---

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock API modules
jest.mock('@/lib/experience-api', () => ({
  experienceAPI: {
    createExperience: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  AuthAPI: {
    me: jest.fn().mockResolvedValue({ id: 'user-123', name: 'Test Host' }),
  },
  api: {
    post: jest.fn(),
  },
}));

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock MapPicker to avoid Leaflet issues and simplify interaction
jest.mock('@/components/ui/map-picker', () => ({
  MapPicker: ({ onChange, value, routeWaypoints }: any) => (
    <div data-testid="mock-map-picker">
      <div data-testid="map-value">{value ? JSON.stringify(value) : 'No Value'}</div>
      <div data-testid="map-waypoints-count">{routeWaypoints?.length || 0}</div>
      <button 
        data-testid="mock-map-click"
        onClick={() => onChange({ lat: 19.0760, lng: 72.8777, name: 'Mock Location' })}
      >
        Simulate Map Click
      </button>
    </div>
  ),
}));

// Mock other UI components that might cause issues
jest.mock('../AIChatSidebar', () => ({
  AIChatSidebar: () => <div data-testid="ai-chat-sidebar" />,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('DesignExperienceV2 Route Planning Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (experienceAPI.createExperience as jest.Mock).mockResolvedValue({ id: 'exp-123' });
  });

  const fillBasicForm = async () => {
    // Wait for the form to be visible (it might be in a sidebar)
    const titleInput = await screen.findByPlaceholderText(/e.g., Mumbai Street Food Adventure/i);
    
    // Helper to get past step 1 validation
    fireEvent.change(titleInput, { target: { value: 'Mumbai Heritage Walk Test Experience' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe what makes your experience/i), { target: { value: 'This is a long enough description for the test to pass validation. It needs to be at least 100 characters long so I am typing more words here to ensure we hit that limit successfully.' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'culture' } });
    
    // Go to next step (Step 2)
    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]);
  };

  it('initializes route planning when "Plan a Walking Route" is clicked', async () => {
    await act(async () => {
      render(<DesignExperienceV2 />);
    });

    // 1. Skip Kickstart
    fireEvent.click(screen.getByText('Start from scratch instead'));

    // 2. Fill Step 1
    await fillBasicForm();

    // 3. We are now on Step 2 (Experience Details) where Map is located
    // Initial state: No waypoints, just a big "Plan a Route" button or standard map
    // Actually, "Plan a Walking Route" button only appears if waypoints.length === 0
    
    // Fill Meeting Point first to enable the button logic context (though button works without it)
    const meetingInput = screen.getByPlaceholderText(/e.g., Gateway of India/i);
    fireEvent.change(meetingInput, { target: { value: 'Gateway of India' } });

    // Find "Plan a Walking Route" button
    const planButton = screen.getByText('Plan a Walking Route with Multiple Stops');
    expect(planButton).toBeInTheDocument();

    // Click it
    fireEvent.click(planButton);

    // 4. Assert UI changes
    // Button should be gone
    expect(screen.queryByText('Plan a Walking Route with Multiple Stops')).not.toBeInTheDocument();
    
    // "Your Route" list should appear
    expect(screen.getByText('Your Route')).toBeInTheDocument();
    
    // Should have 1 stop (Start Point)
    expect(screen.getByText('1 stops • Click a stop to search/edit location')).toBeInTheDocument();
  });

  it('syncs Meeting Point field with the first waypoint', async () => {
    await act(async () => {
      render(<DesignExperienceV2 />);
    });
    fireEvent.click(screen.getByText('Start from scratch instead'));
    await fillBasicForm();

    // Start route planning
    fireEvent.click(screen.getByText('Plan a Walking Route with Multiple Stops'));

    // Change Meeting Point Input
    const meetingInput = screen.getByPlaceholderText(/e.g., Gateway of India/i);
    fireEvent.change(meetingInput, { target: { value: 'New Start Point' } });

    // Check if the route list item updated (it displays the name)
    // We look for the text "New Start Point" in the document
    expect(screen.getByText('New Start Point')).toBeInTheDocument();
  });

  it('adds a new stop correctly', async () => {
    await act(async () => {
      render(<DesignExperienceV2 />);
    });
    fireEvent.click(screen.getByText('Start from scratch instead'));
    await fillBasicForm();
    fireEvent.click(screen.getByText('Plan a Walking Route with Multiple Stops'));

    // Click "Add Stop"
    const addStopButton = screen.getByText('Add Stop');
    fireEvent.click(addStopButton);

    // Should now have 2 stops
    expect(screen.getByText('2 stops • Click a stop to search/edit location')).toBeInTheDocument();
    expect(screen.getByText('New Stop')).toBeInTheDocument();
  });

  it('sends route_data to API on save', async () => {
    await act(async () => {
      render(<DesignExperienceV2 />);
    });
    fireEvent.click(screen.getByText('Start from scratch instead'));
    await fillBasicForm();
    
    // Setup Route: Start -> Stop 1
    fireEvent.click(screen.getByText('Plan a Walking Route with Multiple Stops'));
    const meetingInput = screen.getByPlaceholderText(/e.g., Gateway of India/i);
    fireEvent.change(meetingInput, { target: { value: 'Start Point' } });
    
    fireEvent.click(screen.getByText('Add Stop')); // Add "New Stop"
    
    // Fill remaining required fields to allow save
    // Max Capacity (search by label instead of value as default might change)
    // Note: The label text is "Max Participants *"
    const maxCapacityInput = screen.getByLabelText(/Max Participants/i);
    fireEvent.change(maxCapacityInput, { target: { value: '4' } }); 
    
    fireEvent.change(screen.getByPlaceholderText('2000'), { target: { value: '1500' } }); // Price
    fireEvent.change(screen.getByPlaceholderText(/e.g., Colaba/i), { target: { value: 'Colaba' } }); // Neighborhood
    
    // What to expect (min 50 chars)
    fireEvent.change(screen.getByPlaceholderText(/Describe the unique highlights/i), { 
        target: { value: 'We will walk through the historic streets and see amazing architecture and taste local food.' } 
    });

    // Go to next steps until Save
    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]); // To Step 3
    
    // Step 3 (Additional Info) - skip optional
    fireEvent.click(screen.getAllByText('Next')[0]); // To Step 4
    
    // Step 4 (Photos & Review)
    // Mock photo upload or skip if not strictly required by "Save as Draft" logic?
    // The "Save as Draft" button requires basic fields.
    // Let's click "Save as Draft"
    
    const saveButton = screen.getByText('Save as Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
        expect(experienceAPI.createExperience).toHaveBeenCalled();
    });

    // Check payload
    const callArg = (experienceAPI.createExperience as jest.Mock).mock.calls[0][0];
    
    expect(callArg).toMatchObject({
        title: 'Mumbai Heritage Walk Test Experience',
        route_data: {
            waypoints: expect.arrayContaining([
                expect.objectContaining({ type: 'start', name: 'Start Point' }),
                expect.objectContaining({ type: 'end', name: 'New Stop' }) // Last one becomes end
            ])
        }
    });
  });
});

