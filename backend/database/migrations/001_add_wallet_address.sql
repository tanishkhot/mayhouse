-- Migration: Add wallet_address column to users table
-- Description: Enables Web3 wallet authentication for Mayhouse ETH

-- Add wallet_address column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
ON users(wallet_address) 
WHERE wallet_address IS NOT NULL;

-- Make email optional for wallet-only users
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.wallet_address IS 'Ethereum wallet address for Web3 authentication';

-- Note: Users can authenticate via:
-- 1. Traditional email/password (existing)
-- 2. Web3 wallet (new)
-- 3. Both (linked account)

