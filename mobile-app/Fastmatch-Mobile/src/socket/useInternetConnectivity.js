import { useEffect, useState } from "react";

import NetInfo from "@react-native-community/netinfo";

const UseInternetConnectivity = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Initialize the network state when the component is mounted
    const checkInitialConnection = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected);
      } catch (error) {
        console.error("Error checking initial network state:", error);
        setIsConnected(false);
      }
    };

    // Listen for network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    // Check the initial connection status
    checkInitialConnection();

    // Cleanup the event listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
};

export default UseInternetConnectivity;
