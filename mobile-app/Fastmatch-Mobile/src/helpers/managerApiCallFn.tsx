





import {
  onLogout,
  popTypes, 
  setLoaderOff,
  setLoaderOn,
  ShowAlertMessage,
} from "./commonFunctions";
import NetInfo from "@react-native-community/netinfo";
import { ValidationConstants } from "../utils/validationConstants";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const managerApiCall = async (
  initialCall: any,
  payload: any,
  onSuccess: any,
  onFail = (err: any) => {},
  type = "default",
  retries: number = 2
) => {
  console.log("🚀 API CALL START");
  console.log("📦 Payload:", payload);
  console.log("🔧 Type:", type);

  const { isConnected } = await NetInfo.fetch();

  if (!isConnected) {
    console.log("🚫 NO INTERNET CONNECTION");
    ShowAlertMessage(ValidationConstants.checkInternetConnection, popTypes.error);
    return;
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      setLoaderOn();
      console.log(`📡 API attempt ${attempt + 1}/${retries + 1}...`);

      const response = await initialCall(payload || "").unwrap();

      console.log("📥 Response:", response);

      if (response?.success) {
        onSuccess(response);
        return;
      } else {
        ShowAlertMessage(response?.message || "Something went wrong!", popTypes.error);
        return;
      }
    } catch (err: any) {
      lastError = err;
      console.log(`💥 Attempt ${attempt + 1} failed:`, err);

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        setLoaderOff();
        await sleep(delay);
      }
    } finally {
      if (attempt === retries || !lastError) {
        setLoaderOff();
      }
    }
  }

  console.log("💥 ALL RETRIES EXHAUSTED");
  onFail(lastError);
  const message = lastError?.data?.message || lastError?.error || lastError?.message || "Something went wrong";
  ShowAlertMessage(message, popTypes.error);
};