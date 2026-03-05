import { useMemo, useState } from "react";
import { useBlockNumber, useChainId, usePublicClient, useReadContract } from "wagmi";
import { decodeEventLog, isAddress, keccak256, toHex } from "viem";

// ✅ adjust if needed (single source of truth)
import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

function normalizeMeterId(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export default function GetMeters() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const [meterIdText, setMeterIdText] = useState("MTR-7788");

  // Optional: paste the tx hash from your register page to debug where it went
  const [txHashToCheck, setTxHashToCheck] = useState("");

  const [debugOut, setDebugOut] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const normalized = useMemo(() => normalizeMeterId(meterIdText), [meterIdText]);

  const meterIdBytes32 = useMemo(() => {
    return normalized ? keccak256(toHex(normalized)) : null;
  }, [normalized]);

  // Normal wagmi read
const meterRead = useReadContract({
  ...wattyContract,
  functionName: "meters",
  args: meterIdBytes32 ? [meterIdBytes32] : undefined,
  query: { enabled: Boolean(meterIdBytes32) },
});

const owner = meterRead.data?.[0];
const metadataHash = meterRead.data?.[1];

const isRegistered =
  owner &&
  isAddress(owner) &&
  owner !== "0x0000000000000000000000000000000000000000";

  // ✅ Full debug: receipt.to + event decode + direct read
  const runDebug = async () => {
    setDebugLoading(true);
    setDebugOut(null);

    try {
      const out = {
        uiChainId: chainId,
        uiContract: wattyContract.address,
        block: blockNumber ? String(blockNumber) : null,
        meterIdText,
        normalized,
        meterIdBytes32,
        wagmiRead: meterRead.data ?? null,
        receiptTo: null,
        receiptStatus: null,
        meterRegisteredEvent: null,
        directRead: null,
      };

      // 1) If tx hash provided, fetch receipt and decode MeterRegistered
      const h = txHashToCheck.trim();
      if (h) {
        const receipt = await publicClient.getTransactionReceipt({ hash: h });
        out.receiptTo = receipt.to;
        out.receiptStatus = receipt.status;

        // find MeterRegistered event (if any)
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: wattyContract.abi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "MeterRegistered") {
              out.meterRegisteredEvent = decoded.args;
              break;
            }
          } catch (_) {
            // ignore non-matching logs
          }
        }
      }

      // 2) Direct contract read (bypasses wagmi cache)
      if (meterIdBytes32) {
        const direct = await publicClient.readContract({
          ...wattyContract,
          functionName: "meters",
          args: [meterIdBytes32],
        });
        out.directRead = direct;
      }

      setDebugOut(out);
    } catch (e) {
      setDebugOut({ error: e?.message || String(e) });
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Meter Explorer</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span> (Hardhat = 31337)
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>block:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{blockNumber ? String(blockNumber) : "-"}</span>
        </div>
      </div>

      <label style={{ display: "block", marginTop: 12 }}>
        <div style={{ marginBottom: 6 }}>Meter ID</div>
        <input
          value={meterIdText}
          onChange={(e) => setMeterIdText(e.target.value)}
          placeholder="e.g. MTR-7788"
          style={inputStyle}
        />
      </label>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
        <div>normalized meterId (used for hashing)</div>
        <div style={{ fontFamily: "monospace" }}>{normalized || "-"}</div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
        <div>meterId (bytes32 = keccak256(normalized text))</div>
        <div style={{ fontFamily: "monospace" }}>{meterIdBytes32 || "-"}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        {meterRead.isLoading && <p>Loading...</p>}
        {meterRead.error && <p style={{ color: "crimson" }}>Error: {meterRead.error.message}</p>}

        {!meterRead.isLoading && !meterRead.error && meterIdBytes32 && (
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
            {isRegistered ? (
              <>
                <div style={{ color: "green" }}><b>✅ Registered</b></div>
                <div style={{ marginTop: 10, fontFamily: "monospace" }}>
                  <div><b>Owner:</b> {owner}</div>
                  <div><b>metadataHash:</b> {metadataHash}</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ color: "crimson" }}><b>❌ Not registered</b></div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Mapping returned zero owner for this meterId on this contract address.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <hr style={{ margin: "22px 0" }} />

      {/* <h3>Debug (optional)</h3>
      <p style={{ opacity: 0.8 }}>
        Paste the <b>Register Meter</b> tx hash here. This will prove which contract the tx called (receipt.to),
        decode <b>MeterRegistered</b> event, and do a direct read.
      </p>

      <label style={{ display: "block", marginTop: 12 }}>
        <div style={{ marginBottom: 6 }}>Register tx hash (paste)</div>
        <input
          value={txHashToCheck}
          onChange={(e) => setTxHashToCheck(e.target.value)}
          placeholder="0x..."
          style={inputStyle}
        />
      </label>

      <button
        onClick={runDebug}
        style={{ marginTop: 12, padding: "10px 14px", cursor: "pointer" }}
        disabled={debugLoading}
      >
        {debugLoading ? "Running..." : "Run Debug"}
      </button>

      {debugOut && (
        <pre style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          {JSON.stringify(debugOut, null, 2)}
        </pre>
      )} */}
    </div>
  );
}