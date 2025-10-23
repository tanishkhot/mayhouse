# Database Naming Conventions

## ✅ Problem Fixed

**Issue**: Redundant column names in `event_runs` table that included table name prefix

**Solution**: Cleaned up column names to be concise while maintaining clarity

## 🎯 Naming Convention Improvements

### **Before (Redundant):**
```sql
CREATE TABLE event_runs (
    eventrun_start_datetime TIMESTAMP,    -- ❌ REDUNDANT PREFIX
    eventrun_end_datetime TIMESTAMP,      -- ❌ REDUNDANT PREFIX  
    eventrun_status event_run_status       -- ❌ REDUNDANT PREFIX
);
```

### **After (Clean):**
```sql
CREATE TABLE event_runs (
    start_datetime TIMESTAMP,             -- ✅ CONCISE & CLEAR
    end_datetime TIMESTAMP,               -- ✅ CONCISE & CLEAR
    status event_run_status               -- ✅ CONCISE & CLEAR
);
```

## 💡 Naming Convention Strategy

### **1. Table Names**
- **Plural nouns**: `users`, `experiences`, `event_runs`
- **Snake_case**: `event_run_bookings`, `host_profiles`
- **Descriptive**: Clear purpose without abbreviations

### **2. Column Names**
- **No table prefix**: Column context is clear from table
- **Descriptive**: `start_datetime` not `start_dt`
- **Consistent**: All datetime columns use `_datetime` suffix

### **3. Foreign Key Names**
- **Singular + _id**: `user_id`, `experience_id`, `event_run_id`
- **Clear relationships**: Immediately obvious what they reference

### **4. Status Columns**
- **Simple name**: `status` (not `table_status`)
- **Typed enum**: Clear allowed values via enum types
- **Consistent pattern**: All status columns follow same pattern

## 📊 Naming Consistency Examples

### **✅ Good Naming (Current):**

| **Table** | **Column** | **Type** | **Why Good** |
|-----------|------------|----------|--------------|
| `event_runs` | `start_datetime` | TIMESTAMP | Clear, concise, no redundancy |
| `event_runs` | `status` | event_run_status | Context clear from table |
| `experiences` | `status` | experience_status | Consistent pattern |
| `users` | `created_at` | TIMESTAMP | Standard Rails convention |

### **❌ Bad Naming (Avoided):**

| **Bad Example** | **Why Bad** | **Better Alternative** |
|-----------------|-------------|------------------------|
| `eventrun_start_datetime` | Redundant table prefix | `start_datetime` |
| `exp_id` | Unclear abbreviation | `experience_id` |
| `usr_nm` | Cryptic abbreviation | `full_name` |
| `dt_created` | Inconsistent pattern | `created_at` |

## 🔍 Query Readability Impact

### **Before (Verbose):**
```sql
-- Redundant and verbose
SELECT 
    eventrun_start_datetime,
    eventrun_end_datetime,
    eventrun_status
FROM event_runs 
WHERE eventrun_start_datetime > NOW()
AND eventrun_status = 'scheduled';
```

### **After (Clean):**
```sql
-- Concise and readable
SELECT 
    start_datetime,
    end_datetime,
    status
FROM event_runs 
WHERE start_datetime > NOW()
AND status = 'scheduled';
```

**Benefits:**
- ✅ **20% shorter queries** - Less typing, easier to read
- ✅ **Clearer intent** - Focus on data, not redundant prefixes
- ✅ **Better maintainability** - Consistent patterns across tables

## 🎨 Consistent Patterns Applied

### **DateTime Columns:**
- `created_at` - When record was created
- `updated_at` - When record was last modified  
- `start_datetime` - When event/process starts
- `end_datetime` - When event/process ends
- `booked_at` - When booking was made

### **Status Columns:**
- Always named `status`
- Always use typed enums for validation
- Consistent across all tables

### **ID Columns:**
- Primary keys: always `id`
- Foreign keys: `{table_singular}_id`
- UUIDs: Always use `uuid_generate_v4()`

### **Boolean Columns:**
- Prefix with `is_` or `has_`: `is_active`, `has_completed`
- Default values explicitly set
- Clear true/false meaning

## 🚀 Developer Experience Benefits

### **Code Completion:**
```javascript
// Shorter, cleaner autocomplete
event_run.start_datetime  // ✅ Clean
event_run.eventrun_start_datetime  // ❌ Verbose
```

### **API Responses:**
```json
{
  "id": "uuid",
  "start_datetime": "2025-01-01T10:00:00Z",  
  "end_datetime": "2025-01-01T13:00:00Z",    
  "status": "scheduled"                      
}
```

### **Database Introspection:**
```sql
-- Clear column descriptions
\d event_runs
                Table "public.event_runs"
     Column      |           Type           |   Modifiers   
-----------------+--------------------------+---------------
 id              | uuid                     | not null default uuid_generate_v4()
 experience_id   | uuid                     | not null
 start_datetime  | timestamptz              | not null  ✅ CLEAR
 end_datetime    | timestamptz              | not null  ✅ CLEAR  
 status          | event_run_status         | not null  ✅ CLEAR
```

## 📈 Scalability Benefits

### **Future-Proof Naming:**
- Easy to add related columns without naming conflicts
- Consistent patterns make adding new tables predictable
- Clear for new developers joining the project

### **Integration-Friendly:**
- API field names map directly to database columns
- ORM mappings are straightforward
- GraphQL schema generation is clean

## 🎯 Implementation Guidelines

### **For New Columns:**
1. **Check context**: Is table prefix needed? (Usually no)
2. **Use full words**: Avoid abbreviations unless universally understood
3. **Follow patterns**: Match existing column naming in similar tables
4. **Consider queries**: Will this name read well in SELECT statements?

### **For New Tables:**
1. **Plural table names**: `bookings` not `booking`
2. **Snake_case**: `event_runs` not `EventRuns`
3. **Clear purpose**: `host_profiles` not `profiles`
4. **Avoid prefixes**: `users` not `app_users`

**Bottom Line**: Clean, consistent naming conventions improve **developer productivity** and **codebase maintainability**! 🚀