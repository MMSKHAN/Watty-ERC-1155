import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, polygon, mainnet, sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const config = getDefaultConfig({
  appName: "My Hardhat dApp",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // recommend real one
  chains: [hardhat, polygon, mainnet, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"), // ✅ this must exist
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
  ssr: false,
});