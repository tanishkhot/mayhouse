/**
 * EIP-712 Policy Signing API Client
 * 
 * This module provides functions for EIP-712 structured data signing
 * of policy acceptances, enabling secure and legally compliant policy agreements.
 */

import { api } from './api';

// Types for EIP-712 policy signing
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract?: string;
}

export interface PolicyAcceptanceData {
  policyId: string;
  policyType: string;
  policyVersion: string;
  userAddress: string;
  acceptedAt: number;
  context: string;
  nonce: string;
}

export interface PolicySignatureResponse {
  domain: EIP712Domain;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: PolicyAcceptanceData;
  nonce: string;
}

export interface BulkPolicySignatureResponse {
  domain: EIP712Domain;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: {
    policyIds: string[];
    policyTypes: string[];
    policyVersions: string[];
    userAddress: string;
    acceptedAt: number;
    context: string;
    nonce: string;
  };
  nonce: string;
  policy_count: number;
}

export interface PolicyAcceptanceRecord {
  id: string;
  user_id: string;
  user_address: string;
  policy_id: string;
  policy_type: string;
  policy_version: string;
  signature: string;
  nonce: string;
  context: string;
  accepted_at: string;
  user_ip?: string;
  user_agent?: string;
}

export interface PolicyAcceptanceStatus {
  user_id: string;
  user_address: string;
  acceptances: PolicyAcceptanceRecord[];
  missing_policies: string[];
  last_updated: string;
}

export type PolicyType = 
  | 'terms_conditions'
  | 'background_verification'
  | 'privacy_policy'
  | 'host_agreement'
  | 'cancellation_policy';

export interface PolicySignatureRequest {
  policy_type: PolicyType;
  user_address: string;
  context?: string;
  nonce?: string;
}

export interface BulkPolicySignatureRequest {
  policy_types: PolicyType[];
  user_address: string;
  context?: string;
  nonce?: string;
}

export interface PolicySignatureVerification {
  policy_type: PolicyType;
  user_address: string;
  signature: string;
  nonce: string;
  context?: string;
}

