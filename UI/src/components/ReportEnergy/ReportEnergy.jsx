import { useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { keccak256, toHex, isAddress } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

function normalizeUpper(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim().toUpperCase();
}

function normalizeRaw(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

export default function ReportEnergy() {
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

  const [meterIdText, setMeterIdText] = useState("MTR-7788");
  const [intervalText, setIntervalText] = useState("2026-03-03T12:00Z"); // any unique string
  const [whDelta, setWhDelta] = useState("2500");
  const [dataText, setDataText] = useState(
    JSON.stringify(
      {
        meterId: "MTR-7788",
        interval: "2026-03-03T12:00Z",
        whDelta: 2500,
        source: "oracle-v1",
      },
      null,
      2
    )
  );

  const meterIdBytes32 = useMemo(() => {
    const norm = normalizeUpper(meterIdText);
    return norm ? keccak256(toHex(norm)) : null;
  }, [meterIdText]);

  const intervalIdBytes32 = useMemo(() => {
    const norm = normalizeRaw(intervalText);
    return norm ? keccak256(toHex(norm)) : null;
  }, [intervalText]);

  const { dataHashBytes32, jsonValid, jsonError } = useMemo(() => {
    try {
      JSON.parse(dataText); // validate JSON
      const norm = normalizeRaw(dataText);
      return { dataHashBytes32: keccak256(toHex(norm)), jsonValid: true, jsonError: "" };
    } catch (e) {
      return { dataHashBytes32: null, jsonValid: false, jsonError: e?.message || "Invalid JSON" };
    }
  }, [dataText]);

  const whDeltaBigInt = useMemo(() => {
    try {
      const n = BigInt(whDelta);
      return n > 0n ? n : null;
    } catch {
      return null;
    }
  }, [whDelta]);

  // ✅ check meter registered (optional but very helpful)
  const meterRead = useReadContract({
    ...wattyContract,
    functionName: "meters",
    args: meterIdBytes32 ? [meterIdBytes32] : undefined,
    query: { enabled: Boolean(meterIdBytes32) },
  });

  const meterOwner = meterRead.data?.[0];
  const meterRegistered =
    meterOwner &&
    isAddress(meterOwner) &&
    meterOwner !== "0x0000000000000000000000000000000000000000";

  const busy = isPending || isConfirming;

  const errMsg =
    (error || confirmError)?.shortMessage || (error || confirmError)?.message || "";

  const disabled =
    !isConnected ||
    busy ||
    !isMinter ||
    !meterIdBytes32 ||
    !intervalIdBytes32 ||
    !dataHashBytes32 ||
    !jsonValid ||
    whDeltaBigInt === null ||
    !meterRegistered;

  const onReport = async () => {
    if (disabled) return;

    try {
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected, // ✅ must be minter
        functionName: "reportEnergy",
        args: [meterIdBytes32, intervalIdBytes32, whDeltaBigInt, dataHashBytes32],
      });

      await writeContractAsync(request);
    } catch (e) {
      console.error("reportEnergy failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 950, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Report Energy (Minter only)</h2>

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
          <b>isMinter(connected):</b>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {minterRead.isLoading ? "Loading..." : String(isMinter)}
          </span>
        </div>

        {!minterRead.isLoading && connected && !isMinter && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            ❌ Not a minter. Use SetMinter(admin) page to enable this wallet.
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Meter ID (text)</div>
        <input
          value={meterIdText}
          onChange={(e) => setMeterIdText(e.target.value)}
          style={inputStyle}
          placeholder="MTR-7788"
        />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          meterId(bytes32): {meterIdBytes32 || "-"}
        </div>
      </label>

      <div style={{ marginBottom: 12, fontSize: 13 }}>
        <b>Meter registered?</b>{" "}
        {meterRead.isLoading ? "Loading..." : meterRegistered ? "✅ Yes" : "❌ No"}
        {meterRegistered && (
          <div style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.9, marginTop: 6 }}>
            owner: {meterOwner}
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Interval ID (text, will be hashed)</div>
        <input
          value={intervalText}
          onChange={(e) => setIntervalText(e.target.value)}
          style={inputStyle}
          placeholder="2026-03-03T12:00Z"
        />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          intervalId(bytes32): {intervalIdBytes32 || "-"}
        </div>
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>whDelta (uint256)</div>
        <input
          value={whDelta}
          onChange={(e) => setWhDelta(e.target.value)}
          style={inputStyle}
          placeholder="2500"
        />
        {whDeltaBigInt === null && (
          <div style={{ color: "crimson", marginTop: 6 }}>whDelta must be integer &gt; 0</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Data (JSON) → dataHash(bytes32)</div>
        <textarea
          value={dataText}
          onChange={(e) => setDataText(e.target.value)}
          style={{ ...inputStyle, minHeight: 160 }}
        />
        {!jsonValid && <div style={{ color: "crimson", marginTop: 6 }}>JSON error: {jsonError}</div>}
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          dataHash(bytes32): {jsonValid ? dataHashBytes32 : "-"}
        </div>
      </label>

      <button
        onClick={onReport}
        disabled={disabled}
        style={{ padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {busy ? "Submitting..." : "Report Energy"}
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
        Contract rules: only minter can report; meter must be registered; intervalId + dataHash must be non-zero; whDelta &gt; 0.
      </div>
      <hr />
     
    </div>
  );
}