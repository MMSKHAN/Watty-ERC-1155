// import { useMemo, useState } from "react";
// import { useChainId, useReadContract } from "wagmi";
// import { isAddress } from "viem";

// import { wattyContract } from "../Hooks/Watty";

// const inputStyle = {
//   width: "100%",
//   padding: 10,
//   fontFamily: "monospace",
//   boxSizing: "border-box",
// };

// function parseAddresses(text) {
//   return String(text ?? "")
//     .split(/\r?\n/)
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// function parseTokenIds(text) {
//   // allow comma or newline separated
//   return String(text ?? "")
//     .split(/[\n,]+/)
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// export default function GetBatchCredits() {
//   const chainId = useChainId();

//   const [addressesText, setAddressesText] = useState(
//     "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\n0x90F79bf6EB2c4f870365E785982E1f101E93b906"
//   );
//   const [tokenIdsText, setTokenIdsText] = useState("1,2");

//   const addresses = useMemo(() => parseAddresses(addressesText), [addressesText]);
//   const tokenIdsRaw = useMemo(() => parseTokenIds(tokenIdsText), [tokenIdsText]);

//   const addressesValid = useMemo(
//     () => addresses.length > 0 && addresses.every((a) => isAddress(a)),
//     [addresses]
//   );

//   const tokenIds = useMemo(() => {
//     try {
//       const parsed = tokenIdsRaw.map((t) => BigInt(t));
//       if (parsed.some((x) => x < 0n)) return null;
//       return parsed;
//     } catch {
//       return null;
//     }
//   }, [tokenIdsRaw]);

//   // ERC1155 rule: addresses.length must equal tokenIds.length
//   const sameLength =
//     addresses.length > 0 && tokenIds && tokenIds.length > 0 && addresses.length === tokenIds.length;

//   const enabled = addressesValid && Boolean(tokenIds) && sameLength;

//   const batchRead = useReadContract({
//     ...wattyContract,
//     functionName: "balanceOfBatch",
//     args: enabled ? [addresses, tokenIds] : undefined,
//     query: { enabled },
//   });

//   const balances = batchRead.data; // BigInt[] (usually)

//   return (
//     <div style={{ padding: 24, maxWidth: 950, margin: "0 auto", fontFamily: "sans-serif" }}>
//       <h2>balanceOfBatch (ERC1155)</h2>

//       <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
//         <div style={{ fontSize: 13, opacity: 0.85 }}>
//           <b>chainId:</b> <span style={{ fontFamily: "monospace" }}>{chainId ?? "-"}</span>
//         </div>
//         <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
//           <b>contract:</b>{" "}
//           <span style={{ fontFamily: "monospace" }}>{wattyContract.address}</span>
//         </div>
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//         <div>
//           <label style={{ display: "block" }}>
//             <div style={{ marginBottom: 6 }}>
//               Addresses (one per line) — must match tokenIds count
//             </div>
//             <textarea
//               value={addressesText}
//               onChange={(e) => setAddressesText(e.target.value)}
//               style={{ ...inputStyle, minHeight: 140 }}
//               placeholder="0x...\n0x...\n0x..."
//             />
//           </label>

//           {!addressesValid && addresses.length > 0 && (
//             <div style={{ color: "crimson", marginTop: 8 }}>
//               One or more addresses are invalid.
//             </div>
//           )}

//           <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
//             Parsed addresses: <b>{addresses.length}</b>
//           </div>
//         </div>

//         <div>
//           <label style={{ display: "block" }}>
//             <div style={{ marginBottom: 6 }}>
//               Token IDs (comma or newline) — must match addresses count
//             </div>
//             <textarea
//               value={tokenIdsText}
//               onChange={(e) => setTokenIdsText(e.target.value)}
//               style={{ ...inputStyle, minHeight: 140 }}
//               placeholder="1,2,3"
//             />
//           </label>

//           {tokenIds === null && tokenIdsRaw.length > 0 && (
//             <div style={{ color: "crimson", marginTop: 8 }}>
//               Token IDs must be integers ≥ 0 (e.g. 1,2,3).
//             </div>
//           )}

//           <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
//             Parsed tokenIds: <b>{tokenIds ? tokenIds.length : 0}</b>
//           </div>
//         </div>
//       </div>

//       {!sameLength && addresses.length > 0 && tokenIds && (
//         <div style={{ color: "crimson", marginTop: 10 }}>
//           ERC1155 requires <b>addresses.length === tokenIds.length</b>.{" "}
//           Right now: {addresses.length} vs {tokenIds.length}
//         </div>
//       )}

//       <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
//         {!enabled && (
//           <div style={{ opacity: 0.85 }}>
//             Enter valid addresses and token IDs. Counts must match.
//           </div>
//         )}

//         {batchRead.isLoading && <div>Loading...</div>}

//         {batchRead.error && (
//           <div style={{ color: "crimson" }}>Error: {batchRead.error.message}</div>
//         )}

//         {!batchRead.isLoading && !batchRead.error && enabled && balances && (
//           <div>
//             <div style={{ marginBottom: 10, opacity: 0.85 }}>
//               Returned <b>{balances.length}</b> balances:
//             </div>

//             <div style={{ display: "grid", gap: 8 }}>
//               {balances.map((b, i) => (
//                 <div
//                   key={i}
//                   style={{
//                     border: "1px solid #eee",
//                     borderRadius: 10,
//                     padding: 10,
//                     fontFamily: "monospace",
//                   }}
//                 >
//                   <div>address: {addresses[i]}</div>
//                   <div>tokenId: {tokenIds[i].toString()}</div>
//                   <div>
//                     balance: <b>{b.toString()}</b>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
//  <Route path="/get-batch-credits" element={<GetBatchCredits />} />
//  <NavLink to={"/get-batch-credits"} style={navStyle}>Get Batch Credits</NavLink>