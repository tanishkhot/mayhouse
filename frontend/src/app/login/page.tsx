"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { WalletAPI } from '@/lib/wallet-api';
import { setAccessToken, AuthAPI } from '@/lib/api';
import { useWalletDetection } from '@/hooks/useWalletDetection';

export default function LoginPage() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const { hasWallet, isMetaMask, isDetecting } = useWalletDetection();

  // Track wallet connection state (without auto-authenticating)
  useEffect(() => {
    if (isConnected && address) {
      setWalletConnected(true);
      // Clear error when wallet connects
      setError(null);
    } else {
      setWalletConnected(false);
      // Clear error and authentication state when wallet disconnects
      setError(null);
      setIsAuthenticating(false);
    }
  }, [isConnected, address]);

  // Cleanup on unmount/navigation away
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setError(null);
      setIsAuthenticating(false);
    };
  }, []);

  // Check if current chain is supported
  const isChainSupported = useCallback(() => {
    if (!chain) return false;
    // Supported chains: sepolia (11155111), mainnet (1), polygon (137), optimism (10), arbitrum (42161), base (8453)
    const supportedChainIds = [11155111, 1, 137, 10, 42161, 8453];
    return supportedChainIds.includes(chainId);
  }, [chain, chainId]);

  const handleWalletAuth = useCallback(async () => {
    // Prevent multiple concurrent authentication attempts
    if (isAuthenticating) {
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      return;
    }

    // Validate network before proceeding
    if (!isChainSupported()) {
      setError("Please switch to a supported network (Sepolia, Mainnet, Polygon, Optimism, Arbitrum, or Base)");
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
      
      // Always redirect to homepage after login
      // Users can navigate to admin/host pages from navbar
      router.replace('/');
    } catch (err: any) {
      console.error('Authentication error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Authentication failed';
      
      // Provide more helpful error messages
      if (errorMessage.includes('Supabase credentials not configured') || 
          errorMessage.includes('Supabase URL and service key')) {
        setError('Server configuration error. Please contact support or try again later.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, isAuthenticating, isChainSupported, signMessageAsync, router]);

  const handleGoogleAuth = () => {
    // For OAuth, we need to redirect directly to the backend (bypassing the proxy)
    // because the backend returns a redirect response that the proxy can't handle
    // Use NEXT_PUBLIC_API_BASE_URL if set, otherwise default to localhost for dev
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const oauthUrl = `${backendUrl}/auth/oauth/google/login`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-terracotta-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900"><span className="font-brand">Mayhouse</span></h1>
            <p className="text-gray-600">Sign in to get started</p>
          </div>

          {/* Authentication Options */}
          <div className="space-y-4">
            {/* Google OAuth - Always Available */}
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider - Only show if wallet is available */}
            {hasWallet && !isDetecting && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
            )}

            {/* Wallet Connect Section - Only show if wallet is detected */}
            {hasWallet && !isDetecting ? (
              <div className="space-y-4">
                {!walletConnected ? (
                  // Show ConnectButton when wallet is not connected
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
                            {!connected && (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="w-full bg-terracotta-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-terracotta-600 transition-all transform hover:scale-105 shadow-lg"
                              >
                                {isMetaMask ? 'Connect MetaMask' : 'Connect Wallet'}
                              </button>
                            )}
                          </div>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                ) : (
                  // Show "Continue with MetaMask" button when wallet is connected
                  <div className="space-y-4">
                    {/* Wallet Connection Status */}
                    <div className="flex items-center justify-center space-x-2 bg-gray-100 rounded-lg px-4 py-3 mb-4">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {isMetaMask ? 'MetaMask' : 'Wallet'} Connected
                      </span>
                    </div>

                    {/* Network Validation */}
                    {chain && !isChainSupported() ? (
                      <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <p className="text-yellow-800 text-sm font-medium mb-2">
                            Unsupported Network
                          </p>
                          <p className="text-yellow-700 text-xs mb-3">
                            Please switch to Sepolia, Mainnet, Polygon, Optimism, Arbitrum, or Base
                          </p>
                          <ConnectButton.Custom>
                            {({ openChainModal }) => (
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-sm"
                              >
                                Switch Network
                              </button>
                            )}
                          </ConnectButton.Custom>
                        </div>
                      </div>
                    ) : (
                      // Show "Continue with MetaMask" button when on supported network
                      <button
                        onClick={handleWalletAuth}
                        disabled={isAuthenticating}
                        className="w-full bg-terracotta-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-terracotta-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                      >
                        {isAuthenticating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Continue with {isMetaMask ? 'MetaMask' : 'Wallet'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Chain Info (if connected and on supported network) */}
                    {chain && isChainSupported() && (
                      <div className="flex items-center justify-center">
                        <ConnectButton.Custom>
                          {({ openChainModal }) => (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {chain.iconUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 20, height: 20 }}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="text-xs">{chain.name}</span>
                            </button>
                          )}
                        </ConnectButton.Custom>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-800 text-sm">{error}</p>
                    {walletConnected && isChainSupported() && (
                      <button
                        onClick={handleWalletAuth}
                        disabled={isAuthenticating}
                        className="mt-2 text-red-600 underline hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : !isDetecting ? (
              // Show message if no wallet detected
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-800 text-sm mb-2">
                  Want to use a wallet? Install MetaMask or another Web3 wallet.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                >
                  Get MetaMask
                </a>
              </div>
            ) : null}
          </div>

          {/* Info Section */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-terracotta-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>Secure authentication with Google or your wallet</p>
            </div>
            {hasWallet && (
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-terracotta-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p>Book experiences with crypto payments using your wallet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
