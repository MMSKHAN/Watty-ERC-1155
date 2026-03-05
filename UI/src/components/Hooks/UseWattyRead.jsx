import { useReadContract } from "wagmi";
import { wattyContract } from "./Watty";

export function useWattyRead(functionName, args = [], options = {}) {
  return useReadContract({
    ...wattyContract,
    functionName,
    args,
    // wagmi v2 uses "query" for react-query options
    query: {
      enabled: options.enabled ?? true,
      refetchInterval: options.refetchInterval ?? false,
      ...options.query,
    },
  });
}