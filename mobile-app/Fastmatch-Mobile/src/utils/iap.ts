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
  return [
    {
      productId: 'com.fastmatch.coins_100',
      price: '0.99',
      title: '100 Coins',
      description: 'Pack of 100 virtual coins'
    },
    {
      productId: 'com.fastmatch.coins_500',
      price: '4.99',
      title: '500 Coins',
      description: 'Pack of 500 virtual coins + 50 bonus'
    },
    {
      productId: 'com.fastmatch.coins_1000',
      price: '9.99',
      title: '1000 Coins',
      description: 'Pack of 1000 virtual coins + 200 bonus'
    }
  ];
};

export const fetchSubscriptions = async (): Promise<Subscription[]> => {
  return [
    {
      productId: 'com.fastmatch.premium.monthly',
      price: '9',
      localizedPrice: '$9.00',
      title: 'Premium Monthly',
      description: 'Monthly premium subscription'
    },
    {
      productId: 'com.fastmatch.premium.yearly',
      price: '90',
      localizedPrice: '$90.00',
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
