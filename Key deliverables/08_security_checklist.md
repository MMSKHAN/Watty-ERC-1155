#  WATTY Security Checklist (OWASP + Web3)

This document outlines key security considerations for the WATTY system, covering smart contracts, oracle/backend, API, and blockchain-specific risks.

---

#  1. Smart Contract Security

## Access Control

- Only **Admin** can:
  - Register meters
  - Assign/remove minters

- Only **Minter (Oracle)** can:
  - Mint credits
  - Report energy
  - Finalize settlement

---

## Input Validation

- Reject zero values (amount, meterId, dataHash)
- Reject invalid addresses
- Ensure meter is registered before minting

---

## Event Logging

All important actions emit events:

- MeterRegistered  
- EnergyReported  
- CreditsMinted  
- CreditsBurned  
- SettlementFinalized  

---

## Reentrancy Safety

- No external calls before state changes
- Uses OpenZeppelin ERC1155 (safe standard)

---

# 2. Oracle / Backend Security

## Idempotency

- Prevent duplicate minting using:
meterId + intervalId


- Same interval cannot mint twice

---

## Replay Protection

- Previously processed intervals are ignored
- Stored in memory (PoC)
- Use database in production

---

## Input Validation

- whDelta > 0
- whDelta within valid range
- intervalId must be unique

---

## Error Handling

- Failed transactions are logged
- API returns error response on failure

---

# 3. API Security (OWASP)

## Input Validation

- Validate all incoming fields
- Reject malformed or missing data

---

## Authentication (Future)

- Protect API with API keys or tokens
- Allow only trusted clients (oracle/simulator)

---

## Rate Limiting (Future)

- Prevent spam or abuse
- Limit request frequency

---

# 4. Private Key Management

## PoC

- Private key stored in backend (not secure)

---

## Production

Use secure solutions:

- AWS KMS  
- HashiCorp Vault  
- Hardware Security Modules (HSM)  

---

## Best Practices

- Never expose keys in logs
- Rotate keys periodically

---

# 5. Wallet Security

- Use MetaMask or secure wallet
- Never share private keys
- Use hardware wallets in production

---

# 6. Gas & Transaction Safety

- Avoid unnecessary transactions
- Use batching in production
- Monitor failed transactions

---

# 7. Data Integrity

- Use hashes (dataHash) for off-chain data
- Ensure data cannot be tampered with
- Maintain audit trail

---

# 8. Monitoring & Alerts (Production)

Monitor:

- Oracle failures  
- Transaction failures  
- Suspicious activity  

---

#  9. What Can Go Wrong

- Duplicate minting (if idempotency fails)
- Fake data submission
- Oracle downtime
- Smart contract bugs
- Private key exposure
- High gas fees
- Replay attacks

---