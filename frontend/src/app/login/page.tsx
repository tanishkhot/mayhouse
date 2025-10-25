"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { WalletAPI } from '@/lib/wallet-api';
import { setAccessToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-authenticate when wallet connects
    if (isConnected && address && !isAuthenticating) {
      handleWalletAuth();
    }
  }, [isConnected, address]);

  const handleWalletAuth = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Step 1: Request nonce from backend
      console.log('Requesting nonce for address:', address);
      const { nonce, message } = await WalletAPI.requestNonce(address);
      
      // Step 2: Sign the message with wallet
      console.log('Signing message...');
      const signature = await signMessageAsync({ message });
      
      // Step 3: Verify signature and get JWT token
      console.log('Verifying signature...');
      const authResponse = await WalletAPI.verifySignature(address, signature);
      
      // Step 4: Store token and redirect
      console.log('Authentication successful!');
      setAccessToken(authResponse.access_token);
      
      // Redirect based on role
      if (authResponse.user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Mayhouse ETH</h1>
            <p className="text-gray-600">Connect your wallet to get started</p>
          </div>

          {/* Wallet Connect Section */}
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus || authenticationStatus === 'authenticated');

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                      className="w-full"
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                              🦊 Connect Wallet
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="w-full bg-red-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                            >
                              ⚠️ Wrong network
                            </button>
                          );
                        }

                        return (
                          <div className="flex flex-col items-center space-y-3 w-full">
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 24,
                                      height: 24,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 24, height: 24 }}
                                      />
                                    )}
                                  </div>
                                )}
                                <span className="font-medium">{chain.name}</span>
                              </button>
                            </div>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors"
                            >
                              {account.displayName}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Status Messages */}
            {isAuthenticating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 font-medium">Authenticating...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800 text-sm">{error}</p>
                {isConnected && (
                  <button
                    onClick={handleWalletAuth}
                    className="mt-2 text-red-600 underline hover:text-red-800 text-sm font-medium"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span className="text-purple-600 font-bold">✓</span>
              <p>Secure authentication using your Ethereum wallet</p>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span className="text-purple-600 font-bold">✓</span>
              <p>No passwords needed - your wallet is your identity</p>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span className="text-purple-600 font-bold">✓</span>
              <p>Book experiences with crypto payments</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>
              Don&apos;t have a wallet?{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline font-medium"
              >
                Get MetaMask
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
