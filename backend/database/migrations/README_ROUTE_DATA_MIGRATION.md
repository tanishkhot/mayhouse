# Route Data Migration Guide

## Overview

This guide covers the migration `019_add_route_data_to_experiences.sql` which adds a `route_data` JSONB column to the `experiences` table for storing route planning information (waypoints, geometry, and metadata).

## Migration Details

**Migration File**: `019_add_route_data_to_experiences.sql`

**Changes**:
- Adds `route_data` JSONB column to `experiences` table
- Sets default value to `'{}'::jsonb` (empty JSON object)
- Adds column comment describing the expected structure

**Expected Structure**:
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

## Pre-Migration Checklist

Before running the migration in production:

- [ ] **Backup Database**: Create a full database backup
  ```bash
  # Via Supabase Dashboard: Settings > Database > Backups
  # Or via pg_dump:
  pg_dump -h <host> -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Verify Current Schema**: Check that `experiences` table exists
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name = 'experiences';
  ```

- [ ] **Check for Active Writes**: Ensure no critical operations are writing to `experiences` table
  - Check application logs for active experience creation/updates
  - Consider running during low-traffic period

- [ ] **Verify Migration Not Already Applied**: Check if column already exists
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'experiences' AND column_name = 'route_data';
  ```
  If this returns a row, the migration has already been applied.

- [ ] **Test on Staging First**: Always test the migration on a staging environment first

## Migration Execution Steps

### Option 1: Via Supabase SQL Editor (Recommended)

1. Log into Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `019_add_route_data_to_experiences.sql`
5. Review the SQL to ensure it's correct:
   ```sql
   ALTER TABLE experiences
   ADD COLUMN IF NOT EXISTS route_data JSONB DEFAULT '{}'::jsonb;
   
   COMMENT ON COLUMN experiences.route_data IS 'JSONB structure containing waypoints (array), geometry (GeoJSON), and metadata for the experience route.';
   ```
6. Click **Run** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
7. Verify success message: "Success. No rows returned"

### Option 2: Via psql Command Line

```bash
# Connect to database
psql -h <supabase-host> -U postgres -d postgres

# Run migration
\i backend/database/migrations/019_add_route_data_to_experiences.sql

# Or paste SQL directly:
ALTER TABLE experiences
ADD COLUMN IF NOT EXISTS route_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN experiences.route_data IS 'JSONB structure containing waypoints (array), geometry (GeoJSON), and metadata for the experience route.';
```

**Expected Output**:
```
ALTER TABLE
COMMENT
```

**Expected Execution Time**: < 1 second (instant for empty table, may take longer if table has millions of rows)

## Post-Migration Verification

### Step 1: Run Verification SQL Script

Execute `020_verify_route_data_migration.sql` in Supabase SQL Editor:

```bash
# Via Supabase Dashboard SQL Editor, or:
psql -h <host> -U postgres -d postgres -f backend/database/migrations/020_verify_route_data_migration.sql
```

**Expected Results**:
- ✅ route_data column: EXISTS
- ✅ route_data data type: JSONB
- ✅ route_data default value: DEFAULT {}
- ✅ route_data column comment: EXISTS
- ✅ Experiences with route_data: 0 experiences found (expected for new migration)

### Step 2: Run Python Test Script

```bash
cd backend
python scripts/test_migrations.py
```

**Expected Output**:
```
🧪 Database Migration Verification Tests
==================================================

🔍 Testing Experiences Table...
==================================================
✅ experiences table exists
✅ All 30 required columns exist
✅ Status enum/column works correctly

🔍 Testing Route Data Column...
==================================================
✅ experiences table exists
✅ route_data column exists
✅ route_data is properly formatted as JSONB (empty object, default value)
✅ route_data column is queryable

📊 Test Summary
==================================================
  ✅ PASSED: Experiences Table
  ✅ PASSED: Design Sessions Q&A Column
  ✅ PASSED: Route Data Column
  ✅ PASSED: Table Indexes
  ✅ PASSED: Data Types

