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

function normUpper(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().toUpperCase();
}
function normRaw(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

export default function GetFinalizeSettlement() {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [siteIdText, setSiteIdText] = useState("");   // optional filter
  const [periodText, setPeriodText] = useState("");   // optional filter
  const [fromBlock, setFromBlock] = useState("0");
  const [toBlock, setToBlock] = useState("latest");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const siteIdBytes32 = useMemo(() => {
    const v = normUpper(siteIdText);
    return v ? keccak256(toHex(v)) : null;
  }, [siteIdText]);

  const periodBytes32 = useMemo(() => {
    const v = normRaw(periodText);
    return v ? keccak256(toHex(v)) : null;
  }, [periodText]);

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

      const logs = await publicClient.getLogs({
        address: wattyContract.address,
        fromBlock: fb,
        toBlock: tb,
      });

      const decoded = [];
      for (const log of logs) {
        try {
          const ev = decodeEventLog({
            abi: wattyContract.abi,
            data: log.data,
            topics: log.topics,
          });

          if (ev.eventName !== "SettlementFinalized") continue;

          const siteId = ev.args.siteId;
          const period = ev.args.period;
          const totalWh = ev.args.totalWh;
          const totalTokens = ev.args.totalTokens;
          const proofHash = ev.args.proofHash;

          // optional filters (since event params are not indexed, filter after decoding)
          if (siteIdBytes32 && siteId.toLowerCase() !== siteIdBytes32.toLowerCase()) continue;
          if (periodBytes32 && period.toLowerCase() !== periodBytes32.toLowerCase()) continue;

          decoded.push({
            blockNumber: Number(log.blockNumber),
            txHash: log.transactionHash,
            siteId,
            period,
            totalWh: totalWh.toString(),
            totalTokens: totalTokens.toString(),
            proofHash,
          });
        } catch {
          // ignore unrelated logs
        }
      }

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
      <h2>Settlement Explorer</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b> <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>Site ID filter (text, optional)</div>
          <input value={siteIdText} onChange={(e) => setSiteIdText(e.target.value)} style={inputStyle} />
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
            siteId(bytes32): {siteIdBytes32 || "-"}
          </div>
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>Period filter (text, optional)</div>
          <input value={periodText} onChange={(e) => setPeriodText(e.target.value)} style={inputStyle} />
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
            period(bytes32): {periodBytes32 || "-"}
          </div>
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>fromBlock</div>
          <input value={fromBlock} onChange={(e) => setFromBlock(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6 }}>toBlock</div>
          <input value={toBlock} onChange={(e) => setToBlock(e.target.value)} style={inputStyle} />
        </label>
      </div>

      <button
        onClick={onFetch}
        disabled={loading}
        style={{ marginTop: 12, padding: "10px 14px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Fetching..." : "Fetch SettlementFinalized logs"}
      </button>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>❌ {err}</div>}

      <div style={{ marginTop: 16 }}>
        <div style={{ opacity: 0.85, marginBottom: 10 }}>
          Found <b>{rows.length}</b> settlements
        </div>

        {rows.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r, i) => (
              <div
                key={r.txHash + i}
                style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  <b>block:</b> {r.blockNumber} &nbsp;|&nbsp; <b>tx:</b>{" "}
                  <span style={{ fontFamily: "monospace" }}>{r.txHash}</span>
                </div>

                <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 13 }}>
                  <div><b>siteId:</b> {r.siteId}</div>
                  <div><b>period:</b> {r.period}</div>
                  <div><b>totalWh:</b> {r.totalWh}</div>
                  <div><b>totalTokens:</b> {r.totalTokens}</div>
                  <div><b>proofHash:</b> {r.proofHash}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length === 0 && !loading && !err && (
          <div style={{ opacity: 0.85 }}>
            No settlement events yet. Try fromBlock=0 and toBlock=latest, then finalize a settlement first.
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
        Note: your SettlementFinalized event params are not indexed, so filtering happens after decoding logs.
      </div>
    </div>
  );
}