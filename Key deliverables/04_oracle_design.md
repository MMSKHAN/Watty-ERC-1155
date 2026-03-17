# 04_oracle_design.md

## Oracle Service Design

### Overview

The Oracle Service acts as a bridge between simulated IoT energy data and the blockchain smart contract.  
It receives energy production events from a simulator, verifies them according to defined rules, and submits a transaction to mint energy credits on-chain.

The system architecture is:
```
IoT Simulator
     ↓
Oracle Service
     ↓
Smart Contract
     ↓
ERC1155 Energy Credits
```

The simulator mimics a smart energy meter generating production data, while the oracle validates the data before minting credits on the blockchain.

---

# 1. Energy Event Simulator

The Energy Event Simulator represents a simplified IoT energy meter.

Its responsibilities include:

- Generating simulated energy production values
- Producing energy delta events
- Sending events to the Oracle API

The simulator generates a random energy delta value and constructs an event object containing:

- meterId
- intervalId
- whDelta
- dataHash

Example event structure:
```
{
meterId: bytes32,
intervalId: number,
whDelta: number,
dataHash: bytes32
}
```
Where:

| Field | Description |
|------|-------------|
| meterId | Unique identifier of the energy meter |
| intervalId | Time interval identifier |
| whDelta | Energy produced during the interval |
| dataHash | Hash of off-chain energy data |

The simulator sends this event to the Oracle API endpoint:


---

# 2. Oracle Service

The Oracle Service is implemented using **Node.js**, **Express**, and **ethers.js**.

Its responsibilities are:

1. Receive energy delta events
2. Verify the data
3. Prevent duplicate interval processing
4. Submit blockchain transactions to mint energy credits

The oracle connects to the Ethereum blockchain through a **Hardhat local node**.

---

# 3. Verification Rules

Before minting tokens, the oracle validates incoming energy events using several rules.

## 3.1 Monotonic Energy Constraint

Energy production values must be positive.



If the delta is zero or negative, the event is rejected.

---

## 3.2 Plausible Range Validation

Energy values must remain within a realistic operational range.


This prevents unrealistic spikes caused by corrupted or malicious data.

---

## 3.3 Interval Uniqueness

Each meter interval should only be processed once.

The oracle creates a unique key using:


If the same interval is received again, the oracle ignores it.

---

# 4. Idempotency Strategy

Idempotency ensures that submitting the same interval multiple times does not create multiple mint transactions.

The oracle stores processed intervals in memory using a JavaScript Set:

When an event is received:

1. A key is generated.

2. The oracle checks if the key already exists.

3. If the key exists, the event is ignored.

4. If not, the oracle mints credits and records the interval.

This ensures that each interval is processed exactly once.

---

# 5. Replay Protection Strategy

Replay attacks occur when previously valid events are resent to the oracle.

Replay protection is implemented by tracking processed intervals.

If a repeated interval is received, the oracle detects the duplicate and ignores the event.

In this proof-of-concept implementation, processed intervals are stored in memory.

In a production system, interval history should be stored in a persistent database

This ensures replay protection even if the oracle service restarts.

---
# 6. Blockchain Interaction

After verification, the oracle calls the smart contract function:
```
mintCredits(
meterId,
wallet.address,
tokenId,
amount,
dataHash
)
```

Where:

| Parameter | Description |
|----------|-------------|
| meterId | Registered meter identifier |
| wallet.address | Wallet receiving minted credits |
| tokenId | ERC1155 token identifier |
| amount | Number of credits minted |
| dataHash | Hash reference for off-chain data |

The transaction is signed using the oracle wallet and submitted to the blockchain.

---

# 7. Private Key Handling

## Proof-of-Concept (PoC)

For development, the oracle stores the private key locally in the application configuration:

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

This approach is acceptable in local testing environments.

---

## Production Approach

In production deployments, private keys must never be stored in application code.

Recommended solutions include:

- AWS Key Management Service (KMS)
- HashiCorp Vault
- Hardware Security Modules (HSM)

These systems securely manage keys and protect against unauthorized access.

---
