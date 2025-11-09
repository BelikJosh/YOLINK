// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  // ... otros campos
}

export interface OpenPaymentWallet {
  id: string;
  address: string;
  balance?: number;
  currency: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  wallets: OpenPaymentWallet[];
  notificationsEnabled: boolean;
}