import { useReadContract } from "wagmi";
import { wattyContract } from "./Watty";

export function useWattyRead(functionName, args = [], options = {}) {
  return useReadContract({
    ...wattyContract,
    functionName,
    args,
    query: {
      enabled: options.enabled ?? true,
      refetchInterval: options.refetchInterval ?? false,
      ...options.query,
    },
  });
}