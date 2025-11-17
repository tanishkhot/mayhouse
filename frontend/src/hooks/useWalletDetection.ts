'use client';

import { useState, useEffect } from 'react';

export function useWalletDetection() {
  const [hasWallet, setHasWallet] = useState(false);
  const [isMetaMask, setIsMetaMask] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      setIsDetecting(false);
      return;
    }

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
      window.removeEventListener('ethereum#initialized', handleEthereum);
      clearInterval(interval);
    };
  }, [hasWallet]);

  return { hasWallet, isMetaMask, isDetecting };
}

