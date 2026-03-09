import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { isAddress } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

export default function GetCredits() {
  const chainId = useChainId();
  const { address: connected } = useAccount();

  const [userAddr, setUserAddr] = useState("");
  const [tokenId, setTokenId] = useState("1");

  useEffect(() => {
    if (connected && !userAddr) setUserAddr(connected);
  }, [connected, userAddr]);

  const tokenIdBigInt = useMemo(() => {
    try {
      const n = BigInt(tokenId);
      return n >= 0n ? n : null;
    } catch {
      return null;
    }
  }, [tokenId]);

  const enabled = isAddress(userAddr) && tokenIdBigInt !== null;

  const balRead = useReadContract({
    ...wattyContract,
    functionName: "balanceOf",
    args: enabled ? [userAddr, tokenIdBigInt] : undefined,
    query: { enabled },
  });

  return (
    <div style={{ padding: 24, maxWidth: 850, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Credits Balance (ERC1155)</h2>

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
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>User address</div>
        <input
          value={userAddr}
          onChange={(e) => setUserAddr(e.target.value)}
          placeholder="0x..."
          style={inputStyle}
        />
        {userAddr && !isAddress(userAddr) && (
          <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Token ID</div>
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="1"
          style={inputStyle}
        />
        {tokenIdBigInt === null && (
          <div style={{ color: "crimson", marginTop: 6 }}>Token ID must be an integer ≥ 0</div>
        )}
      </label>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
        {balRead.isLoading && <p>Loading...</p>}
        {balRead.error && <p style={{ color: "crimson" }}>Error: {balRead.error.message}</p>}
        {!balRead.isLoading && !balRead.error && enabled && (
          <div style={{ fontFamily: "monospace" }}>
            balanceOf({userAddr}, {String(tokenIdBigInt)}) ={" "}
            <b>{balRead.data ? balRead.data.toString() : "0"}</b>
          </div>
        )}
        {!enabled && <p style={{ opacity: 0.8 }}>Enter a valid address and tokenId.</p>}
      </div>
    </div>
  );
}