import * as Network from "expo-network";

export function useNetworkStatus(): { isOffline: boolean } {
  const state = Network.useNetworkState();

  const isOffline =
    state.isConnected === false || state.isInternetReachable === false;

  return { isOffline };
}
