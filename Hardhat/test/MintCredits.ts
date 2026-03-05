// import { expect } from "chai";
// import { network } from "hardhat";

// const { ethers } = await network.connect();

// describe("WTYSettlement1155 - mintCredits", function () {

//   function b32(text: string) {
//     return ethers.keccak256(ethers.toUtf8Bytes(text));
//   }

//   it("mints credits successfully by minter", async function () {
//     const [admin, minter, user] = await ethers.getSigners();

//     const contract = await ethers.deployContract("WTYSettlement1155");

//     // Admin sets minter
//     await contract.setMinter(minter.address, true);

//     // Register meter first (required)
//     const meterId = b32("METER-100");
//     const metadataHash = b32("META-100");

//     await contract.registerMeter(meterId, user.address, metadataHash);

//     const tokenId = 1n;
//     const amount = 100n;
//     const ref = b32("MINT-REF-001");

//     // Mint from minter account
//     await expect(
//       contract.connect(minter).mintCredits(
//         meterId,
//         user.address,
//         tokenId,
//         amount,
//         ref
//       )
//     )
//       .to.emit(contract, "CreditsMinted")
//       .withArgs(meterId, user.address, amount, ref);

//     // Verify ERC1155 balance
//     const balance = await contract.balanceOf(user.address, tokenId);
//     expect(balance).to.equal(amount);
//   });

//   it("reverts if caller is not minter", async function () {
//     const [admin, , user] = await ethers.getSigners();

//     const contract = await ethers.deployContract("WTYSettlement1155");

//     const meterId = b32("METER-200");
//     const metadataHash = b32("META-200");

//     await contract.registerMeter(meterId, user.address, metadataHash);

//     await expect(
//       contract.mintCredits(
//         meterId,
//         user.address,
//         1n,
//         50n,
//         b32("REF-FAIL")
//       )
//     ).to.be.revertedWithCustomError(contract, "NotMinter");
//   });

//   it("reverts if meter not registered", async function () {
//     const [admin, minter, user] = await ethers.getSigners();

//     const contract = await ethers.deployContract("WTYSettlement1155");

//     await contract.setMinter(minter.address, true);

//     await expect(
//       contract.connect(minter).mintCredits(
//         b32("UNKNOWN-METER"),
//         user.address,
//         1n,
//         10n,
//         b32("REF-FAIL")
//       )
//     ).to.be.revertedWithCustomError(contract, "MeterNotRegistered");
//   });

//   it("reverts if amount is zero", async function () {
//     const [admin, minter, user] = await ethers.getSigners();

//     const contract = await ethers.deployContract("WTYSettlement1155");

//     await contract.setMinter(minter.address, true);

//     const meterId = b32("METER-300");
//     const metadataHash = b32("META-300");

//     await contract.registerMeter(meterId, user.address, metadataHash);

//     await expect(
//       contract.connect(minter).mintCredits(
//         meterId,
//         user.address,
//         1n,
//         0n,
//         b32("REF-FAIL")
//       )
//     ).to.be.revertedWithCustomError(contract, "ZeroValue");
//   });

// });