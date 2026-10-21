import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getProducts,
  getSubscriptions,
  getAvailablePurchases,
  flushFailedPurchasesCachedAsPendingAndroid,
  requestPurchase,
  requestSubscription,
  finishTransaction as iapFinishTransaction,
  purchaseUpdatedListener as iapPurchaseUpdatedListener,
  purchaseErrorListener as iapPurchaseErrorListener,
} from 'react-native-iap';

export interface Product {
  productId: string;
  price: string;
  localizedPrice?: string;
  title: string;
  description: string;
}

export interface Subscription {
  productId: string;
  price: string;
  localizedPrice: string;
  title: string;
  description: string;
  offerToken?: string;
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
    if (Platform.OS === 'android') {
      try {
        await flushFailedPurchasesCachedAsPendingAndroid();
      } catch (fErr) {
        // Non-critical cleanup
      }
    }
    console.log('[IAP] Connected to native store');
  } catch (error) {
    console.warn('[IAP] setupIAP error (running in fallback mode):', error);
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const storeProducts = await getProducts({ skus: COIN_SKUS });
    if (storeProducts && storeProducts.length > 0) {
      return storeProducts.map((p: any) => {
        const localizedPrice =
          p.localizedPrice ||
          p.oneTimePurchaseOfferDetails?.formattedPrice ||
          (p.price ? `$${p.price}` : '$0.99');
        return {
          productId: p.productId,
          price: p.price || (localizedPrice ? localizedPrice.replace(/[^0-9.]/g, '') : '0.99'),
          localizedPrice: localizedPrice,
          title: p.title || p.name || 'Coins',
          description: p.description || 'Coins pack',
        };
      });
    }
  } catch (e) {
    console.warn('[IAP] fetchProducts error, using catalog fallback:', e);
  }

  // Fallback to catalog
  return [
    {
      productId: 'com.fastmatch.coins_100',
      price: '0.99',
      localizedPrice: '$0.99',
      title: '100 Coins',
      description: 'Pack of 100 virtual coins'
    },
    {
      productId: 'com.fastmatch.coins_500',
      price: '4.99',
      localizedPrice: '$4.99',
      title: '500 Coins',
      description: 'Pack of 500 virtual coins + 50 bonus'
    },
    {
      productId: 'com.fastmatch.coins_1000',
      price: '9.99',
      localizedPrice: '$9.99',
      title: '1000 Coins',
      description: 'Pack of 1000 virtual coins + 200 bonus'
    }
  ];
};

export const fetchSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const storeSubs = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });
    if (storeSubs && storeSubs.length > 0) {
      return storeSubs.map((s: any) => {
        const androidOffer = s.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0];
        const localizedPrice =
          s.localizedPrice ||
          androidOffer?.formattedPrice ||
          `$${s.price || '9.00'}`;
        const price =
          s.price ||
          (androidOffer?.priceAmountMicros
            ? (Number(androidOffer.priceAmountMicros) / 1000000).toFixed(2)
            : '9.00');
        const offerToken = s.subscriptionOfferDetails?.[0]?.offerToken;

        return {
          productId: s.productId,
          price: price,
          localizedPrice: localizedPrice,
          title: s.title || s.name || 'Premium',
          description: s.description || 'Premium subscription',
          offerToken: offerToken,
        };
      });
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
    if (Platform.OS === 'android') {
      return await requestPurchase({
        skus: [sku],
      });
    } else {
      return await requestPurchase({
        sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
    }
  } catch (error) {
    console.warn('[IAP] purchaseProduct error:', error);
    throw error;
  }
};

export const subscribeToProduct = async (sku: string, offerToken?: string) => {
  try {
    if (Platform.OS === 'android') {
      let token = offerToken;
      if (!token) {
        // Find active offerToken from store for this subscription
        const subs = await getSubscriptions({ skus: [sku] });
        const sub = subs?.find((item: any) => item.productId === sku) as any;
        token = sub?.subscriptionOfferDetails?.[0]?.offerToken;
      }
      if (!token) {
        throw new Error(`No active offerToken found for subscription: ${sku}. Make sure the base plan is active in Play Console.`);
      }
      return await requestSubscription({
        subscriptionOffers: [{ sku, offerToken: token }],
      });
    } else {
      return await requestSubscription({
        sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
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

export const consumePendingPurchases = async () => {
  try {
    const available = await getAvailablePurchases();
    if (available && available.length > 0) {
      console.log('[IAP] Found pending/unconsumed purchases:', available.length);
      for (const purchase of available) {
        const prodId = purchase.productId || (purchase as any).productIds?.[0];
        const isSub = prodId?.includes('premium');
        if (!isSub) {
          try {
            await finishTransaction({ purchase, isConsumable: true });
            console.log('[IAP] Consumed stuck purchase:', prodId);
          } catch (cErr) {
            console.warn('[IAP] Error consuming stuck purchase:', prodId, cErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[IAP] consumePendingPurchases error:', err);
  }
};

export const restoreActivePurchases = async () => {
  try {
    const available = await getAvailablePurchases();
    return available || [];
  } catch (e) {
    console.warn('[IAP] restoreActivePurchases error:', e);
    throw e;
  }
};
