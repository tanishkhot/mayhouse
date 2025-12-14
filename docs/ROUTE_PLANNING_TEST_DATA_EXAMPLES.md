# Route Planning Test Data Examples

This document provides sample `route_data` JSONB structures for testing route planning integration. Use these examples to verify data handling, edge cases, and expected behavior.

## Example 1: Simple Route (2 waypoints)

**Use Case**: Minimal valid route with just start and end points.

**JSON Structure**:
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
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Market",
      "type": "end"
    }
  ]
}
```

**How to Test**:
1. Create a new experience
2. Add only 2 waypoints (start and end)
3. Save the experience
4. Verify both waypoints are saved correctly
5. View in moderator dashboard - should show route with 2 waypoints

**Expected Behavior**:
- Both waypoints appear on map
- Start waypoint is green marker
- End waypoint is red marker
- Route visualization shows straight line between points
- Waypoint count text shows "2 waypoints"

**SQL Insert** (for direct database testing):
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Market",
      "type": "end"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 2: Complex Route (5+ waypoints)

**Use Case**: Full-featured route with multiple stops, names, types, and descriptions.

**JSON Structure**:
```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start",
      "description": "Meeting point for the heritage walk"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace Hotel",
      "type": "stop",
      "description": "Historic luxury hotel, built in 1903"
    },
    {
      "id": "stop-2",
      "lat": 19.0768,
      "lng": 72.8783,
      "name": "Colaba Causeway",
      "type": "stop",
      "description": "Famous shopping street"
    },
    {
      "id": "stop-3",
      "lat": 19.0772,
      "lng": 72.8786,
      "name": "Regal Cinema",
      "type": "stop",
      "description": "Art Deco cinema from 1933"
    },
    {
      "id": "end",
      "lat": 19.0775,
      "lng": 72.8790,
      "name": "Colaba Market",
      "type": "end",
      "description": "Final stop - local market experience"
    }
  ]
}
```

**How to Test**:
1. Create a new experience
2. Add 5 waypoints with names and descriptions
3. Save the experience
4. Verify all waypoints are saved with descriptions
5. Edit the experience - verify descriptions are preserved
6. View in moderator dashboard - verify all waypoints display

**Expected Behavior**:
- All 5 waypoints appear on map
- Waypoint list shows all names and descriptions
- Route visualization shows path through all waypoints
- Map zooms to show entire route
- Waypoint count text shows "5 waypoints"

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start",
      "description": "Meeting point for the heritage walk"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace Hotel",
      "type": "stop",
      "description": "Historic luxury hotel, built in 1903"
    },
    {
      "id": "stop-2",
      "lat": 19.0768,
      "lng": 72.8783,
      "name": "Colaba Causeway",
      "type": "stop",
      "description": "Famous shopping street"
    },
    {
      "id": "stop-3",
      "lat": 19.0772,
      "lng": 72.8786,
      "name": "Regal Cinema",
      "type": "stop",
      "description": "Art Deco cinema from 1933"
    },
    {
      "id": "end",
      "lat": 19.0775,
      "lng": 72.8790,
      "name": "Colaba Market",
      "type": "end",
      "description": "Final stop - local market experience"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 3: Route with Only Start Point

**Use Case**: Edge case - route with single waypoint (no stops, no end).

**JSON Structure**:
```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start"
    }
  ]
}
```

**How to Test**:
1. Create an experience
2. Add only start point (don't add stops or end)
3. Save the experience
4. Verify single waypoint is saved
5. View in moderator dashboard - verify behavior (may or may not show route section)

**Expected Behavior**:
- Single waypoint is saved
- Application handles single waypoint gracefully
- Route visualization may not appear (implementation dependent)
- No errors occur

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 4: Route with Very Long Waypoint Names

**Use Case**: Test handling of long text fields.

**JSON Structure**:
```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India - The Iconic Monument Built to Commemorate the Landing of King George V and Queen Mary at Apollo Bunder in 1911",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "The Taj Mahal Palace Hotel - A Luxury Five-Star Hotel Located in the Colaba Area of Mumbai, India, Situated Next to the Gateway of India",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Causeway Market - A Famous Shopping Street Known for Its Street Vendors, Shops Selling Everything from Clothes to Electronics to Souvenirs",
      "type": "end"
    }
  ]
}
```

**How to Test**:
1. Create an experience
2. Add waypoints with very long names (200+ characters)
3. Save the experience
4. Verify long names are saved correctly
5. View in edit mode - verify names display correctly (may truncate in UI)
6. View in moderator dashboard - verify names display correctly

**Expected Behavior**:
- Long names are saved to database (no truncation)
- UI may truncate names with ellipsis for display
- Full names are accessible on hover or click
- No database errors occur

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India - The Iconic Monument Built to Commemorate the Landing of King George V and Queen Mary at Apollo Bunder in 1911",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "The Taj Mahal Palace Hotel - A Luxury Five-Star Hotel Located in the Colaba Area of Mumbai, India, Situated Next to the Gateway of India",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Causeway Market - A Famous Shopping Street Known for Its Street Vendors, Shops Selling Everything from Clothes to Electronics to Souvenirs",
      "type": "end"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 5: Route with Special Characters in Names

**Use Case**: Test handling of special characters, Unicode, and emojis.

**JSON Structure**:
```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India 🏛️",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace Hotel (5★)",
      "type": "stop"
    },
    {
      "id": "stop-2",
      "lat": 19.0768,
      "lng": 72.8783,
      "name": "Colaba Causeway - \"The Shopping Street\"",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Market & Café",
      "type": "end"
    }
  ]
}
```

**How to Test**:
1. Create an experience
2. Add waypoints with special characters in names
3. Save the experience
4. Verify special characters are preserved
5. View in edit mode - verify names display correctly
6. View in moderator dashboard - verify names display correctly

**Expected Behavior**:
- Special characters are preserved in database
- Names display correctly in UI (no encoding issues)
- No SQL injection or XSS vulnerabilities
- JSON parsing works correctly

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India 🏛️",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace Hotel (5★)",
      "type": "stop"
    },
    {
      "id": "stop-2",
      "lat": 19.0768,
      "lng": 72.8783,
      "name": "Colaba Causeway - \"The Shopping Street\"",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Market & Café",
      "type": "end"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 6: Route with Coordinates at Boundaries

**Use Case**: Test handling of extreme coordinate values (boundary conditions).

**JSON Structure**:
```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 90.0,
      "lng": 180.0,
      "name": "North Pole (boundary test)",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": -90.0,
      "lng": -180.0,
      "name": "South Pole (boundary test)",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 0.0,
      "lng": 0.0,
      "name": "Equator/Prime Meridian (boundary test)",
      "type": "end"
    }
  ]
}
```

**How to Test**:
1. Create an experience
2. Manually set waypoint coordinates to boundary values (via SQL or API)
3. Save the experience
4. Verify coordinates are saved correctly
5. View in moderator dashboard - verify map handles extreme coordinates

**Expected Behavior**:
- Boundary coordinates are accepted and saved
- Map may not display correctly (expected - these are test coordinates)
- Validation should accept valid ranges (-90 to 90 for lat, -180 to 180 for lng)
- Invalid coordinates (> 90, < -90, etc.) should be rejected

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 90.0,
      "lng": 180.0,
      "name": "North Pole (boundary test)",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": -90.0,
      "lng": -180.0,
      "name": "South Pole (boundary test)",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 0.0,
      "lng": 0.0,
      "name": "Equator/Prime Meridian (boundary test)",
      "type": "end"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 7: Route with Empty Waypoint Names

**Use Case**: Test handling of missing or empty name fields.

**JSON Structure**:
```json
{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "",
      "type": "end"
    }
  ]
}
```

**How to Test**:
1. Create an experience
2. Add waypoints without entering names (leave blank)
3. Save the experience
4. Verify empty names are saved as empty strings (not null)
5. View in edit mode - verify waypoints load correctly
6. View in moderator dashboard - verify waypoints display (may show coordinates or "Unnamed")

**Expected Behavior**:
- Empty names are saved as empty strings `""`
- Application handles empty names gracefully
- UI may show fallback text (coordinates or "Unnamed location")
- No errors occur

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "",
      "type": "end"
    }
  ]
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Example 8: Route with Geometry and Metadata

**Use Case**: Full route_data structure including geometry and metadata (if implemented).

**JSON Structure**:
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
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Market",
      "type": "end"
    }
  ],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [72.8777, 19.0760],
      [72.8780, 19.0765],
      [72.8785, 19.0770]
    ]
  },
  "metadata": {
    "total_distance_meters": 500,
    "estimated_duration_seconds": 600
  }
}
```

