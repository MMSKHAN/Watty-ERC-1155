import { useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { keccak256, toHex } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

function normUpper(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().toUpperCase();
}
function normRaw(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

export default function SetFinalizeSettlement() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: connected, isConnected } = useAccount();

  // isMinter(connected)
  const minterRead = useReadContract({
    ...wattyContract,
    functionName: "isMinter",
    args: connected ? [connected] : undefined,
    query: { enabled: Boolean(connected) },
  });
  const isMinter = Boolean(minterRead.data);

  const { data: hash, isPending, error, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } =
    useWaitForTransactionReceipt({ hash });

  const [siteIdText, setSiteIdText] = useState("SITE-22");
  const [periodText, setPeriodText] = useState("2026-03"); // monthly example
  const [totalWh, setTotalWh] = useState("2500");
  const [totalTokens, setTotalTokens] = useState("50");
  const [proofJson, setProofJson] = useState(
    JSON.stringify(
      {
        siteId: "SITE-22",
        period: "2026-03",
        totals: { wh: 2500, tokens: 50 },
        proof: "merkle-root-or-hash-here",
      },
      null,
      2
    )
  );

  const siteIdBytes32 = useMemo(() => {
    const v = normUpper(siteIdText);
    return v ? keccak256(toHex(v)) : null;
  }, [siteIdText]);

  const periodBytes32 = useMemo(() => {
    const v = normRaw(periodText);
    return v ? keccak256(toHex(v)) : null;
  }, [periodText]);

  const { proofHashBytes32, jsonValid, jsonError } = useMemo(() => {
    try {
      JSON.parse(proofJson);
      // hash the JSON bytes (same style as your metadataHash)
      const v = normRaw(proofJson);
      return { proofHashBytes32: keccak256(toHex(v)), jsonValid: true, jsonError: "" };
    } catch (e) {
      return { proofHashBytes32: null, jsonValid: false, jsonError: e?.message || "Invalid JSON" };
    }
  }, [proofJson]);

  const totalWhBigInt = useMemo(() => {
    try {
      const n = BigInt(totalWh);
      return n > 0n ? n : null;
    } catch {
      return null;
    }
  }, [totalWh]);

  const totalTokensBigInt = useMemo(() => {
    try {
      const n = BigInt(totalTokens);
      return n > 0n ? n : null;
    } catch {
      return null;
    }
  }, [totalTokens]);

  const busy = isPending || isConfirming;
  const errMsg =
    (error || confirmError)?.shortMessage || (error || confirmError)?.message || "";

  const disabled =
    !isConnected ||
    busy ||
    !isMinter ||
    !siteIdBytes32 ||
    !periodBytes32 ||
    !proofHashBytes32 ||
    !jsonValid ||
    totalWhBigInt === null ||
    totalTokensBigInt === null;

  const onFinalize = async () => {
    if (disabled) return;

    try {
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected,
        functionName: "finalizeSettlement",
        args: [siteIdBytes32, periodBytes32, totalWhBigInt, totalTokensBigInt, proofHashBytes32],
      });

      await writeContractAsync(request);
    } catch (e) {
      console.error("finalizeSettlement failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 950, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Finalize Settlement (Minter only)</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b> <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>connected:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{connected || "Not connected"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>isMinter(connected):</b>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {minterRead.isLoading ? "Loading..." : String(isMinter)}
          </span>
        </div>
        {!minterRead.isLoading && connected && !isMinter && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            ❌ Not a minter. Enable this wallet using SetMinter(admin).
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Site ID (text → bytes32)</div>
        <input value={siteIdText} onChange={(e) => setSiteIdText(e.target.value)} style={inputStyle} />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          siteId(bytes32): {siteIdBytes32 || "-"}
        </div>
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Period (text → bytes32)</div>
        <input value={periodText} onChange={(e) => setPeriodText(e.target.value)} style={inputStyle} />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          period(bytes32): {periodBytes32 || "-"}
        </div>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>totalWh (uint256)</div>
          <input value={totalWh} onChange={(e) => setTotalWh(e.target.value)} style={inputStyle} />
          {totalWhBigInt === null && <div style={{ color: "crimson", marginTop: 6 }}>Must be &gt; 0</div>}
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>totalTokens (uint256)</div>
          <input value={totalTokens} onChange={(e) => setTotalTokens(e.target.value)} style={inputStyle} />
          {totalTokensBigInt === null && <div style={{ color: "crimson", marginTop: 6 }}>Must be &gt; 0</div>}
        </label>
      </div>

      <label style={{ display: "block", marginTop: 12, marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Proof (JSON) → proofHash(bytes32)</div>
        <textarea
          value={proofJson}
          onChange={(e) => setProofJson(e.target.value)}
          style={{ ...inputStyle, minHeight: 160 }}
        />
        {!jsonValid && <div style={{ color: "crimson", marginTop: 6 }}>JSON error: {jsonError}</div>}
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          proofHash(bytes32): {jsonValid ? proofHashBytes32 : "-"}
        </div>
      </label>

      <button
        onClick={onFinalize}
        disabled={disabled}
        style={{ padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {busy ? "Submitting..." : "Finalize Settlement"}
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

      <div style={{ marginTop: 14, fontSize: 13, opacity: 0.85 }}>
        Note: finalizeSettlement only emits an event. To view settlements later, use the Settlement Explorer page.
      </div>
    </div>
  );
}