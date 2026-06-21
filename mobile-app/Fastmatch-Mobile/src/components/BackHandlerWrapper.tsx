import { useEffect } from "react";
import { BackHandler } from "react-native";

export const useBackHandler = (handler: () => void) => {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handler();
        return true; // prevent default exit behavior
      },
    );

    return () => subscription.remove();
  }, [handler]);
};
