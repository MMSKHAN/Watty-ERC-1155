// import { expect } from "chai";
// import { network } from "hardhat";

// const { ethers } = await network.connect();

// describe("WTYSettlement1155 - registerMeter (print logs)", function () {
//   const b32 = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

//   it("registers meter, prints emitted event to console", async function () {
//     const [, , meterOwner] = await ethers.getSigners();
//     const contract = await ethers.deployContract("WTYSettlement1155");

//     const meterId = b32("METER-001");
//     const metadataHash = b32("META-001");

//     // 1) Send tx
//     const tx = await contract.registerMeter(meterId, meterOwner.address, metadataHash);

//     // 2) Wait for receipt
//     const receipt = await tx.wait();

//     console.log("Tx hash:", receipt!.hash);
//     console.log("Block:", receipt!.blockNumber);

//     // 3) Parse logs from the receipt and print MeterRegistered
//     for (const log of receipt!.logs) {
//       try {
//         const parsed = contract.interface.parseLog(log);
//         if (parsed.name === "MeterRegistered") {
//           console.log("✅ MeterRegistered event:");
//           console.log("  meterId     :", parsed.args.meterId);
//           console.log("  owner       :", parsed.args.owner);
//           console.log("  metadataHash:", parsed.args.metadataHash);
//         }
//       } catch {
//         // ignore logs not from this contract / not matching ABI
//       }
//     }

//     // keep your assertion too
//     await expect(tx)
//       .to.emit(contract, "MeterRegistered")
//       .withArgs(meterId, meterOwner.address, metadataHash);
//   });

//   it("prints all MeterRegistered events (queryFilter)", async function () {
//     const [, , meterOwner] = await ethers.getSigners();
//     const contract = await ethers.deployContract("WTYSettlement1155");

//     // register 2 meters
//     await contract.registerMeter(b32("METER-A"), meterOwner.address, b32("META-A"));
//     await contract.registerMeter(b32("METER-B"), meterOwner.address, b32("META-B"));

//     // filter + query
//     const events = await contract.queryFilter(contract.filters.MeterRegistered(), 0, "latest");

//     console.log("---- All MeterRegistered events ----");
//     for (const e of events) {
//       console.log("meterId     :", e.args.meterId);
//       console.log("owner       :", e.args.owner);
//       console.log("metadataHash:", e.args.metadataHash);
//       console.log("blockNumber :", e.blockNumber);
//       console.log("txHash      :", e.transactionHash);
//       console.log("-----------------------------------");
//     }
//   });
// });