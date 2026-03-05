// import { expect } from "chai";
// import { network } from "hardhat";

// const { ethers } = await network.connect();

// describe("WTYSettlement1155 - burnCredits", function () {
//   const b32 = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

//   async function deployAndMint() {
//     const [admin, minter, user, other] = await ethers.getSigners();
//     const c = await ethers.deployContract("WTYSettlement1155");

//     // make minter
//     await c.setMinter(minter.address, true);

//     // register meter (needed for mintCredits)
//     const meterId = b32("METER-BURN-1");
//     const metadataHash = b32("META-BURN-1");
//     await c.registerMeter(meterId, user.address, metadataHash);

//     // mint some credits to user
//     const tokenId = 7n;
//     const amount = 100n;
//     const refMint = b32("MINT-REF-BURN-1");

//     await c.connect(minter).mintCredits(meterId, user.address, tokenId, amount, refMint);

//     return { c, admin, minter, user, other, tokenId, amount };
//   }

//   it("allows token holder to burn their own credits", async function () {
//     const { c, user, tokenId, amount } = await deployAndMint();

//     const burnAmount = 40n;
//     const refBurn = b32("BURN-REF-1");

//     await expect(c.connect(user).burnCredits(user.address, tokenId, burnAmount, refBurn))
//       .to.emit(c, "CreditsBurned")
//       .withArgs(user.address, burnAmount, refBurn);

//     const bal = await c.balanceOf(user.address, tokenId);
//     expect(bal).to.equal(amount - burnAmount);
//   });

//   it("allows minter to burn credits from another address", async function () {
//     const { c, minter, user, tokenId, amount } = await deployAndMint();

//     const burnAmount = 25n;
//     const refBurn = b32("BURN-REF-2");

//     await expect(c.connect(minter).burnCredits(user.address, tokenId, burnAmount, refBurn))
//       .to.emit(c, "CreditsBurned")
//       .withArgs(user.address, burnAmount, refBurn);

//     const bal = await c.balanceOf(user.address, tokenId);
//     expect(bal).to.equal(amount - burnAmount);
//   });

//   it("reverts if caller is neither token holder nor minter (NotAllowed)", async function () {
//     const { c, other, user, tokenId } = await deployAndMint();

//     await expect(
//       c.connect(other).burnCredits(user.address, tokenId, 1n, b32("BURN-REF-FAIL"))
//     ).to.be.revertedWithCustomError(c, "NotAllowed");
//   });

//   it("reverts if from is zero address (ZeroAddress)", async function () {
//     const { c, minter, tokenId } = await deployAndMint();

//     await expect(
//       c.connect(minter).burnCredits(ethers.ZeroAddress, tokenId, 1n, b32("BURN-REF-ZERO"))
//     ).to.be.revertedWithCustomError(c, "ZeroAddress");
//   });

//   it("reverts if amount is zero (ZeroValue)", async function () {
//     const { c, user, tokenId } = await deployAndMint();

//     await expect(
//       c.connect(user).burnCredits(user.address, tokenId, 0n, b32("BURN-REF-ZEROAMOUNT"))
//     ).to.be.revertedWithCustomError(c, "ZeroValue");
//   });

//   it("reverts if ref is zero (ZeroValue)", async function () {
//     const { c, user, tokenId } = await deployAndMint();

//     await expect(c.connect(user).burnCredits(user.address, tokenId, 1n, ethers.ZeroHash))
//       .to.be.revertedWithCustomError(c, "ZeroValue");
//   });
// });