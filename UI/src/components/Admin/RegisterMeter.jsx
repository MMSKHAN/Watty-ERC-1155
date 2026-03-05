import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { keccak256, toHex, isAddress } from "viem";

// ✅ fix the import path + quotes
import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

export default function RegisterMeter() {
  const { address: connected, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const { data: hash, isPending, error, writeContractAsync } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  const [meterIdText, setMeterIdText] = useState("MTR-7788");
  const [owner, setOwner] = useState("");
  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(
      {
        meterId: "MTR-7788",
        siteId: "SITE-22",
        capacity: "10kW",
        lat: 31.5204,
        long: 74.3587,
      },
      null,
      2
    )
  );

  // default owner = connected wallet
  useEffect(() => {
    if (connected && !owner) setOwner(connected);
  }, [connected, owner]);

  const meterIdBytes32 = useMemo(() => {
    const t = meterIdText.trim();
    return t ? keccak256(toHex(t)) : null;
  }, [meterIdText]);

  const { metadataHash, jsonValid, jsonError } = useMemo(() => {
    try {
      JSON.parse(metadataJson);
      return {
        metadataHash: keccak256(toHex(metadataJson)),
        jsonValid: true,
        jsonError: "",
      };
    } catch (e) {
      return {
        metadataHash: null,
        jsonValid: false,
        jsonError: e?.message || "Invalid JSON",
      };
    }
  }, [metadataJson]);

  const busy = isPending || isConfirming;

  const errMsg =
    (error || confirmError)?.shortMessage ||
    (error || confirmError)?.message ||
    "";

  const disabled =
    !isConnected ||
    busy ||
    !meterIdBytes32 ||
    !metadataHash ||
    !jsonValid ||
    !isAddress(owner);

  const onRegister = async () => {
    if (disabled) return;

    try {
      // ✅ simulate => returns correct gas + calldata
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected, // ✅ IMPORTANT (sender for onlyAdmin)
        functionName: "registerMeter",
        args: [meterIdBytes32, owner, metadataHash],
      });

      // ✅ send exactly what simulate returned
      await writeContractAsync(request);
    } catch (e) {
      console.error("registerMeter failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 850, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Register Meter (Admin only)</h2>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Connected wallet</div>
        <div style={{ fontFamily: "monospace" }}>{connected || "Not connected"}</div>
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Meter ID (text)</div>
        <input
          value={meterIdText}
          onChange={(e) => setMeterIdText(e.target.value)}
          style={inputStyle}
          placeholder="MTR-7788"
        />
      </label>

      <div style={{ marginBottom: 14, fontSize: 12, opacity: 0.9 }}>
        <div>meterId (bytes32 = keccak256(text))</div>
        <div style={{ fontFamily: "monospace" }}>{meterIdBytes32 || "-"}</div>
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Owner address</div>
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          style={inputStyle}
          placeholder="0x..."
        />
        {!owner || isAddress(owner) ? null : (
          <div style={{ color: "crimson", marginTop: 6 }}>Invalid owner address</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Metadata (JSON)</div>
        <textarea
          value={metadataJson}
          onChange={(e) => setMetadataJson(e.target.value)}
          style={{ ...inputStyle, minHeight: 180 }}
        />
      </label>

      {!jsonValid && (
        <div style={{ color: "crimson", marginBottom: 10 }}>
          JSON error: {jsonError}
        </div>
      )}

      <div style={{ marginBottom: 14, fontSize: 12, opacity: 0.9 }}>
        <div>metadataHash (bytes32 = keccak256(JSON bytes))</div>
        <div style={{ fontFamily: "monospace" }}>{jsonValid ? metadataHash : "-"}</div>
      </div>

      <button
        onClick={onRegister}
        disabled={disabled}
        style={{
          padding: "10px 14px",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Submitting..." : "Register Meter"}
      </button>

      <div style={{ marginTop: 16 }}>
        {hash && (
          <>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Tx hash</div>
            <div style={{ fontFamily: "monospace" }}>{hash}</div>
          </>
        )}

        {isConfirmed && <div style={{ marginTop: 8, color: "green" }}>✅ Confirmed</div>}
        {errMsg && <div style={{ marginTop: 8, color: "crimson" }}>❌ {errMsg}</div>}
      </div>
    </div>
  );
}