// API Functions
export const EIP712PolicyAPI = {
  /**
   * Prepare EIP-712 structured data for signing a single policy
   */
  preparePolicySignature: async (
    request: PolicySignatureRequest,
    userId: string
  ): Promise<PolicySignatureResponse> => {
    console.log('🔐 Preparing EIP-712 policy signature...', request);
    
    try {
      const response = await api.post('/legal/eip712/prepare-signature', {
        signature_request: request,
        user_id: userId
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to prepare policy signature:', error);
      throw new Error(`Failed to prepare policy signature: ${error.message}`);
    }
  },

  /**
   * Prepare EIP-712 structured data for signing multiple policies
   */
  prepareBulkPolicySignature: async (
    request: BulkPolicySignatureRequest,
    userId: string
  ): Promise<BulkPolicySignatureResponse> => {
    console.log('🔐 Preparing EIP-712 bulk policy signature...', request);
    
    try {
      const response = await api.post('/legal/eip712/prepare-bulk-signature', {
        bulk_request: request,
        user_id: userId
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to prepare bulk policy signature:', error);
      throw new Error(`Failed to prepare bulk policy signature: ${error.message}`);
    }
  },

  /**
   * Verify EIP-712 signature and record policy acceptance
   */
  verifyPolicySignature: async (
    verification: PolicySignatureVerification,
    userId: string
  ): Promise<PolicyAcceptanceRecord> => {
    console.log('✅ Verifying EIP-712 policy signature...', verification);
    
    try {
      const response = await api.post('/legal/eip712/verify-signature', {
        verification,
        user_id: userId
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to verify policy signature:', error);
      throw new Error(`Failed to verify policy signature: ${error.message}`);
    }
  },

  /**
   * Get policy acceptance status for a user
   */
  getUserPolicyStatus: async (
    userAddress: string,
    userId: string
  ): Promise<PolicyAcceptanceStatus> => {
    console.log('📋 Getting user policy status...', { userAddress, userId });
    
    try {
      const response = await api.get(`/legal/eip712/policy-status/${userAddress}`, {
        data: { user_id: userId }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get policy status:', error);
      throw new Error(`Failed to get policy status: ${error.message}`);
    }
  },

  /**
   * Get required policies for a given context
   */
  getRequiredPolicies: async (context: string): Promise<PolicyType[]> => {
    console.log('📋 Getting required policies for context...', context);
    
    try {
      const response = await api.get(`/legal/eip712/required-policies/${context}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get required policies:', error);
      throw new Error(`Failed to get required policies: ${error.message}`);
    }
  },

  /**
   * Health check for EIP-712 policy service
   */
  healthCheck: async (): Promise<any> => {
    console.log('🏥 Checking EIP-712 policy service health...');
    
    try {
      const response = await api.get('/legal/eip712/health');
      return response.data;
    } catch (error: any) {
      console.error('EIP-712 policy service health check failed:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
};

// Utility functions for EIP-712 signing
export const EIP712Utils = {
  /**
   * Sign EIP-712 structured data with wallet
   */
  signPolicyAcceptance: async (
    signMessageAsync: (message: { message: string }) => Promise<string>,
    signatureData: PolicySignatureResponse
  ): Promise<string> => {
    console.log('✍️ Signing EIP-712 policy acceptance...');
    
    try {
      // Convert structured data to message string for signing
      const message = JSON.stringify({
        domain: signatureData.domain,
        types: signatureData.types,
        primaryType: signatureData.primaryType,
        message: signatureData.message
      });
      
      const signature = await signMessageAsync({ message });
      console.log('✅ Policy acceptance signed successfully');
      return signature;
    } catch (error: any) {
      console.error('Failed to sign policy acceptance:', error);
      throw new Error(`Failed to sign policy acceptance: ${error.message}`);
    }
  },

  /**
   * Sign bulk EIP-712 structured data with wallet
   */
  signBulkPolicyAcceptance: async (
    signMessageAsync: (message: { message: string }) => Promise<string>,
    signatureData: BulkPolicySignatureResponse
  ): Promise<string> => {
    console.log('✍️ Signing EIP-712 bulk policy acceptance...');
    
    try {
      // Convert structured data to message string for signing
      const message = JSON.stringify({
        domain: signatureData.domain,
        types: signatureData.types,
        primaryType: signatureData.primaryType,
        message: signatureData.message
      });
      
      const signature = await signMessageAsync({ message });
      console.log('✅ Bulk policy acceptance signed successfully');
      return signature;
    } catch (error: any) {
      console.error('Failed to sign bulk policy acceptance:', error);
      throw new Error(`Failed to sign bulk policy acceptance: ${error.message}`);
    }
  },

  /**
   * Complete policy signing flow
   */
  signAndVerifyPolicy: async (
    signMessageAsync: (message: { message: string }) => Promise<string>,
    policyType: PolicyType,
    userAddress: string,
    userId: string,
    context: string = 'host_application'
  ): Promise<PolicyAcceptanceRecord> => {
    console.log('🔄 Starting complete policy signing flow...', { policyType, userAddress, context });
    
    try {
      // Step 1: Prepare signature
      const signatureData = await EIP712PolicyAPI.preparePolicySignature(
        { policy_type: policyType, user_address: userAddress, context },
        userId
      );
      
      // Step 2: Sign with wallet
      const signature = await EIP712Utils.signPolicyAcceptance(signMessageAsync, signatureData);
      
      // Step 3: Verify signature
      const acceptanceRecord = await EIP712PolicyAPI.verifyPolicySignature(
        {
          policy_type: policyType,
          user_address: userAddress,
          signature,
          nonce: signatureData.nonce,
          context
        },
        userId
      );
      
      console.log('✅ Policy signing flow completed successfully');
      return acceptanceRecord;
    } catch (error: any) {
      console.error('Policy signing flow failed:', error);
      throw error;
    }
  },

  /**
   * Complete bulk policy signing flow
   */
  signAndVerifyBulkPolicies: async (
    signMessageAsync: (message: { message: string }) => Promise<string>,
    policyTypes: PolicyType[],
    userAddress: string,
    userId: string,
    context: string = 'host_application'
  ): Promise<PolicyAcceptanceRecord[]> => {
    console.log('🔄 Starting complete bulk policy signing flow...', { policyTypes, userAddress, context });
    
    try {
      // Step 1: Prepare bulk signature
      const signatureData = await EIP712PolicyAPI.prepareBulkPolicySignature(
        { policy_types: policyTypes, user_address: userAddress, context },
        userId
      );
      
      // Step 2: Sign with wallet
      const signature = await EIP712Utils.signBulkPolicyAcceptance(signMessageAsync, signatureData);
      
      // Step 3: Verify each policy individually
      const acceptanceRecords: PolicyAcceptanceRecord[] = [];
      
      for (let i = 0; i < policyTypes.length; i++) {
        const acceptanceRecord = await EIP712PolicyAPI.verifyPolicySignature(
          {
            policy_type: policyTypes[i],
            user_address: userAddress,
            signature,
            nonce: signatureData.nonce,
            context
          },
          userId
        );
        acceptanceRecords.push(acceptanceRecord);
      }
      
      console.log('✅ Bulk policy signing flow completed successfully');
      return acceptanceRecords;
    } catch (error: any) {
      console.error('Bulk policy signing flow failed:', error);
      throw error;
    }
  }
};
