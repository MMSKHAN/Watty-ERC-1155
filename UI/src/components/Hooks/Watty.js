// src/components/Hooks/Watty.js

import artifact from "../../artifacts/contracts/Watty.sol/WTYSettlement1155.json";

export const WATTY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const wattyContract = {
  address: WATTY_ADDRESS,
  abi: artifact.abi,
};