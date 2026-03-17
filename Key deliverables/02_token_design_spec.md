# Phase 1 — Token Design Spec (Task 1)

---

# Task 1: Define the Token Model

## 1) Primary design (chosen model)

### Chosen: Option B (ERC-1155 Energy Receipts) with Option C (off-chain aggregation)

The system uses **ERC-1155 tokens** to represent energy credits issued from verified energy production.

Each token represents a **verified amount of energy (Wh)** associated with a meter and settlement process.

However, instead of minting tokens for every raw meter event, the system uses:

- **Off-chain aggregation (Option C)**
- Then performs **on-chain minting after verification**

This hybrid approach ensures:

- Good auditability (via ERC1155 tokens)
- Lower gas costs (via off-chain aggregation)
- Scalability for high-frequency IoT data

---

## 2) Token unit definition (kWh/Wh) and decimals

- Unit: **Wh (watt-hour)**
- Decimals: **0**
- Meaning: **1 WTY = 1 Wh**

Minted amount is calculated off-chain and then submitted to the smart contract.

---

## 3) Mint / burn / transfer rules

### Mint

Mint is allowed only when:

- Meter is registered
- Data is verified by oracle/backend
- Energy delta is valid
- Oracle (MINTER role) submits the transaction

Who can mint:

- Only the **MINTER role (oracle/backend)**

Hard requirement:

- **No device can mint directly**
- Devices only send data
- Minting happens only via **oracle verification**

---

### Burn

Burn is allowed when:

- Credits are redeemed or settled
- User or authorized minter initiates burn

Burn is permanent and irreversible.

---

### Transfer

Transfer is allowed:

- Between users holding tokens
- As long as tokens are not burned

Transfer only changes ownership, not energy data.

---

## 4) Roles

Defined in the contract:

- **Admin**
  - Assign/remove minters
  - Register meters

- **Minter (Oracle)**
  - Report energy
  - Mint credits
  - Finalize settlement

- **User**
  - Hold tokens
  - Burn tokens

---

## 5) Compliance controls (PoC vs Production)

### PoC

- No strict compliance enforcement

### Production (future)

- Allowlist (approved wallets)
- Blacklist (blocked wallets)
- Freeze tokens in disputes
- Global pause mechanism

---

## 6) Comparison with alternatives

### Option A — ERC-20 (Energy Credit Token)

- Fungible token
- Simple model

Cons:
- Weak traceability
- Hard to link tokens to specific energy batches

Not chosen because:
- WATTY requires auditability and traceability

---

### Option B — ERC-1155 (Chosen)

- Supports multiple token types
- Efficient batch operations
- Better for representing energy credits

Pros:
- Scalable
- Flexible
- Suitable for batch minting
- Compatible with off-chain aggregation

---

### Option C — Off-chain ledger + settlement

- Used as **supporting layer**
- Aggregates energy data before minting

Pros:
- Reduces gas costs
- Improves scalability

---

## Final Statement

The system uses a **hybrid model**:

- **ERC-1155 tokens (Option B)** for representing energy credits on-chain  
- **Off-chain aggregation (Option C)** for scalability and cost efficiency  

This combination provides:

- Strong auditability  
- Efficient gas usage  
- Scalable handling of IoT energy data  
---


# Task 2: Key On-Chain Events (Indexing + Audit)



## Introduction

On-chain events are public records stored on the blockchain.
They are not normal contract storage variables.
They are stored inside transaction logs.

Contract storage = contract working memory (balances, roles, supply).
Event logs = public receipts of what happened.

Events help with:
- Transparency
- Audit
- Indexing (dashboards, explorers)
- Supply tracking
- Regulatory review

Full detailed data remains in the internal WATTY system.
Only important proof data is recorded on-chain.

---

# 1. MeterRegistered

Event:
MeterRegistered(meterId, owner, metadataHash)

## Purpose

This event records that a new energy meter has been officially registered.

Why we need it:
- To prove when a meter was added
- To link the meter to an owner
- To prevent fake or unapproved devices
- To provide audit trace

## Parameters

### meterId
Unique identifier of the meter/device.
Used to link future energy reports to this device.

### owner
Wallet address or organization responsible for the meter.
Provides accountability.

### metadataHash
Digital fingerprint of the meter details.
The full device data (serial number, model, location) is stored internally.
Only the hash is stored on-chain to:
- Prove data integrity
- Detect tampering
- Support audits

## Where Stored

Stored on the blockchain as a transaction log.
Not stored as full metadata.

---

# 2. EnergyReported

Event:
EnergyReported(meterId, intervalId, whDelta, dataHash)

## Purpose

Records that energy data was reported for a specific time interval.

Why we need it:
- Transparency of energy reporting
- Historical tracking
- Proof that data existed at that time
- Support audit verification

Note:
If micro-interval data is kept fully off-chain, this event may be optional.

## Parameters

### meterId
Identifies which device reported the energy.

### intervalId
Identifies the reporting period (daily, hourly, etc.).
Used to track production timeline.

### whDelta
Energy produced in that interval (in Wh).
Used for transparency and traceability.

### dataHash
Digital fingerprint of detailed telemetry data.
Full telemetry stays internal.
Hash proves data was not modified later.

## Where Stored

Stored on the blockchain as transaction log.
Full telemetry remains internal.

---

# 3. CreditsMinted

Event:
CreditsMinted(meterId, to, amount, ref)

## Purpose

Records that tokens were created after verification and certificate issuance.

Why we need it:
- To prove token creation
- To link minting to verified energy
- To prevent hidden minting
- To track total supply creation

## Parameters

### meterId
Identifies the source device or site of energy.

### to
Wallet address receiving the tokens.
Shows ownership.

### amount
Number of tokens minted.
Used for supply tracking and accounting.

### ref
Reference ID (certificate ID or batch ID).
Links minting to official certificate.
Provides traceability.

## Where Stored

Stored on blockchain as part of the mint transaction log.

---

# 4. CreditsBurned

Event:
CreditsBurned(from, amount, ref)

## Purpose

Records that tokens were permanently destroyed (retired).

Why we need it:
- To prove retirement
- To prevent double counting
- To track reduction in supply
- To support environmental credibility

## Parameters

### from
Wallet that burned the tokens.
Provides transparency.

### amount
Number of tokens burned.
Used for supply reconciliation.

### ref
Reference ID linked to retirement or settlement.
Maintains audit trail.

## Where Stored

Stored on blockchain as part of burn transaction log.

---

# 5. SettlementFinalized

Event:
SettlementFinalized(siteId, period, totalWh, totalTokens, proofHash)

## Purpose

Records that a settlement period (daily/monthly/etc.) has been officially finalized.

Why we need it:
- To anchor approved batch results
- To record verified energy amount
- To record total minted tokens
- To store proof of audit bundle
- To connect internal verification with blockchain proof

This is the bridge between internal approval and public record.

## Parameters

### siteId
Identifies the energy site or asset.

### period
Time period of settlement (example: January 2026).

### totalWh
Total verified energy for that period.
Used for audit comparison.

### totalTokens
Total tokens minted for that period.
Used for reconciliation.

### proofHash
Digital fingerprint of full audit bundle.
Audit bundle includes:
- Energy data
- CO₂ calculations
- BP13 results
- EF version
- Carbon curve version

Hash proves settlement data has not changed.




