# Booking & Payment State Separation

## ✅ Problem Fixed

**Issue**: Double source of truth for payment status in both `event_run_bookings` and `payments` tables → risk of data drift

**Solution**: Clean separation of concerns with single source of truth for each status type

## 🏗️ Schema Changes

### Before (Problematic):
```sql
-- DUPLICATED payment status
event_run_bookings:
  - booking_status (confirmed, cancelled, etc.)
  - payment_status (pending, completed, etc.) ❌ DUPLICATE

payments:
  - status (created, paid, failed, etc.) ❌ DUPLICATE
```

### After (Clean):
```sql
-- SINGLE source of truth for each status type
event_run_bookings:
  - booking_status (confirmed, cancelled, no_show, experience_completed) ✅

payments:  
  - status (created, attempted, paid, failed, refunded) ✅
```

## 🎯 Clear Separation of Concerns

| Table | Responsibility | Status Field | Purpose |
|-------|---------------|-------------|---------|
| `event_run_bookings` | **Experience Lifecycle** | `booking_status` | Tracks traveler's experience journey |
| `payments` | **Payment Processing** | `status` | Tracks payment gateway state |

## 📊 Status Flow Examples

### Booking Lifecycle:
```
confirmed → experience_completed (happy path)
confirmed → cancelled (traveler cancels)  
confirmed → no_show (traveler doesn't show up)
```

### Payment Lifecycle:
```
created → attempted → paid (successful)
created → attempted → failed (card declined)
paid → refunded (cancellation/refund)
```

## 🔗 Querying Both Together

### Helper View for Joined Data:
```sql
-- Clean way to get booking + payment info
SELECT * FROM booking_payment_status 
WHERE event_run_id = 'some-uuid';
```

### Returns:
```sql
booking_id | booking_status | payment_status | payment_amount_inr
-----------|----------------|----------------|-------------------  
uuid-123   | confirmed      | paid          | 3000.00
uuid-456   | cancelled      | refunded      | 1500.00
```

## 💡 Benefits

✅ **No data drift** - Single source of truth for each status type  
✅ **Clear responsibilities** - Booking vs Payment concerns separated  
✅ **Better performance** - Added index on `payments.status`  
✅ **Easier debugging** - Clear which table owns which status  
✅ **Future-proof** - Can extend each status independently  

## 🚀 API Integration

```javascript
// Clean API queries
const bookingInfo = await db.from('booking_payment_status')
  .select('*')
  .eq('booking_id', bookingId)
  .single();

console.log({
  bookingStatus: bookingInfo.booking_status,    // from bookings table
  paymentStatus: bookingInfo.payment_status,    // from payments table  
  // No confusion about which status to use!
});
```

## 🛡️ Capacity Management Integration

The capacity management system already correctly uses only `booking_status` (not payment status), so this change improves the schema without breaking existing functionality.

**Capacity counting**: Only `confirmed` and `experience_completed` bookings count toward event run capacity, regardless of payment status.