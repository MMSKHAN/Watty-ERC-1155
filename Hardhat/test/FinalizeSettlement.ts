// import { expect } from "chai";
// import { network } from "hardhat";

// const { ethers } = await network.connect();

// describe("WTYSettlement1155 - finalizeSettlement", function () {
//   const b32 = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

//   async function deployAndSetup() {
//     const [admin, minter, other] = await ethers.getSigners();
//     const c = await ethers.deployContract("WTYSettlement1155");

//     // Admin approves minter (required)
//     await c.setMinter(minter.address, true);

//     return { c, admin, minter, other };
//   }

//   it("emits SettlementFinalized when called by minter with valid inputs", async function () {
//     const { c, minter } = await deployAndSetup();

//     const siteId = b32("SITE-22");
//     const period = b32("2026-03"); // any bytes32 identifier for the settlement period
//     const totalWh = 500_000n;
//     const totalTokens = 500n;
//     const proofHash = b32("PROOF-HASH-001");

//     await expect(
//       c.connect(minter).finalizeSettlement(siteId, period, totalWh, totalTokens, proofHash)
//     )
//       .to.emit(c, "SettlementFinalized")
//       .withArgs(siteId, period, totalWh, totalTokens, proofHash);
//   });

//   it("reverts if caller is not minter (NotMinter)", async function () {
//     const { c, other } = await deployAndSetup();

//     await expect(
//       c.connect(other).finalizeSettlement(
//         b32("SITE-X"),
//         b32("2026-03"),
//         1n,
//         1n,
//         b32("PROOF-X")
//       )
//     ).to.be.revertedWithCustomError(c, "NotMinter");
//   });

//   it("reverts if siteId is zero (ZeroValue)", async function () {
//     const { c, minter } = await deployAndSetup();

//     await expect(
//       c.connect(minter).finalizeSettlement(
//         ethers.ZeroHash,
//         b32("2026-03"),
//         10n,
//         10n,
//         b32("PROOF-1")
//       )
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });

//   it("reverts if period is zero (ZeroValue)", async function () {
//     const { c, minter } = await deployAndSetup();

//     await expect(
//       c.connect(minter).finalizeSettlement(
//         b32("SITE-22"),
//         ethers.ZeroHash,
//         10n,
//         10n,
//         b32("PROOF-2")
//       )
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });

//   it("reverts if proofHash is zero (ZeroValue)", async function () {
//     const { c, minter } = await deployAndSetup();

//     await expect(
//       c.connect(minter).finalizeSettlement(
//         b32("SITE-22"),
//         b32("2026-03"),
//         10n,
//         10n,
//         ethers.ZeroHash
//       )
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });

//   it("reverts if totalWh is zero (ZeroValue)", async function () {
//     const { c, minter } = await deployAndSetup();

//     await expect(
//       c.connect(minter).finalizeSettlement(
//         b32("SITE-22"),
//         b32("2026-03"),
//         0n,
//         10n,
//         b32("PROOF-3")
//       )
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });

//   it("reverts if totalTokens is zero (ZeroValue)", async function () {
//     const { c, minter } = await deployAndSetup();

//     await expect(
//       c.connect(minter).finalizeSettlement(
//         b32("SITE-22"),
//         b32("2026-03"),
//         10n,
//         0n,
//         b32("PROOF-4")
//       )
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });
// });