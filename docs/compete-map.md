# Map Integration Plan

## Objective

Complete the integration of OpenStreetMap (Leaflet) into the Experience Design wizard to allow hosts to select precise meeting locations. This replaces the simple text input with a trustworthy map interface.

## 1. Backend Foundation (Data Layer)

**Goal**: Enable the system to store and validate precise location coordinates.

- [ ] **Database Migration**: Create `backend/database/migrations/018_add_location_coordinates.sql`
  - Add `latitude` (DECIMAL 10,8) and `longitude` (DECIMAL 11,8) to `experiences` table.
- [ ] **Schema Updates**:
  - Update `[backend/app/schemas/experience.py](backend/app/schemas/experience.py)`: Add `latitude` and `longitude` to `ExperienceCreate`, `ExperienceUpdate`, and `ExperienceResponse`.
  - Update `[backend/app/schemas/design_experience.py](backend/app/schemas/design_experience.py)`: Add coordinates to `StepLogisticsPayload` so the wizard can save them.

## 2. Frontend Integration (UI Layer)

**Goal**: Provide a trustworthy interface for hosts to select locations.

- [ ] **State Management**: Update `[frontend/src/components/design-experience-v2/DesignExperienceV2.tsx](frontend/src/components/design-experience-v2/DesignExperienceV2.tsx)` to track `latitude` and `longitude` in the `FormState`.
- [ ] **Component Integration**: Replace the simple "Meeting Point" text input with the new `[frontend/src/components/ui/map-picker.tsx](frontend/src/components/ui/map-picker.tsx)`.
  - Wire up the `onChange` handler to update both the address string and the coordinates in the form state.

## 3. End-to-End Verification

- [ ] **Verify Persistence**: Create a test experience, select a location on the map, save as draft, and verify that the coordinates appear in the database/API response.
