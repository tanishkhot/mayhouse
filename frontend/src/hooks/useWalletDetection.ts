'use client';

import { useState, useEffect } from 'react';

export function useWalletDetection() {
  const [hasWallet, setHasWallet] = useState(false);
  const [isMetaMask, setIsMetaMask] = useState(false);
  // Initialize based on environment to avoid synchronous setState in effect
  const [isDetecting, setIsDetecting] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Batch state updates to avoid cascading renders
    // Use setTimeout to defer state updates and batch them
    const updateState = () => {
      // Check for EIP-1193 provider (most wallets inject this)
      const ethereum = (window as any).ethereum;
      
      if (ethereum) {
        setHasWallet(true);
        // Check if it's specifically MetaMask
        setIsMetaMask(ethereum.isMetaMask === true);
      } else {
        setHasWallet(false);
        setIsMetaMask(false);
      }

      setIsDetecting(false);
    };

    // Defer state updates to next tick to batch them
    const timeoutId = setTimeout(updateState, 0);

    // Listen for wallet installation
    const handleEthereum = () => {
      const newEthereum = (window as any).ethereum;
      if (newEthereum) {
        setHasWallet(true);
        setIsMetaMask(newEthereum.isMetaMask === true);
      }
    };

    window.addEventListener('ethereum#initialized', handleEthereum);
    
    // Also check periodically (in case wallet is installed after page load)
    const interval = setInterval(() => {
      const currentEthereum = (window as any).ethereum;
      if (currentEthereum && !hasWallet) {
        setHasWallet(true);
        setIsMetaMask(currentEthereum.isMetaMask === true);
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('ethereum#initialized', handleEthereum);
      clearInterval(interval);
    };
  }, [hasWallet]);

  return { hasWallet, isMetaMask, isDetecting };
}

