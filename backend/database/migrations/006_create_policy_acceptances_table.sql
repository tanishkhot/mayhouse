-- Migration: Create policy acceptances table for EIP-712 policy signing
-- Description: This table stores EIP-712 signed policy acceptances with full audit trail

-- Create policy_acceptances table
CREATE TABLE IF NOT EXISTS policy_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL, -- Wallet address for EIP-712 verification
    policy_id TEXT NOT NULL, -- Policy identifier
    policy_type TEXT NOT NULL, -- Type of policy (terms_conditions, background_verification, etc.)
    policy_version TEXT NOT NULL, -- Version of policy that was accepted
    signature TEXT NOT NULL, -- EIP-712 signature
    nonce TEXT NOT NULL, -- Nonce used in signing (prevents replay attacks)
    context TEXT NOT NULL DEFAULT 'general', -- Context of acceptance (host_application, user_registration, etc.)
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_ip INET, -- User's IP address for audit trail
    user_agent TEXT, -- User's browser agent for audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user_id ON policy_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user_address ON policy_acceptances(user_address);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_policy_type ON policy_acceptances(policy_type);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_context ON policy_acceptances(context);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_accepted_at ON policy_acceptances(accepted_at);

-- Create unique constraint to prevent duplicate acceptances
-- A user can only accept the same policy version once
CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_acceptances_unique_user_policy_version 
ON policy_acceptances(user_id, policy_id, policy_version);

-- Create unique constraint on nonce to prevent replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_acceptances_unique_nonce 
ON policy_acceptances(nonce);

-- Add RLS (Row Level Security) policies
ALTER TABLE policy_acceptances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own policy acceptances
CREATE POLICY "Users can view own policy acceptances" ON policy_acceptances
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own policy acceptances
CREATE POLICY "Users can insert own policy acceptances" ON policy_acceptances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all policy acceptances
CREATE POLICY "Admins can view all policy acceptances" ON policy_acceptances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can insert policy acceptances for any user
CREATE POLICY "Admins can insert policy acceptances" ON policy_acceptances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_policy_acceptances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_policy_acceptances_updated_at
    BEFORE UPDATE ON policy_acceptances
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_acceptances_updated_at();

-- Add comments for documentation
COMMENT ON TABLE policy_acceptances IS 'Stores EIP-712 signed policy acceptances with full audit trail';
COMMENT ON COLUMN policy_acceptances.id IS 'Unique identifier for the policy acceptance record';
COMMENT ON COLUMN policy_acceptances.user_id IS 'ID of the user who accepted the policy';
COMMENT ON COLUMN policy_acceptances.user_address IS 'Wallet address used for EIP-712 signature verification';
COMMENT ON COLUMN policy_acceptances.policy_id IS 'Unique identifier of the policy that was accepted';
COMMENT ON COLUMN policy_acceptances.policy_type IS 'Type of policy (terms_conditions, background_verification, etc.)';
COMMENT ON COLUMN policy_acceptances.policy_version IS 'Version of the policy that was accepted';
COMMENT ON COLUMN policy_acceptances.signature IS 'EIP-712 signature proving the user accepted the policy';
COMMENT ON COLUMN policy_acceptances.nonce IS 'Unique nonce used in signing to prevent replay attacks';
COMMENT ON COLUMN policy_acceptances.context IS 'Context of acceptance (host_application, user_registration, etc.)';
COMMENT ON COLUMN policy_acceptances.accepted_at IS 'Timestamp when the policy was accepted';
COMMENT ON COLUMN policy_acceptances.user_ip IS 'IP address of the user for audit trail';
COMMENT ON COLUMN policy_acceptances.user_agent IS 'Browser user agent for audit trail';
