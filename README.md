# ⚡ WTY Energy Settlement System

A blockchain-based energy reporting and settlement system built on Ethereum using **Solidity, Hardhat, and React**.

This project demonstrates how energy production data can be verified and converted into digital energy credits using smart contracts.  
The system records meter activity, reports energy production, mints energy credits, and finalizes settlement events in a transparent and auditable way.

---

# 📁 Project Structure

This is a detailed overview of the project structure.

## project-root

The root directory contains the following key subdirectories and files:

### Hardhat/
This directory is for the Hardhat environment, which is used for Ethereum smart contract development.

- **contracts/**: Contains the smart contract files (e.g., `.sol`).
- **scripts/**: Contains the scripts for deploying, testing, and interacting with contracts.
- **test/**: Contains test files to ensure the correctness of the smart contracts.
- **hardhat.config.js**: The Hardhat configuration file.

### UI/
This directory contains the frontend code for interacting with the smart contracts.

- **src/**: Contains source files for the frontend application.
  - **artifacts/**: Contains compiled smart contract artifacts (ABI and bytecode).
  - **components/**: Contains the React or UI components for the frontend.
- **package.json**: The package manifest for the frontend dependencies and scripts.
