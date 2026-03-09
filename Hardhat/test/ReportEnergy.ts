// import { expect } from "chai";
// import { network } from "hardhat";

// const { ethers } = await network.connect();

// describe("WTYSettlement1155 - reportEnergy", function () {
//   const b32 = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

//   async function deployAndSetup() {
//     const [admin, minter, meterOwner, other] = await ethers.getSigners();
//     const c = await ethers.deployContract("WTYSettlement1155");

//     // Admin approves a minter (required to call reportEnergy)
//     await c.setMinter(minter.address, true);

//     // Register a meter (required so meter is considered registered)
//     const meterId = b32("METER-ENERGY-1");
//     const metadataHash = b32("META-ENERGY-1");
//     await c.registerMeter(meterId, meterOwner.address, metadataHash);

//     return { c, admin, minter, meterOwner, other, meterId };
//   }

//   it("emits EnergyReported when called by a minter with valid inputs", async function () {
//     const { c, minter, meterId } = await deployAndSetup();

//     const intervalId = b32("2026-03-02T00:00Z/15m");
//     const whDelta = 1500n;
//     const dataHash = b32("RAW-READING-HASH-1");

//     await expect(c.connect(minter).reportEnergy(meterId, intervalId, whDelta, dataHash))
//       .to.emit(c, "EnergyReported")
//       .withArgs(meterId, intervalId, whDelta, dataHash);
//   });

//   it("reverts if caller is not minter (NotMinter)", async function () {
//     const { c, other, meterId } = await deployAndSetup();

//     await expect(
//       c.connect(other).reportEnergy(meterId, b32("I1"), 1n, b32("D1"))
//     ).to.be.revertedWithCustomError(c, "NotMinter");
//   });

//   it("reverts if meter is not registered (MeterNotRegistered)", async function () {
//     const [admin, minter] = await ethers.getSigners();
//     const c = await ethers.deployContract("WTYSettlement1155");

//     await c.setMinter(minter.address, true);

//     const unknownMeterId = b32("UNKNOWN-METER");
//     await expect(
//       c.connect(minter).reportEnergy(unknownMeterId, b32("I2"), 10n, b32("D2"))
//     ).to.be.revertedWithCustomError(c, "MeterNotRegistered");
//   });

//   it("reverts if intervalId is zero or dataHash is zero (ZeroValue)", async function () {
//     const { c, minter, meterId } = await deployAndSetup();

//     await expect(
//       c.connect(minter).reportEnergy(meterId, ethers.ZeroHash, 10n, b32("D3"))
//     ).to.be.revertedWithCustomError(c, "ZeroValue");

//     await expect(
//       c.connect(minter).reportEnergy(meterId, b32("I3"), 10n, ethers.ZeroHash)
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });

//   it("reverts if whDelta is zero (ZeroValue)", async function () {
//     const { c, minter, meterId } = await deployAndSetup();

//     await expect(
//       c.connect(minter).reportEnergy(meterId, b32("I4"), 0n, b32("D4"))
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });
// });