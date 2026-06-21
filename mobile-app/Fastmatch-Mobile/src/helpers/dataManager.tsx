//dataManager.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataManagersKeys } from './dataManagerKeys';

export const DataManager = {
  async setAccessToken(token: string) {
    console.log(token, "this is token")
    return await AsyncStorage.setItem(DataManagersKeys.access_token, token);
  },
  async getAccessToken() {
    const token = await AsyncStorage.getItem(DataManagersKeys.access_token);
    return token;
  },
  async clearDataManager() {
    await AsyncStorage.clear();
  },
  async setForgotOtpEmail(email: string) {
    return await AsyncStorage.setItem(DataManagersKeys.forgot_otp_email, email);
  },
  async getForgotOtpEmail() {
    return await AsyncStorage.getItem(DataManagersKeys.forgot_otp_email);
  },
  async clearForgotOtpEmail() {
    return await AsyncStorage.removeItem(DataManagersKeys.forgot_otp_email);
  },
  async setFcmToken(token: string) {
    return await AsyncStorage.setItem(DataManagersKeys.fcm_token, token);
  },
  async getFcmToken() {
    return await AsyncStorage.getItem(DataManagersKeys.fcm_token);
  },
};