**How to Test**:
1. Create an experience with waypoints
2. If geometry/metadata are generated automatically, verify they're saved
3. If geometry/metadata are manual, add them via SQL
4. Verify full structure is saved
5. View in moderator dashboard - verify geometry displays as route line (if implemented)

**Expected Behavior**:
- Geometry and metadata are saved (if supported)
- Route line displays on map (if geometry rendering is implemented)
- Distance and duration are shown (if metadata display is implemented)
- Application handles missing geometry/metadata gracefully

**SQL Insert**:
```sql
UPDATE experiences
SET route_data = '{
  "waypoints": [
    {
      "id": "start",
      "lat": 19.0760,
      "lng": 72.8777,
      "name": "Gateway of India",
      "type": "start"
    },
    {
      "id": "stop-1",
      "lat": 19.0765,
      "lng": 72.8780,
      "name": "Taj Mahal Palace",
      "type": "stop"
    },
    {
      "id": "end",
      "lat": 19.0770,
      "lng": 72.8785,
      "name": "Colaba Market",
      "type": "end"
    }
  ],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [72.8777, 19.0760],
      [72.8780, 19.0765],
      [72.8785, 19.0770]
    ]
  },
  "metadata": {
    "total_distance_meters": 500,
    "estimated_duration_seconds": 600
  }
}'::jsonb
WHERE id = '<your-experience-id>';
```

---

## Testing Workflow

### Step 1: Choose an Example
Select an example based on what you want to test:
- **Example 1**: Basic functionality
- **Example 2**: Full features
- **Example 3-8**: Edge cases

### Step 2: Insert Test Data
- Option A: Use the UI to create waypoints matching the example
- Option B: Use SQL INSERT/UPDATE to directly set route_data

### Step 3: Verify Behavior
- Check database: Run verification queries from `022_e2e_verification_queries.sql`
- Check UI: View experience in edit mode and moderator dashboard
- Check API: Verify API responses include route_data correctly

### Step 4: Document Results
- Record any unexpected behavior
- Note any errors or warnings
- Update test results template

---

## Notes

- All examples use Mumbai coordinates (19.0760, 72.8777) for consistency
- Replace `<your-experience-id>` with actual experience IDs when testing
- Examples assume waypoints array is the minimum required structure
- Geometry and metadata are optional and may not be implemented yet
- Test examples in order of complexity (simple → complex → edge cases)

