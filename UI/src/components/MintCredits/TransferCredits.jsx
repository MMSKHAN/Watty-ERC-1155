import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress } from "viem";

import { wattyContract } from "../Hooks/Watty";

const inputStyle = {
  width: "100%",
  padding: 10,
  fontFamily: "monospace",
  boxSizing: "border-box",
};

function isHexBytes(v) {
  if (!v) return true; // allow empty -> treated as 0x
  return /^0x[0-9a-fA-F]*$/.test(v);
}

export default function TransferCredits() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: connected, isConnected } = useAccount();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tokenId, setTokenId] = useState("1");
  const [amount, setAmount] = useState("1");
  const [dataHex, setDataHex] = useState("0x"); // bytes

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

  const valid =
    isConnected &&
    isAddress(from) &&
    isAddress(to) &&
    tokenIdBigInt !== null &&
    amountBigInt !== null &&
    isHexBytes(dataHex);

  // If transferring from someone else, connected wallet must be approved
  const needsApproval =
    connected &&
    isAddress(from) &&
    connected.toLowerCase() !== from.toLowerCase();

  const approvalRead = useReadContract({
    ...wattyContract,
    functionName: "isApprovedForAll",
    args: needsApproval ? [from, connected] : undefined, // owner, operator
    query: { enabled: Boolean(needsApproval) },
  });

  const isApproved = needsApproval ? Boolean(approvalRead.data) : true;

  // Transfer tx
  const {
    data: txHash,
    isPending,
    error,
    writeContractAsync,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Approve tx
  const {
    data: approveHash,
    isPending: approvePending,
    error: approveError,
    writeContractAsync: writeApproveAsync,
  } = useWriteContract();

  const {
    isLoading: approveConfirming,
    isSuccess: approveConfirmed,
    error: approveConfirmError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const busy = isPending || isConfirming;
  const approveBusy = approvePending || approveConfirming;

  const errMsg =
    (error || confirmError)?.shortMessage || (error || confirmError)?.message || "";

  const approveErrMsg =
    (approveError || approveConfirmError)?.shortMessage ||
    (approveError || approveConfirmError)?.message ||
    "";

  const disabled = !valid || busy || !isApproved;

  const onTransfer = async () => {
    if (disabled) return;

    try {
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected,
        functionName: "safeTransferFrom",
        args: [from, to, tokenIdBigInt, amountBigInt, dataHex || "0x"],
      });

      await writeContractAsync(request);
    } catch (e) {
      console.error("safeTransferFrom failed:", e);
    }
  };

  const onApproveOperator = async () => {
    // Approve connected wallet as operator for "from" wallet
    // NOTE: must be executed by the "from" wallet itself.
    if (!connected || !needsApproval) return;

    // user must switch wallet to `from` to approve
    if (connected.toLowerCase() !== from.toLowerCase()) return;

    try {
      const { request } = await publicClient.simulateContract({
        ...wattyContract,
        account: connected,
        functionName: "setApprovalForAll",
        args: [connected, true], // operator, approved
      });

      await writeApproveAsync(request);
    } catch (e) {
      console.error("setApprovalForAll failed:", e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 950, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>safeTransferFrom (ERC1155)</h2>

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

        {needsApproval && (
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 10 }}>
            <b>Approval needed?</b>{" "}
            {approvalRead.isLoading ? "Loading..." : isApproved ? "✅ Approved" : "❌ Not approved"}
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              If <b>from</b> is not your connected wallet, your connected wallet must be an approved operator.
            </div>
          </div>
        )}
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>From</div>
        <input value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        {from && !isAddress(from) && <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>To</div>
        <input value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        {to && !isAddress(to) && <div style={{ color: "crimson", marginTop: 6 }}>Invalid address</div>}
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
        <div style={{ marginBottom: 6 }}>Data (bytes, hex)</div>
        <input value={dataHex} onChange={(e) => setDataHex(e.target.value)} style={inputStyle} />
        {!isHexBytes(dataHex) && (
          <div style={{ color: "crimson", marginTop: 6 }}>Must be hex like 0x or 0x1234</div>
        )}
      </label>

      <button
        onClick={onTransfer}
        disabled={disabled}
        style={{ padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {busy ? "Submitting..." : "Transfer"}
      </button>

      {needsApproval && !isApproved && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
          <div style={{ marginBottom: 8 }}>
            You are not approved to transfer from that <b>from</b> address.
          </div>

          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
            To approve: switch MetaMask to the <b>from</b> wallet, then click approve.
          </div>

          <button
            onClick={onApproveOperator}
            disabled={approveBusy || !connected || connected.toLowerCase() !== from.toLowerCase()}
            style={{ padding: "10px 14px" }}
          >
            {approveBusy ? "Approving..." : "Approve operator (setApprovalForAll)"}
          </button>

          {approveHash && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Approve tx hash</div>
              <div style={{ fontFamily: "monospace" }}>{approveHash}</div>
            </div>
          )}

          {approveConfirmed && <div style={{ marginTop: 8, color: "green" }}>✅ Approval confirmed</div>}
          {approveErrMsg && <div style={{ marginTop: 8, color: "crimson" }}>❌ {approveErrMsg}</div>}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {txHash && (
          <>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Tx hash</div>
            <div style={{ fontFamily: "monospace" }}>{txHash}</div>
          </>
        )}

        {isConfirmed && <div style={{ marginTop: 8, color: "green" }}>✅ Confirmed</div>}
        {errMsg && <div style={{ marginTop: 8, color: "crimson" }}>❌ {errMsg}</div>}
      </div>
    </div>
  );
}