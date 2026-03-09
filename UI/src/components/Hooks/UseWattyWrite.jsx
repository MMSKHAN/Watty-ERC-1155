import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { wattyContract } from "./Watty";

export function useWattyWrite() {
  const {
    data: hash,
    isPending,
    error,
    writeContract,
    writeContractAsync,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  return {
    wattyContract,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    confirmError,
    writeContract,
    writeContractAsync,
  };
}