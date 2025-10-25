import { api } from './api';

export type WalletAuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    wallet_address: string;
    full_name?: string;
    email?: string;
    role: string;
    created_at: string;
  };
};

export type NonceResponse = {
  nonce: string;
  message: string;
};

export const WalletAPI = {
  // Request a nonce for wallet authentication
  requestNonce: (walletAddress: string) =>
    api.post<NonceResponse>('/auth/wallet/nonce', { wallet_address: walletAddress }).then((r) => r.data),
  
  // Verify the signed message and authenticate
  verifySignature: (walletAddress: string, signature: string) =>
    api.post<WalletAuthResponse>('/auth/wallet/verify', {
      wallet_address: walletAddress,
      signature: signature,
    }).then((r) => r.data),
};

