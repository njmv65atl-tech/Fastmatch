import { Platform } from 'react-native';

export interface Product {
  productId: string;
  price: string;
  title: string;
  description: string;
}

export interface Subscription {
  productId: string;
  price: string;
  localizedPrice: string;
  title: string;
  description: string;
}

export const setupIAP = async () => {
  console.log('Mock IAP setup');
};

export const fetchProducts = async (): Promise<Product[]> => {
  return [];
};

export const fetchSubscriptions = async (): Promise<Subscription[]> => {
  return [
    {
      productId: 'com.fastmatch.premium_monthly',
      price: '9',
      localizedPrice: '$9.00',
      title: 'Premium Monthly',
      description: 'Monthly premium subscription'
    },
    {
      productId: 'com.fastmatch.premium_yearly',
      price: '49',
      localizedPrice: '$49.00',
      title: 'Premium Yearly',
      description: 'Yearly premium subscription'
    }
  ];
};

export const purchaseProduct = async (sku: string) => {
  console.log('Mock purchase for', sku);
};

export const subscribeToProduct = async (sku: string) => {
  console.log('Mock subscribe for', sku);
};

export const closeIAPConnection = async () => {
  console.log('Mock close IAP connection');
};

export const purchaseErrorListener = (cb: (error: any) => void) => ({ remove: () => {} });
export const purchaseUpdatedListener = (cb: (purchase: any) => void) => ({ remove: () => {} });
export const finishTransaction = async (opts?: any) => {};
