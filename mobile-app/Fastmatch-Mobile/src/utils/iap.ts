import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts as fetchIAPProducts,
  requestPurchase as requestIAPPurchase,
  finishTransaction as iapFinishTransaction,
  purchaseUpdatedListener as iapPurchaseUpdatedListener,
  purchaseErrorListener as iapPurchaseErrorListener,
} from 'react-native-iap';

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

export const SUBSCRIPTION_SKUS = [
  'com.fastmatch.premium.monthly',
  'com.fastmatch.premium.yearly',
];

export const COIN_SKUS = [
  'com.fastmatch.coins_100',
  'com.fastmatch.coins_500',
  'com.fastmatch.coins_1000',
];

export const setupIAP = async () => {
  try {
    await initConnection();
    console.log('[IAP] Connected to native store');
  } catch (error) {
    console.warn('[IAP] setupIAP error (running in fallback mode):', error);
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const storeProducts: any = await fetchIAPProducts({
      skus: COIN_SKUS,
      type: 'in-app',
    });
    if (storeProducts && storeProducts.length > 0) {
      return storeProducts.map((p: any) => ({
        productId: p.productId || p.id,
        price: p.price || (p.displayPrice ? p.displayPrice.replace(/[^0-9.]/g, '') : '0.99'),
        title: p.title || p.displayName || 'Coins',
        description: p.description || 'Coins pack',
      }));
    }
  } catch (e) {
    console.warn('[IAP] fetchProducts error, using catalog fallback:', e);
  }

  // Fallback to catalog
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
  try {
    const storeSubs: any = await fetchIAPProducts({
      skus: SUBSCRIPTION_SKUS,
      type: 'subs',
    });
    if (storeSubs && storeSubs.length > 0) {
      return storeSubs.map((s: any) => ({
        productId: s.productId || s.id,
        price: s.price || (s.displayPrice ? s.displayPrice.replace(/[^0-9.]/g, '') : '9.00'),
        localizedPrice: s.displayPrice || `$${s.price || 9}`,
        title: s.title || s.displayName || 'Premium',
        description: s.description || 'Premium subscription',
      }));
    }
  } catch (e) {
    console.warn('[IAP] fetchSubscriptions error, using catalog fallback:', e);
  }

  // Fallback to catalog
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
  try {
    if (Platform.OS === 'ios') {
      return await requestIAPPurchase({
        type: 'in-app',
        request: { apple: { sku } },
      });
    } else {
      return await requestIAPPurchase({
        type: 'in-app',
        request: { google: { skus: [sku] } },
      });
    }
  } catch (error) {
    console.warn('[IAP] purchaseProduct error:', error);
    throw error;
  }
};

export const subscribeToProduct = async (sku: string) => {
  try {
    if (Platform.OS === 'ios') {
      return await requestIAPPurchase({
        type: 'subs',
        request: { apple: { sku } },
      });
    } else {
      return await requestIAPPurchase({
        type: 'subs',
        request: { google: { skus: [sku] } },
      });
    }
  } catch (error) {
    console.warn('[IAP] subscribeToProduct error:', error);
    throw error;
  }
};

export const closeIAPConnection = async () => {
  try {
    await endConnection();
  } catch (e) {
    console.warn('[IAP] closeIAPConnection error:', e);
  }
};

export const purchaseErrorListener = (cb: (error: any) => void) => {
  try {
    return iapPurchaseErrorListener(cb);
  } catch (e) {
    return { remove: () => {} };
  }
};

export const purchaseUpdatedListener = (cb: (purchase: any) => void) => {
  try {
    return iapPurchaseUpdatedListener(cb);
  } catch (e) {
    return { remove: () => {} };
  }
};

export const finishTransaction = async (opts: { purchase: any; isConsumable?: boolean }) => {
  try {
    await iapFinishTransaction(opts);
  } catch (e) {
    console.warn('[IAP] finishTransaction error:', e);
  }
};
