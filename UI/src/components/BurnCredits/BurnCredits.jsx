import { useEffect, useMemo, useState } from "react";
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

function normalizeRef(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

export default function BurnCredits() {
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

  const [from, setFrom] = useState("");
  const [tokenId, setTokenId] = useState("1");
  const [amount, setAmount] = useState("1");
  const [refText, setRefText] = useState("BURN-REF-001");

  // default from = connected wallet
  useEffect(() => {
    if (connected && !from) setFrom(connected);
  }, [connected, from]);

  const tokenIdBigInt = useMemo(() => {
    try {
      const n = BigInt(tokenId);
      return n >= 0n ? n : null;
    } catch {
      return null;
    }
  }, [tokenId]);

  const amountBigInt = useMemo(() => {
    try {
      const n = BigInt(amount);
      return n > 0n ? n : null;
    } catch {
      return null;
    }
  }, [amount]);

  const refBytes32 = useMemo(() => {
    const r = normalizeRef(refText);
    return r ? keccak256(toHex(r)) : null;
  }, [refText]);

  // permission: sender must be "from" OR a minter
  const allowed =
    connected &&
    isAddress(from) &&
    (connected.toLowerCase() === from.toLowerCase() || isMinter);

  const busy = isPending || isConfirming;

  const errMsg =
    (error || confirmError)?.shortMessage || (error || confirmError)?.message || "";

  const disabled =
    !isConnected ||
    busy ||
    !isAddress(from) ||
    tokenIdBigInt === null ||
    amountBigInt === null ||
    !refBytes32 ||
    !allowed;

  const onBurn = async () => {
    if (disabled) return;

    try {
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected, // sender
        functionName: "burnCredits",
        args: [from, tokenIdBigInt, amountBigInt, refBytes32],
      });

      await writeContractAsync(request);
    } catch (e) {
      console.error("burnCredits failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Burn Credits</h2>

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

        {connected && isAddress(from) && !allowed && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            ❌ NotAllowed(): You can burn only if <b>connected == from</b> OR you are a <b>minter</b>.
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>From address (tokens will be burned from this wallet)</div>
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="0x..."
          style={inputStyle}
        />
        {from && !isAddress(from) && <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Token ID</div>
        <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} style={inputStyle} />
        {tokenIdBigInt === null && (
          <div style={{ color: "crimson", marginTop: 6 }}>TokenId must be integer ≥ 0</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Amount</div>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
        {amountBigInt === null && (
          <div style={{ color: "crimson", marginTop: 6 }}>Amount must be integer &gt; 0</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Reference (text → bytes32)</div>
        <input value={refText} onChange={(e) => setRefText(e.target.value)} style={inputStyle} />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          ref(bytes32): {refBytes32 || "-"}
        </div>
      </label>

      <button
        onClick={onBurn}
        disabled={disabled}
        style={{ padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {busy ? "Submitting..." : "Burn Credits"}
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
        Rule: burn allowed if <b>msg.sender == from</b> OR <b>isMinter[msg.sender]</b>.
      </div>
    </div>
  );
}