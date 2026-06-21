import {useState, useEffect, useRef} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import { ShowAlertMessage ,popTypes} from './commonFunctions';

export const UseInternetConnectivity = (): boolean => {
  const [isConnected, setIsConnected] = useState(true);
  const previousConnection = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const currentConnection = state.isConnected ?? false;

      if (previousConnection.current !== null) {
        if (!currentConnection && previousConnection.current) {
          // Went from connected → disconnected
          ShowAlertMessage("Please check your internet connection", popTypes.error)
        } else if (currentConnection && !previousConnection.current) {
          // Went from disconnected → connected
         
        }
      }

      previousConnection.current = currentConnection;
      setIsConnected(currentConnection);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};
