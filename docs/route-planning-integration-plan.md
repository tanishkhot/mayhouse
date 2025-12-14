# Route Planning Integration Plan

## Problem Statement

We have implemented a frontend-only Route Planner feature in the Experience Designer (Step 2). However, this data is currently lost upon submission because the backend, database, and API layers are not configured to store or retrieve it. The Admin/Moderator dashboard also cannot visualize the route.

## Integration Gaps

1.  **Frontend Data Loss**: The `waypoints` state in `DesignExperienceV2.tsx` is not passed to the `saveExperienceFromData` function.
2.  **Mapper Deficiency**: `experience-mapper.ts` maps form fields to the API schema but completely ignores the route/waypoints data.
3.  **Backend Schema Gap**: The Pydantic `ExperienceCreate` and `ExperienceResponse` models lack a field to transport route data.
4.  **Database Gap**: The `experiences` table has single-point `latitude`/`longitude` columns but no column to store complex route geometry or waypoints.
5.  **Admin UI Gap**: The Moderator Dashboard reads from the legacy schema and cannot visualize the route for approval.

## Implementation Plan

### Phase 1: Database & Backend (Foundational)

1.  **Database Migration**:

    - Create a new migration file `019_add_route_data_to_experiences.sql`.
    - Add a `route_data` column of type `JSONB` to the `experiences` table.
    - Default value should be `'{}'::jsonb` or `NULL`.
    - Add a comment describing the structure (e.g., `{ waypoints: [...], geometry: ... }`).

2.  **Backend Schemas (`backend/app/schemas/experience.py`)**:
    - Update `ExperienceCreate`, `ExperienceUpdate`, `ExperienceResponse`, and `ExperienceSummary`.
    - Add `route_data: Optional[Dict[str, Any]] = None`.

### Phase 2: Frontend Data Flow

3.  **Update Mapper (`frontend/src/lib/experience-mapper.ts`)**:

    - Update `FormState` type to include `waypoints: Waypoint[]`.
    - Update `mapFormToExperienceCreate` to serialize `waypoints` into the `route_data` field for the API.

4.  **Update Experience Designer (`frontend/src/components/design-experience-v2/DesignExperienceV2.tsx`)**:
    - Ensure `waypoints` are passed into the `form` state or directly to the save handler.
    - When loading an experience (edit mode), deserializing `route_data` back into the `waypoints` state.

### Phase 3: Admin & Visualization

5.  **Update Experience API Client (`frontend/src/lib/experience-api.ts`)**:

    - Ensure the TypeScript interfaces match the new Pydantic models.

6.  **Admin Dashboard (`frontend/src/app/moderator/page.tsx`)**:
    - Update the `ModeratorExperience` interface to include `route_data`.
    - In the "View Details" modal, check if `route_data` exists.
    - If it exists, render the `MapPicker` in "read-only" mode (pass `waypoints` but disable editing interactions) to visualize the route for the moderator.

## Data Structure for `route_data` (JSONB)

```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start"
    },
    {
      "id": "stop-123456",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace",
      "type": "stop"
    }
  ],
  "geometry": {
    "type": "LineString",
    "coordinates": [...]
  },
  "metadata": {
    "total_distance_meters": 1200,
    "estimated_duration_seconds": 900
  }
}
```
