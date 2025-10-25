-- Migration: Add blockchain integration to event_runs and bookings
-- Description: Links database records with smart contract records

-- Add blockchain_event_run_id to event_runs table
ALTER TABLE event_runs 
ADD COLUMN IF NOT EXISTS blockchain_event_run_id INTEGER,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS blockchain_status TEXT DEFAULT 'pending';

-- Add blockchain_booking_id to event_run_bookings table  
ALTER TABLE event_run_bookings
ADD COLUMN IF NOT EXISTS blockchain_booking_id INTEGER,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS blockchain_stake_amount_wei BIGINT;

-- Create index for faster blockchain lookups
CREATE INDEX IF NOT EXISTS idx_event_runs_blockchain_id 
ON event_runs(blockchain_event_run_id) 
WHERE blockchain_event_run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_blockchain_id 
ON event_run_bookings(blockchain_booking_id) 
WHERE blockchain_booking_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN event_runs.blockchain_event_run_id IS 'ID of the event run on the smart contract';
COMMENT ON COLUMN event_runs.blockchain_tx_hash IS 'Transaction hash of event creation on blockchain';
COMMENT ON COLUMN event_runs.blockchain_status IS 'Status of blockchain sync: pending, confirmed, failed';

COMMENT ON COLUMN event_run_bookings.blockchain_booking_id IS 'ID of the booking on the smart contract';
COMMENT ON COLUMN event_run_bookings.blockchain_tx_hash IS 'Transaction hash of booking on blockchain';
COMMENT ON COLUMN event_run_bookings.blockchain_stake_amount_wei IS 'Stake amount in Wei (20% of booking cost)';

-- Create enum type for blockchain status (if not exists)
DO $$ BEGIN
    CREATE TYPE blockchain_sync_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the blockchain_status column to use the enum
ALTER TABLE event_runs 
ALTER COLUMN blockchain_status TYPE blockchain_sync_status USING blockchain_status::blockchain_sync_status;