✅ All migration tests passed!
```

### Step 3: Verify Application Functionality

1. **Test Creating Experience with Route**:
   - Create a new experience via the frontend
   - Add waypoints using the route planner
   - Save the experience
   - Verify `route_data` is saved in database:
     ```sql
     SELECT id, title, route_data 
     FROM experiences 
     WHERE route_data IS NOT NULL 
     AND route_data != '{}'::jsonb;
     ```

2. **Test Editing Experience with Route**:
   - Load an experience in edit mode (`?edit=<experience-id>`)
   - Verify waypoints are loaded and displayed
   - Modify waypoints and save
   - Verify changes are persisted

3. **Test Moderator Dashboard**:
   - View experience details in moderator dashboard
   - Verify route visualization appears when `route_data` exists
   - Verify MapPicker renders in read-only mode

4. **Check Application Logs**:
   - Verify no errors related to `route_data` column
   - Check for any warnings or unexpected behavior

## Rollback Procedure

**⚠️ Warning**: Rolling back will remove all route data. Only rollback if absolutely necessary.

### When to Rollback

- Migration causes critical errors that cannot be resolved
- Data corruption occurs
- Application becomes unstable

### Rollback Steps

1. **Stop Application**: Prevent new writes to `experiences` table

2. **Backup Current Data**: Export any route_data before removal
   ```sql
   -- Export experiences with route_data
   SELECT id, title, route_data 
   INTO TEMP TABLE route_data_backup
   FROM experiences 
   WHERE route_data IS NOT NULL 
   AND route_data != '{}'::jsonb;
   ```

3. **Remove Column**:
   ```sql
   ALTER TABLE experiences DROP COLUMN IF EXISTS route_data;
   ```

4. **Verify Rollback**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'experiences' AND column_name = 'route_data';
   ```
   Should return no rows.

5. **Restart Application**: Verify application works without route_data column

### Data Loss Considerations

- **Route data will be lost**: All waypoints and route information will be permanently deleted
- **No automatic recovery**: You'll need to restore from backup if you want to recover the data
- **Application impact**: Route planning features will not work until migration is re-applied

## Troubleshooting

### Error: Column Already Exists

**Symptom**: `ERROR: column "route_data" of relation "experiences" already exists`

**Solution**: Migration has already been applied. Verify with:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'experiences' AND column_name = 'route_data';
```

### Error: Permission Denied

**Symptom**: `ERROR: permission denied for table experiences`

**Solution**: Ensure you're using a database user with ALTER TABLE permissions (typically `postgres` or service role key)

### Error: Table Does Not Exist

**Symptom**: `ERROR: relation "experiences" does not exist`

**Solution**: Verify you're connected to the correct database and that the experiences table exists:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'experiences';
```

### Migration Appears Successful But Tests Fail

**Possible Causes**:
1. Migration ran on wrong database (staging vs production)
2. Column exists but with wrong data type
3. Default value not set correctly

**Solution**: Run verification script and check each test result individually

### Application Errors After Migration

**Symptom**: Application throws errors about `route_data` column

**Possible Causes**:
1. Backend code not updated to handle `route_data`
2. Frontend sending invalid `route_data` structure
3. Pydantic schema mismatch

**Solution**:
1. Verify backend schemas include `route_data: Optional[Dict[str, Any]] = None`
2. Check application logs for specific error messages
3. Verify frontend is sending correct data structure

## Related Files

- **Migration**: `backend/database/migrations/019_add_route_data_to_experiences.sql`
- **Verification Script**: `backend/database/migrations/020_verify_route_data_migration.sql`
- **Test Script**: `backend/scripts/test_migrations.py`
- **Backend Schema**: `backend/app/schemas/experience.py`
- **Frontend Mapper**: `frontend/src/lib/experience-mapper.ts`

## Support

If you encounter issues not covered in this guide:

1. Check application logs for detailed error messages
2. Review the verification script output
3. Test the migration on a staging environment first
4. Contact the development team with:
   - Migration file name
   - Error messages
   - Verification script output
   - Application logs

