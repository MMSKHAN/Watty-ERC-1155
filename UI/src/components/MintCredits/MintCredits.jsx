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
import { NavLink } from "react-router-dom";

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

function normalizeRef(text) {
  // keep ref stable too
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function toBytes32FromText(text, normalizeFn) {
  const v = normalizeFn(text);
  return v ? keccak256(toHex(v)) : null;
}

export default function MintCredits() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: connected, isConnected } = useAccount();

  // Read isMinter(connected)
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
  const [to, setTo] = useState("");
  const [tokenId, setTokenId] = useState("1");
  const [amount, setAmount] = useState("50");
  const [refText, setRefText] = useState("MINT-REF-001");

  // default "to" = connected wallet
  useEffect(() => {
    if (connected && !to) setTo(connected);
  }, [connected, to]);

  // bytes32 meterId (must match register/explorer logic)
  const meterIdBytes32 = useMemo(
    () => toBytes32FromText(meterIdText, normalizeMeterId),
    [meterIdText]
  );

  // bytes32 ref
  const refBytes32 = useMemo(
    () => toBytes32FromText(refText, normalizeRef),
    [refText]
  );

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

  // ✅ extra safety: check meter registered before mint
  const meterRead = useReadContract({
    ...wattyContract,
    functionName: "meters",
    args: meterIdBytes32 ? [meterIdBytes32] : undefined,
    query: { enabled: Boolean(meterIdBytes32) },
  });

  // meters() returns tuple: [owner, metadataHash]
  const meterOwner = meterRead.data?.[0];
  const meterRegistered =
    meterOwner &&
    isAddress(meterOwner) &&
    meterOwner !== "0x0000000000000000000000000000000000000000";

  const busy = isPending || isConfirming;

  const errMsg =
    (error || confirmError)?.shortMessage ||
    (error || confirmError)?.message ||
    "";

  const disabled =
    !isConnected ||
    busy ||
    !isMinter ||
    !meterIdBytes32 ||
    !refBytes32 ||
    !isAddress(to) ||
    tokenIdBigInt === null ||
    amountBigInt === null ||
    !meterRegistered;

  const onMint = async () => {
    if (disabled) return;

    try {
      // ✅ simulate first (gas-safe + catches revert before sending)
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected, // sender must be minter
        functionName: "mintCredits",
        args: [meterIdBytes32, to, tokenIdBigInt, amountBigInt, refBytes32],
      });

      await writeContractAsync(request);
    } catch (e) {
      console.error("mintCredits failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
            <h2>Mint Credits (Minter only)</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
        </div>

        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>contract:</b> <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
        </div>

        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>connected:</b> <span style={{ fontFamily: "monospace" }}>{connected || "Not connected"}</span>
        </div>

        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          <b>isMinter(connected):</b>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {minterRead.isLoading ? "Loading..." : String(isMinter)}
          </span>
        </div>

        {!minterRead.isLoading && connected && !isMinter && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            ❌ You are not a minter. Go to SetMinter page and enable your wallet as minter.
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
            meterOwner: {meterOwner}
          </div>
        )}
        {!meterRead.isLoading && !meterRegistered && (
          <div style={{ color: "crimson", fontSize: 12, marginTop: 6 }}>
            This meterId is not registered on this contract. Register it first.
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>To address</div>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={inputStyle}
          placeholder="0x..."
        />
        {to && !isAddress(to) && (
          <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Token ID (uint256)</div>
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          style={inputStyle}
          placeholder="1"
        />
        {tokenIdBigInt === null && (
          <div style={{ color: "crimson", marginTop: 6 }}>TokenId must be integer ≥ 0</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Amount (uint256)</div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={inputStyle}
          placeholder="50"
        />
        {amountBigInt === null && (
          <div style={{ color: "crimson", marginTop: 6 }}>Amount must be integer &gt; 0</div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>Reference (text → bytes32)</div>
        <input
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
          style={inputStyle}
          placeholder="MINT-REF-001"
        />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontFamily: "monospace" }}>
          ref(bytes32): {refBytes32 || "-"}
        </div>
      </label>

      <button
        onClick={onMint}
        disabled={disabled}
        style={{ padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {busy ? "Submitting..." : "Mint Credits"}
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