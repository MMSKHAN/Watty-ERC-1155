import { useMemo, useState } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { decodeEventLog, keccak256, toHex } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

function normalizeMeterId(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim().toUpperCase();
}

export default function ReportEvents() {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [meterIdText, setMeterIdText] = useState(""); // optional filter
  const [fromBlock, setFromBlock] = useState("0"); // Hardhat: 0 is fine
  const [toBlock, setToBlock] = useState("latest");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const meterIdBytes32 = useMemo(() => {
    const norm = normalizeMeterId(meterIdText);
    return norm ? keccak256(toHex(norm)) : null;
  }, [meterIdText]);

  const parseBlock = (v) => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "latest") return "latest";
    try {
      const n = BigInt(s);
      return n >= 0n ? n : null;
    } catch {
      return null;
    }
  };

  const onFetch = async () => {
    setErr("");
    setLoading(true);
    setRows([]);

    try {
      const fb = parseBlock(fromBlock);
      const tb = parseBlock(toBlock);

      if (fb === null) throw new Error("fromBlock must be a number (or 0).");
      if (tb === null) throw new Error('toBlock must be a number or "latest".');

      // EnergyReported(bytes32 meterId, bytes32 intervalId, uint256 whDelta, bytes32 dataHash)
      // Topic0 = keccak256("EnergyReported(bytes32,bytes32,uint256,bytes32)")
      // Topic1 = indexed meterId ONLY IF event param is indexed.
      // In your contract event is NOT indexed, so we can't filter by meterId at RPC level.
      // We'll fetch all logs for the contract and filter in JS.

      const logs = await publicClient.getLogs({
        address: wattyContract.address,
        fromBlock: fb,
        toBlock: tb,
      });

      // decode only EnergyReported logs
      const decoded = [];
      for (const log of logs) {
        try {
          const ev = decodeEventLog({
            abi: wattyContract.abi,
            data: log.data,
            topics: log.topics,
          });

          if (ev.eventName !== "EnergyReported") continue;

          const meterId = ev.args.meterId;
          const intervalId = ev.args.intervalId;
          const whDelta = ev.args.whDelta;
          const dataHash = ev.args.dataHash;

          // optional filter by meterId (since not indexed, filter after decoding)
          if (meterIdBytes32 && meterId.toLowerCase() !== meterIdBytes32.toLowerCase()) {
            continue;
          }

          decoded.push({
            blockNumber: Number(log.blockNumber),
            txHash: log.transactionHash,
            meterId,
            intervalId,
            whDelta: whDelta?.toString?.() ?? String(whDelta),
            dataHash,
          });
        } catch {
          // ignore unrelated logs
        }
      }

      // newest first
      decoded.sort((a, b) => b.blockNumber - a.blockNumber);

      setRows(decoded);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Energy Reports Explorer</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b> <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>Meter ID filter (text, optional)</div>
          <input
            value={meterIdText}
            onChange={(e) => setMeterIdText(e.target.value)}
            style={inputStyle}
            placeholder="e.g. MTR-7788"
          />
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
            meterId(bytes32): {meterIdBytes32 || "-"}
          </div>
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>fromBlock</div>
          <input
            value={fromBlock}
            onChange={(e) => setFromBlock(e.target.value)}
            style={inputStyle}
            placeholder="0"
          />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>toBlock</div>
          <input
            value={toBlock}
            onChange={(e) => setToBlock(e.target.value)}
            style={inputStyle}
            placeholder='latest or e.g. 200'
          />
        </label>
      </div>

      <button
        onClick={onFetch}
        disabled={loading}
        style={{ marginTop: 12, padding: "10px 14px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Fetching..." : "Fetch EnergyReported logs"}
      </button>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>❌ {err}</div>}

      <div style={{ marginTop: 16 }}>
        <div style={{ opacity: 0.85, marginBottom: 10 }}>
          Found <b>{rows.length}</b> EnergyReported events
        </div>

        {rows.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r, i) => (
              <div
                key={r.txHash + i}
                style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  <b>block:</b> {r.blockNumber} &nbsp; | &nbsp;
                  <b>tx:</b>{" "}
                  <span style={{ fontFamily: "monospace" }}>{r.txHash}</span>
                </div>

                <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 13 }}>
                  <div><b>meterId:</b> {r.meterId}</div>
                  <div><b>intervalId:</b> {r.intervalId}</div>
                  <div><b>whDelta:</b> {r.whDelta}</div>
                  <div><b>dataHash:</b> {r.dataHash}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length === 0 && !loading && !err && (
          <div style={{ opacity: 0.85 }}>
            No logs yet. Try fromBlock=0 and toBlock=latest, and make sure you already submitted Report Energy.
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
        Note: your event params are not indexed, so RPC can’t filter by meterId directly.
        We fetch logs for the contract and filter in the UI after decoding.
      </div>
    </div>
  );
}