/**
 * EIP-712 Policy Signer Component
 * 
 * This component provides a UI for EIP-712 policy signing with wallet integration.
 * It can handle both single policy and bulk policy signing.
 */

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useEIP712PolicySigning, usePolicyCompliance } from '@/hooks/useEIP712PolicySigning';
import { PolicyType } from '@/lib/eip712-policy-api';

interface EIP712PolicySignerProps {
  userId: string;
  context?: string;
  requiredPolicies?: PolicyType[];
  onSigningComplete?: (acceptanceRecords: any[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface PolicyDisplayInfo {
  type: PolicyType;
  title: string;
  description: string;
  required: boolean;
}

const POLICY_DISPLAY_INFO: Record<PolicyType, PolicyDisplayInfo> = {
  terms_conditions: {
    type: 'terms_conditions',
    title: 'Terms & Conditions',
    description: 'I agree to the Mayhouse Terms & Conditions and Host Agreement.',
    required: true
  },
  background_verification: {
    type: 'background_verification',
    title: 'Background Verification Consent',
    description: 'I consent to background verification checks as part of the host onboarding process.',
    required: true
  },
  privacy_policy: {
    type: 'privacy_policy',
    title: 'Privacy Policy',
    description: 'I agree to the Mayhouse Privacy Policy and data handling practices.',
    required: false
  },
  host_agreement: {
    type: 'host_agreement',
    title: 'Host Agreement',
    description: 'I agree to the terms of the Host Agreement and platform policies.',
    required: false
  },
  cancellation_policy: {
    type: 'cancellation_policy',
    title: 'Cancellation Policy',
    description: 'I understand and agree to the cancellation and refund policy.',
    required: false
  }
};

export const EIP712PolicySigner: React.FC<EIP712PolicySignerProps> = ({
  userId,
  context = 'host_application',
  requiredPolicies,
  onSigningComplete,
  onError,
  className = ''
}) => {
  const { address, isConnected } = useAccount();
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyType[]>([]);
  const [showPolicyDetails, setShowPolicyDetails] = useState<PolicyType | null>(null);

  const {
    isSigning,
    error,
    acceptanceRecords,
    signPolicy,
    signBulkPolicies,
    getPolicyStatus,
    getRequiredPolicies,
    clearError
  } = useEIP712PolicySigning({ userId, context });

  const {
    isCompliant,
    missingPolicies,
    requiredPolicies: contextRequiredPolicies,
    checkCompliance
  } = usePolicyCompliance(userId, context);

  // Determine which policies to show
  const policiesToShow = requiredPolicies || contextRequiredPolicies || [];

  // Initialize component
  useEffect(() => {
    if (isConnected && address) {
      checkCompliance();
    }
  }, [isConnected, address, checkCompliance]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle signing completion
  useEffect(() => {
    if (acceptanceRecords.length > 0 && onSigningComplete) {
      onSigningComplete(acceptanceRecords);
    }
  }, [acceptanceRecords, onSigningComplete]);

  // Handle policy selection
  const handlePolicyToggle = (policyType: PolicyType) => {
    setSelectedPolicies(prev => {
      if (prev.includes(policyType)) {
        return prev.filter(p => p !== policyType);
      } else {
        return [...prev, policyType];
      }
    });
  };

  // Handle signing
  const handleSignPolicies = async () => {
    if (selectedPolicies.length === 0) {
      onError?.('Please select at least one policy to sign');
      return;
    }

    try {
      clearError();
      
      if (selectedPolicies.length === 1) {
        await signPolicy(selectedPolicies[0]);
      } else {
        await signBulkPolicies(selectedPolicies);
      }
      
      // Refresh compliance status
      await checkCompliance();
    } catch (err: any) {
      console.error('Policy signing failed:', err);
      onError?.(err.message || 'Failed to sign policies');
    }
  };

  // Handle view policy details
  const handleViewPolicy = (policyType: PolicyType) => {
    setShowPolicyDetails(policyType);
  };

  if (!isConnected) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-yellow-800 font-semibold">Wallet Not Connected</h3>
            <p className="text-yellow-700 text-sm">Please connect your wallet to sign policies.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCompliant === true) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-green-600 mr-3">✅</div>
          <div>
            <h3 className="text-green-800 font-semibold">All Required Policies Signed</h3>
            <p className="text-green-700 text-sm">You have successfully signed all required policies.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Policy Agreements</h3>
        <p className="text-gray-600 text-sm">
          Please review and sign the required policy agreements using your wallet.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">❌</div>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {policiesToShow.map((policyType) => {
          const policyInfo = POLICY_DISPLAY_INFO[policyType];
          const isSelected = selectedPolicies.includes(policyType);
          const isRequired = policyInfo.required;
          const isSigned = acceptanceRecords.some(record => record.policy_type === policyType);

          return (
            <div
              key={policyType}
              className={`border rounded-lg p-4 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } ${isSigned ? 'border-green-500 bg-green-50' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={isSelected || isSigned}
                  onChange={() => !isSigned && handlePolicyToggle(policyType)}
                  disabled={isSigned}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">
                      {policyInfo.title}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    {isSigned && (
                      <span className="text-green-600 text-sm font-medium">✓ Signed</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{policyInfo.description}</p>
                  <button
                    onClick={() => handleViewPolicy(policyType)}
                    className="text-blue-600 text-sm mt-2 hover:text-blue-800"
                  >
                    View Full Policy →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {selectedPolicies.length} policy{selectedPolicies.length !== 1 ? 'ies' : ''} selected
        </div>
        <button
          onClick={handleSignPolicies}
          disabled={isSigning || selectedPolicies.length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSigning ? 'Signing...' : `Sign ${selectedPolicies.length} Policy${selectedPolicies.length !== 1 ? 'ies' : ''}`}
        </button>
      </div>

      {/* Policy Details Modal */}
      {showPolicyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {POLICY_DISPLAY_INFO[showPolicyDetails].title}
              </h3>
              <button
                onClick={() => setShowPolicyDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-gray-700">
              <p className="mb-4">
                This is where the full policy content would be displayed.
                In a real implementation, you would fetch and display the actual policy content here.
              </p>
              <p className="text-sm text-gray-500">
                Policy Type: {showPolicyDetails}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPolicyDetails(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EIP712PolicySigner;
