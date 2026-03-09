import { useState } from "react";
import { useChainId, useReadContract } from "wagmi";
import { isAddress } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

export default function GetMinter() {
  const chainId = useChainId();
  const [addr, setAddr] = useState("");

  const enabled = isAddress(addr);

  const minterRead = useReadContract({
    ...wattyContract,
    functionName: "isMinter",
    args: enabled ? [addr] : undefined,
    query: { enabled },
  });

  return (
    <div style={{ padding: 24, maxWidth: 850, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Get Minter</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Address to check</div>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="0x..."
          style={inputStyle}
        />
        {addr && !enabled && <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>}
      </label>

      {enabled && (
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          {minterRead.isLoading && <p>Loading...</p>}
          {minterRead.error && <p style={{ color: "crimson" }}>Error: {minterRead.error.message}</p>}
          {minterRead.data !== undefined && !minterRead.isLoading && !minterRead.error && (
            <p style={{ fontFamily: "monospace", margin: 0 }}>
              isMinter({addr}) = <b>{String(minterRead.data)}</b>
            </p>
          )}
        </div>
      )}
    </div>
  );
}