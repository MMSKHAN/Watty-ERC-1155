import { useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { isAddress } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

export default function AddMinter() {
  const { address: connected, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();

  const adminRead = useReadContract({
    ...wattyContract,
    functionName: "admin",
  });

  const isAdmin =
    adminRead.data &&
    connected &&
    adminRead.data.toLowerCase() === connected.toLowerCase();

  const [minterAddr, setMinterAddr] = useState("");
  const [value, setValue] = useState(true);

  // optional: auto-fill with connected address
useEffect(() => {
  if (connected) {
    setMinterAddr(connected);
  }
}, [connected]);

  const { data: hash, isPending, error, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } =
    useWaitForTransactionReceipt({ hash });

  const busy = isPending || isConfirming;

  const errMsg =
    (error || confirmError)?.shortMessage || (error || confirmError)?.message || "";

  const disabled =
    !isConnected ||
    busy ||
    !isAddress(minterAddr) ||
    !isAdmin;

  const onSetMinter = async () => {
    if (disabled) return;

    try {
      // ✅ simulate => correct gas + calldata
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected,
        functionName: "setMinter",
        args: [minterAddr, value],
      });

      await writeContractAsync(request);
    } catch (e) {
      console.error("setMinter failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 850, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Set Minter (Admin only)</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>connected:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{connected || "Not connected"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>admin:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {adminRead.isLoading ? "Loading..." : adminRead.data || "-"}
          </span>
        </div>

        {adminRead.data && connected && !isAdmin && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            ❌ Only admin can call setMinter. Switch wallet to:{" "}
            <span style={{ fontFamily: "monospace" }}>{adminRead.data}</span>
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Account to set as minter</div>
        <input
          value={minterAddr}
          onChange={(e) => setMinterAddr(e.target.value)}
          placeholder="0x..."
          style={inputStyle}
        />
        {minterAddr && !isAddress(minterAddr) && (
          <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Value</div>
        <select
          value={value ? "true" : "false"}
          onChange={(e) => setValue(e.target.value === "true")}
          style={inputStyle}
        >
          <option value="true">true (enable minter)</option>
          <option value="false">false (disable minter)</option>
        </select>
      </label>

      <button
        onClick={onSetMinter}
        disabled={disabled}
        style={{ padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {busy ? "Submitting..." : "Set Minter"}
      </button>

      {hash && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Tx hash</div>
          <div style={{ fontFamily: "monospace" }}>{hash}</div>
        </div>
      )}

      {isConfirmed && <div style={{ marginTop: 10, color: "green" }}>✅ Confirmed</div>}
      {errMsg && <div style={{ marginTop: 10, color: "crimson" }}>❌ {errMsg}</div>}
    </div>
  );
}