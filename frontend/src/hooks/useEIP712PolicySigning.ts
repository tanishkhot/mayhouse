/**
 * React Hook for EIP-712 Policy Signing
 * 
 * This hook provides a convenient interface for EIP-712 policy signing
 * with wallet integration and error handling.
 */

import { useState, useCallback } from 'react';
import { useSignMessage } from 'wagmi';
import { useAccount } from 'wagmi';
import { 
  EIP712PolicyAPI, 
  EIP712Utils, 
  PolicyType, 
  PolicyAcceptanceRecord,
  PolicyAcceptanceStatus 
} from '@/lib/eip712-policy-api';

interface UseEIP712PolicySigningOptions {
  userId: string;
  context?: string;
}

interface UseEIP712PolicySigningReturn {
  // State
  isSigning: boolean;
  error: string | null;
  acceptanceRecords: PolicyAcceptanceRecord[];
  policyStatus: PolicyAcceptanceStatus | null;
  
  // Actions
  signPolicy: (policyType: PolicyType) => Promise<PolicyAcceptanceRecord>;
  signBulkPolicies: (policyTypes: PolicyType[]) => Promise<PolicyAcceptanceRecord[]>;
  getPolicyStatus: () => Promise<void>;
  getRequiredPolicies: (context?: string) => Promise<PolicyType[]>;
  clearError: () => void;
  reset: () => void;
}

export const useEIP712PolicySigning = (
  options: UseEIP712PolicySigningOptions
): UseEIP712PolicySigningReturn => {
  const { userId, context = 'host_application' } = options;
  
  // Wagmi hooks
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  // State
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptanceRecords, setAcceptanceRecords] = useState<PolicyAcceptanceRecord[]>([]);
  const [policyStatus, setPolicyStatus] = useState<PolicyAcceptanceStatus | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setError(null);
    setAcceptanceRecords([]);
    setPolicyStatus(null);
  }, []);

  // Sign a single policy
  const signPolicy = useCallback(async (policyType: PolicyType): Promise<PolicyAcceptanceRecord> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    if (!signMessageAsync) {
      throw new Error('Sign message function not available');
    }

    setIsSigning(true);
    setError(null);

    try {
      console.log(`🔐 Signing policy: ${policyType}`);
      
      const acceptanceRecord = await EIP712Utils.signAndVerifyPolicy(
        signMessageAsync,
        policyType,
        address,
        userId,
        context
      );

      // Update state
      setAcceptanceRecords(prev => [...prev, acceptanceRecord]);
      
      console.log(`✅ Policy signed successfully: ${policyType}`);
      return acceptanceRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign policy';
      console.error('Policy signing failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsSigning(false);
    }
  }, [address, signMessageAsync, userId, context]);

  // Sign multiple policies
  const signBulkPolicies = useCallback(async (policyTypes: PolicyType[]): Promise<PolicyAcceptanceRecord[]> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    if (!signMessageAsync) {
      throw new Error('Sign message function not available');
    }

    setIsSigning(true);
    setError(null);

    try {
      console.log(`🔐 Signing bulk policies: ${policyTypes.join(', ')}`);
      
      const acceptanceRecords = await EIP712Utils.signAndVerifyBulkPolicies(
        signMessageAsync,
        policyTypes,
        address,
        userId,
        context
      );

      // Update state
      setAcceptanceRecords(prev => [...prev, ...acceptanceRecords]);
      
      console.log(`✅ Bulk policies signed successfully: ${policyTypes.join(', ')}`);
      return acceptanceRecords;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign bulk policies';
      console.error('Bulk policy signing failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsSigning(false);
    }
  }, [address, signMessageAsync, userId, context]);

  // Get policy status
  const getPolicyStatus = useCallback(async (): Promise<void> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('📋 Getting policy status...');
      
      const status = await EIP712PolicyAPI.getUserPolicyStatus(address, userId);
      setPolicyStatus(status);
      
      console.log('✅ Policy status retrieved successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get policy status';
      console.error('Get policy status failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [address, userId]);

  // Get required policies for context
  const getRequiredPolicies = useCallback(async (contextOverride?: string): Promise<PolicyType[]> => {
    try {
      const targetContext = contextOverride || context;
      console.log(`📋 Getting required policies for context: ${targetContext}`);
      
      const policies = await EIP712PolicyAPI.getRequiredPolicies(targetContext);
      
      console.log(`✅ Required policies retrieved: ${policies.join(', ')}`);
      return policies;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get required policies';
      console.error('Get required policies failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [context]);

  return {
    // State
    isSigning,
    error,
    acceptanceRecords,
    policyStatus,
    
    // Actions
    signPolicy,
    signBulkPolicies,
    getPolicyStatus,
    getRequiredPolicies,
    clearError,
    reset
  };
};

// Hook for checking if user has signed required policies
export const usePolicyCompliance = (
  userId: string,
  context: string = 'host_application'
) => {
  const { policyStatus, getPolicyStatus, getRequiredPolicies, error } = useEIP712PolicySigning({
    userId,
    context
  });

  const [requiredPolicies, setRequiredPolicies] = useState<PolicyType[]>([]);
  const [isCompliant, setIsCompliant] = useState<boolean | null>(null);

  const checkCompliance = useCallback(async () => {
    try {
      // Get required policies
      const required = await getRequiredPolicies();
      setRequiredPolicies(required);

      // Get current policy status
      await getPolicyStatus();

      // Check compliance
      if (policyStatus) {
        const acceptedPolicyTypes = policyStatus.acceptances.map(a => a.policy_type as PolicyType);
        const isFullyCompliant = required.every(policy => acceptedPolicyTypes.includes(policy));
        setIsCompliant(isFullyCompliant);
      }
    } catch (err) {
      console.error('Compliance check failed:', err);
      setIsCompliant(false);
    }
  }, [getRequiredPolicies, getPolicyStatus, policyStatus]);

  const missingPolicies = requiredPolicies.filter(
    policy => !policyStatus?.acceptances.some(a => a.policy_type === policy)
  );

  return {
    isCompliant,
    missingPolicies,
    requiredPolicies,
    policyStatus,
    checkCompliance,
    error
  };
};
