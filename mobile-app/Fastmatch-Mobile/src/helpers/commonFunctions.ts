import { loadingOff, loadingOn, resetGlobalStore } from "../redux/slices/globalSlice";
import { resetPersistStore } from "../redux/slices/persistedSlice";
import { DataManager } from "./dataManager";
import { Platform } from "react-native";
import { IMG_URL } from "../redux/services";
import {showMessage} from 'react-native-flash-message';

let dispatch = <any>null;

export const setDispatch = (data: any) => {
  dispatch = data;
};

export const setLoaderOn = () => dispatch(loadingOn());

export const setLoaderOff = () => dispatch(loadingOff());

export const onLogout = () => {
  dispatch(resetPersistStore());
  dispatch(resetGlobalStore());
  DataManager.clearDataManager();
};

export const isIOS = Platform.OS === 'ios';

export const getImageUrl = (url: any) => {
  return {
    uri: IMG_URL + url,
  };
};

function ShowAlertMessage(message: string, type: any, duration = 3000) {
  const colour = type === 'red' || type === 'error' ? 'red' : 'green';
  showMessage({
    message: message,
    type: type,
    backgroundColor: colour,
    duration: duration,
  });
}

const popTypes = {
  error: 'error',
  info: 'info',
  success: 'success',
};

export {ShowAlertMessage, popTypes};

