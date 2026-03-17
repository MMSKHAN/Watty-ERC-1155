#  Frontend Setup (React.js)


Navigate to the UI directory:

```
cd UI
```
## Install dependencies:
```
npm install
```
## Start the React development server:
```
npm start
```
## Application will run at:
```
http://localhost:3000
```
##  Wallet Connection

The UI integrates wallet connections using:

- Wagmi

- RainbowKit

Supported wallets:

- MetaMask

- WalletConnect

Configure MetaMask for the Hardhat network:
```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
```
##  Example Workflow

Typical usage flow:

1️ Register meter
```
registerMeter
```
2️ Assign minter
```
setMinter
```
3️ Report energy production
```
reportEnergy
```
4️ Mint energy credits
```
mintCredits
```
5️ Burn credits when redeemed

```
burnCredits 
```

6️ Finalize settlement
```
finalizeSettlement
```
# Security Design

The system implements role-based access control.

- Only Admin can register meters

- Only Minters can report energy and mint tokens

- Devices cannot mint tokens directly

All actions are recorded via events for auditing