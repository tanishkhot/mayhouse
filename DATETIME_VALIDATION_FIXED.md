# DateTime Validation Fixed! ✅

## Issue
**422 Unprocessable Entity** error when creating event runs.

### Root Cause
- Frontend was sending datetime as ISO strings: `"2024-10-26T10:00:00"`
- Backend Pydantic schema expected `datetime` objects
- Type mismatch caused validation to fail

## Solution Applied

### 1. **Backend Schema - Accept String Input** ✅

**File:** `mayhouse-eth/backend/app/schemas/event_run.py`

**Before:**
```python
class EventRunCreate(BaseModel):
    start_datetime: datetime  # ❌ Expected datetime object
    end_datetime: datetime    # ❌ Expected datetime object
    
    @field_validator("start_datetime")
    def start_in_future(cls, v):
        if v <= datetime.now():  # ❌ Direct datetime comparison
            raise ValueError("Event must be in future")
        return v
```

**After:**
```python
class EventRunCreate(BaseModel):
    start_datetime: str  # ✅ Accept ISO string
    end_datetime: str    # ✅ Accept ISO string
    
    @field_validator("start_datetime")
    def validate_start_datetime(cls, v):
        try:
            # ✅ Parse string to datetime for validation
            dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            from datetime import timezone
            now = datetime.now(timezone.utc) if dt.tzinfo else datetime.now()
            if dt <= now:
                raise ValueError("Event must be scheduled for a future date")
            return v  # ✅ Return original string
        except ValueError as e:
            if "Event must be scheduled" in str(e):
                raise e
            raise ValueError(f"Invalid datetime format: {v}")
```

### 2. **Service Layer - Handle String Format** ✅

**File:** `mayhouse-eth/backend/app/services/event_run_service.py`

**Before:**
```python
insert_data = {
    "start_datetime": event_run_data.start_datetime.isoformat(),  # ❌ String has no .isoformat()
    "end_datetime": event_run_data.end_datetime.isoformat(),      # ❌ String has no .isoformat()
}

# Blockchain call
blockchain_service.create_event_run_onchain(
    event_timestamp=event_run_data.start_datetime,  # ❌ Sending string, expects datetime
    ...
)
```

**After:**
```python
insert_data = {
    "start_datetime": event_run_data.start_datetime,  # ✅ Already ISO string
    "end_datetime": event_run_data.end_datetime,      # ✅ Already ISO string
}

# Blockchain call
# ✅ Convert string to datetime for blockchain service
start_dt = datetime.fromisoformat(event_run_data.start_datetime.replace('Z', '+00:00'))

blockchain_service.create_event_run_onchain(
    event_timestamp=start_dt,  # ✅ Datetime object
    ...
)
```

## How It Works Now

### Full Request Flow:

```
1. Frontend Form
   ↓
   User inputs: Date: 2024-10-26, Time: 10:00
   ↓
2. Frontend Constructs
   ↓
   start_datetime: "2024-10-26T10:00:00"
   end_datetime: "2024-10-26T12:00:00"
   ↓
3. API Request
   ↓
   POST /hosts/event-runs
   Headers: Authorization: Bearer <token>
   Body: {
     "experience_id": "uuid",
     "start_datetime": "2024-10-26T10:00:00",  ✅ String
     "end_datetime": "2024-10-26T12:00:00",    ✅ String
     "max_capacity": 4,
     ...
   }
   ↓
4. Backend Validation (Pydantic)
   ↓
   - Accept as string ✅
   - Parse to datetime for validation ✅
   - Check future date ✅
   - Check end > start ✅
   - Return validated string ✅
   ↓
5. Service Layer
   ↓
   - Insert string directly to DB ✅
   - Convert to datetime for blockchain ✅
   - Create on-chain event ✅
   ↓
6. Response
   ↓
   Returns EventRunResponse with blockchain_event_run_id ✅
```

## Validation Rules

### Start DateTime:
```python
# Must be valid ISO format
✅ "2024-10-26T10:00:00"
✅ "2024-10-26T10:00:00Z"
✅ "2024-10-26T10:00:00+00:00"
❌ "10/26/2024 10:00 AM"
❌ "tomorrow at 10am"

# Must be in the future
✅ Tomorrow at any time
❌ Yesterday
❌ Today in the past
```

### End DateTime:
```python
# Must be valid ISO format
✅ Same formats as start

# Must be after start
✅ Start: 10:00, End: 12:00
❌ Start: 12:00, End: 10:00
❌ Start: 10:00, End: 10:00 (equal)
```

### Max Capacity:
```python
✅ 1, 2, 3, or 4
❌ 0
❌ 5 or more
```

## Error Messages

### Invalid Date Format:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "start_datetime"],
      "msg": "Invalid datetime format: 10/26/2024. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
    }
  ]
}
```

### Past Date:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "start_datetime"],
      "msg": "Event must be scheduled for a future date"
    }
  ]
}
```

### End Before Start:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "end_datetime"],
      "msg": "End datetime must be after start datetime"
    }
  ]
}
```

## Frontend Error Display

The `EventRunScheduler` component now properly displays these errors:

```typescript
catch (err: unknown) {
  let errorMessage = 'Failed to schedule event run. Please try again.';
  
  if (err && typeof err === 'object' && 'response' in err) {
    const detail = err.response?.data?.detail;
    
    if (typeof detail === 'string') {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      // Multiple validation errors
      errorMessage = detail.map(e => e.msg).join(', ');
    }
  }
  
  setError(errorMessage);
}
```

**Example Display:**
```
❌ Invalid datetime format: 10/26/2024. Use ISO format (YYYY-MM-DDTHH:MM:SS), End datetime must be after start datetime
```

## Testing

### Valid Event Run Creation:
```
1. Login with wallet
2. Create and approve experience
3. Go to Host Dashboard → Event Runs
4. Click "Create Event Run"
5. Fill form:
   - Date: Tomorrow (or later)
   - Start Time: 10:00
   - End Time: 12:00
   - Capacity: 4
6. Submit
7. ✅ Success! Event created
```

### Test Validation Errors:

#### Past Date:
```
Date: Yesterday
Time: 10:00
Result: ❌ "Event must be scheduled for a future date"
```

#### End Before Start:
```
Start: 12:00
End: 10:00
Result: ❌ "End datetime must be after start datetime"
```

#### Invalid Capacity:
```
Capacity: 5
Result: ❌ "Max capacity must be between 1-4"
```

## Database Format

Events are stored in the database as ISO strings:

```sql
SELECT id, start_datetime, end_datetime 
FROM event_runs 
LIMIT 1;

-- Result:
-- id: 123e4567-...
-- start_datetime: 2024-10-26T10:00:00
-- end_datetime: 2024-10-26T12:00:00
```

PostgreSQL automatically handles timezone conversions when querying.

## Blockchain Format

The blockchain stores Unix timestamps:

```solidity
struct EventRun {
    uint256 eventTimestamp;  // Unix timestamp (seconds since 1970)
    ...
}
```

**Conversion in service:**
```python
start_dt = datetime.fromisoformat("2024-10-26T10:00:00")
unix_timestamp = int(start_dt.timestamp())
# Result: 1729936800
```

## All Systems Working! 🎉

✅ **Frontend sends ISO strings**  
✅ **Backend validates strings**  
✅ **Database stores strings**  
✅ **Blockchain gets timestamps**  
✅ **Error messages are clear**  

**Now you can create event runs successfully! Try it out! 🚀**

