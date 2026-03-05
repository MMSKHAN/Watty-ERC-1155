// import { expect } from "chai";
// import { network } from "hardhat";

// const { ethers } = await network.connect();

// describe("WTYSettlement1155 - metadata JSON encode/decode + hash", function () {
//   it("encodes JSON to hex, hashes it, stores hash, verifies later", async function () {
//     const [, , meterOwner] = await ethers.getSigners();
//     const contract = await ethers.deployContract("WTYSettlement1155");

//     // ✅ Your real metadata (human readable)
//     const metadataObj = {
//       meterId: "MTR-7788",
//       siteId: "SITE-22",
//       capacity: "10kW",
//       lat: 31.5204,
//       long: 74.3587,
//     };

//     // 1) Convert JSON -> string
//     const metadataJson = JSON.stringify(metadataObj);

//     // 2) Convert string -> hex (this IS reversible)
//     const metadataHex = ethers.hexlify(ethers.toUtf8Bytes(metadataJson));

//     // 3) Hash the JSON bytes -> bytes32 (this is what you store in contract)
//     const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJson));

//     // meterId for contract (bytes32 id)
//     const meterId = ethers.keccak256(ethers.toUtf8Bytes(metadataObj.meterId));

//     console.log("---- METADATA (original JSON) ----");
//     console.log(metadataJson);

//     console.log("---- METADATA (hex, reversible) ----");
//     console.log(metadataHex);

//     console.log("---- METADATA (hash bytes32, NOT reversible) ----");
//     console.log(metadataHash);

//     // ✅ Register meter storing only the hash
//     await expect(contract.registerMeter(meterId, meterOwner.address, metadataHash))
//       .to.emit(contract, "MeterRegistered")
//       .withArgs(meterId, meterOwner.address, metadataHash);

//     // 4) Read stored hash from contract
//     const stored = await contract.meters(meterId);
//     console.log("Stored metadataHash on-chain:", stored.metadataHash);

//     // 5) "Reverse" (decode) ONLY works from metadataHex, not from metadataHash
//     const decodedJson = ethers.toUtf8String(ethers.getBytes(metadataHex));
//     console.log("---- DECODED back from hex ----");
//     console.log(decodedJson);

//     const decodedObj = JSON.parse(decodedJson);
//     console.log("Decoded object:", decodedObj);

//     // 6) Verify integrity: hash(decodedJson) must equal on-chain hash
//     const recomputedHash = ethers.keccak256(ethers.toUtf8Bytes(decodedJson));
//     expect(recomputedHash).to.equal(stored.metadataHash);
//   });
// });