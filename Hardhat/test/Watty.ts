import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("WTYSettlement1155 - Grand Test (all functions)", function () {
  const b32 = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

  async function deploy() {
    const [admin, minter, pauser, auditor, user, other] = await ethers.getSigners();
    // const c = await ethers.deployContract("WTYSettlement1155");
    const c = await ethers.deployContract("contracts/Watty.sol:WTYSettlement1155");
    return { c, admin, minter, pauser, auditor, user, other };
  }

  describe("Admin + role setters", function () {
    it("admin is deployer; only admin can set roles; can change admin", async function () {
      const { c, admin, minter, pauser, auditor, other } = await deploy();

      // deployer is admin
      expect(await c.admin()).to.equal(admin.address);

      // only admin can set roles
      await expect(c.connect(other).setMinter(minter.address, true)).to.be.revertedWithCustomError(
        c,
        "NotAdmin"
      );
      await expect(c.connect(other).setPauser(pauser.address, true)).to.be.revertedWithCustomError(
        c,
        "NotAdmin"
      );
      await expect(c.connect(other).setAuditor(auditor.address, true)).to.be.revertedWithCustomError(
        c,
        "NotAdmin"
      );

      // admin sets roles
      await c.connect(admin).setMinter(minter.address, true);
      await c.connect(admin).setPauser(pauser.address, true);
      await c.connect(admin).setAuditor(auditor.address, true);

      expect(await c.isMinter(minter.address)).to.equal(true);
      expect(await c.isPauser(pauser.address)).to.equal(true);
      expect(await c.isAuditor(auditor.address)).to.equal(true);

      // setAdmin: rejects zero
      await expect(c.connect(admin).setAdmin(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        c,
        "ZeroAddress"
      );

      // change admin
      await c.connect(admin).setAdmin(other.address);
      expect(await c.admin()).to.equal(other.address);

      // old admin cannot set roles now
      await expect(c.connect(admin).setMinter(minter.address, false)).to.be.revertedWithCustomError(
        c,
        "NotAdmin"
      );

      // new admin can
      await c.connect(other).setMinter(minter.address, false);
      expect(await c.isMinter(minter.address)).to.equal(false);
    });
  });

  describe("registerMeter", function () {
    it("registers meter; emits; prevents duplicate; validates inputs", async function () {
      const { c, admin, user, other } = await deploy();

      const meterId = b32("METER-001");
      const metadataHash = b32("META-001");

      // only admin
      await expect(
        c.connect(other).registerMeter(meterId, user.address, metadataHash)
      ).to.be.revertedWithCustomError(c, "NotAdmin");

      // input validation
      await expect(
        c.connect(admin).registerMeter(ethers.ZeroHash, user.address, metadataHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(admin).registerMeter(meterId, ethers.ZeroAddress, metadataHash)
      ).to.be.revertedWithCustomError(c, "ZeroAddress");

      await expect(
        c.connect(admin).registerMeter(meterId, user.address, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      // success
      await expect(c.connect(admin).registerMeter(meterId, user.address, metadataHash))
        .to.emit(c, "MeterRegistered")
        .withArgs(meterId, user.address, metadataHash);

      const stored = await c.meters(meterId);
      expect(stored.owner).to.equal(user.address);
      expect(stored.metadataHash).to.equal(metadataHash);

      // duplicate
      await expect(
        c.connect(admin).registerMeter(meterId, user.address, metadataHash)
      ).to.be.revertedWithCustomError(c, "MeterAlreadyRegistered");
    });
  });

  describe("reportEnergy", function () {
    it("minter can report; validates minter, meter, and inputs", async function () {
      const { c, admin, minter, user, other } = await deploy();

      // make minter
      await c.connect(admin).setMinter(minter.address, true);

      const meterId = b32("METER-ENERGY");
      const metadataHash = b32("META-ENERGY");
      await c.connect(admin).registerMeter(meterId, user.address, metadataHash);

      const intervalId = b32("2026-03-02T00:00Z/15m");
      const whDelta = 1500n;
      const dataHash = b32("DATA-HASH-1");

      await expect(c.connect(minter).reportEnergy(meterId, intervalId, whDelta, dataHash))
        .to.emit(c, "EnergyReported")
        .withArgs(meterId, intervalId, whDelta, dataHash);

      // not minter
      await expect(
        c.connect(other).reportEnergy(meterId, intervalId, whDelta, dataHash)
      ).to.be.revertedWithCustomError(c, "NotMinter");

      // meter not registered
      await expect(
        c.connect(minter).reportEnergy(b32("UNKNOWN"), intervalId, whDelta, dataHash)
      ).to.be.revertedWithCustomError(c, "MeterNotRegistered");

      // zero inputs
      await expect(
        c.connect(minter).reportEnergy(meterId, ethers.ZeroHash, whDelta, dataHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).reportEnergy(meterId, intervalId, 0n, dataHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).reportEnergy(meterId, intervalId, whDelta, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");
    });
  });

  describe("mintCredits", function () {
    it("minter can mint; updates ERC1155 balance; validates inputs", async function () {
      const { c, admin, minter, user } = await deploy();

      await c.connect(admin).setMinter(minter.address, true);

      const meterId = b32("METER-MINT");
      const metadataHash = b32("META-MINT");
      await c.connect(admin).registerMeter(meterId, user.address, metadataHash);

      const tokenId = 1n;
      const amount = 100n;
      const ref = b32("MINT-REF-1");

      await expect(c.connect(minter).mintCredits(meterId, user.address, tokenId, amount, ref))
        .to.emit(c, "CreditsMinted")
        .withArgs(meterId, user.address, amount, ref);

      expect(await c.balanceOf(user.address, tokenId)).to.equal(amount);

      // zero amount / zero ref / zero to
      await expect(
        c.connect(minter).mintCredits(meterId, user.address, tokenId, 0n, ref)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).mintCredits(meterId, user.address, tokenId, amount, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).mintCredits(meterId, ethers.ZeroAddress, tokenId, amount, ref)
      ).to.be.revertedWithCustomError(c, "ZeroAddress");

      // meter not registered
      await expect(
        c.connect(minter).mintCredits(b32("UNKNOWN"), user.address, tokenId, amount, ref)
      ).to.be.revertedWithCustomError(c, "MeterNotRegistered");
    });
  });

  describe("burnCredits", function () {
    it("holder can burn; minter can burn from others; validates NotAllowed and inputs", async function () {
      const { c, admin, minter, user, other } = await deploy();

      await c.connect(admin).setMinter(minter.address, true);

      const meterId = b32("METER-BURN");
      const metadataHash = b32("META-BURN");
      await c.connect(admin).registerMeter(meterId, user.address, metadataHash);

      const tokenId = 7n;
      const mintAmount = 100n;
      await c.connect(minter).mintCredits(meterId, user.address, tokenId, mintAmount, b32("MINT-REF"));

      // user burns own
      const burn1 = 40n;
      const ref1 = b32("BURN-REF-1");
      await expect(c.connect(user).burnCredits(user.address, tokenId, burn1, ref1))
        .to.emit(c, "CreditsBurned")
        .withArgs(user.address, burn1, ref1);

      expect(await c.balanceOf(user.address, tokenId)).to.equal(mintAmount - burn1);

      // minter burns from user
      const burn2 = 10n;
      const ref2 = b32("BURN-REF-2");
      await expect(c.connect(minter).burnCredits(user.address, tokenId, burn2, ref2))
        .to.emit(c, "CreditsBurned")
        .withArgs(user.address, burn2, ref2);

      expect(await c.balanceOf(user.address, tokenId)).to.equal(mintAmount - burn1 - burn2);

      // random other cannot burn from user
      await expect(
        c.connect(other).burnCredits(user.address, tokenId, 1n, b32("BURN-REF-FAIL"))
      ).to.be.revertedWithCustomError(c, "NotAllowed");

      // input validation
      await expect(
        c.connect(user).burnCredits(ethers.ZeroAddress, tokenId, 1n, b32("X"))
      ).to.be.revertedWithCustomError(c, "ZeroAddress");

      await expect(
        c.connect(user).burnCredits(user.address, tokenId, 0n, b32("X"))
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(user).burnCredits(user.address, tokenId, 1n, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");
    });
  });

  describe("finalizeSettlement", function () {
    it("minter can finalize; validates inputs and NotMinter", async function () {
      const { c, admin, minter, other } = await deploy();

      await c.connect(admin).setMinter(minter.address, true);

      const siteId = b32("SITE-22");
      const period = b32("2026-03");
      const totalWh = 500_000n;
      const totalTokens = 500n;
      const proofHash = b32("PROOF-1");

      await expect(c.connect(minter).finalizeSettlement(siteId, period, totalWh, totalTokens, proofHash))
        .to.emit(c, "SettlementFinalized")
        .withArgs(siteId, period, totalWh, totalTokens, proofHash);

      // not minter
      await expect(
        c.connect(other).finalizeSettlement(siteId, period, totalWh, totalTokens, proofHash)
      ).to.be.revertedWithCustomError(c, "NotMinter");

      // zero checks
      await expect(
        c.connect(minter).finalizeSettlement(ethers.ZeroHash, period, totalWh, totalTokens, proofHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).finalizeSettlement(siteId, ethers.ZeroHash, totalWh, totalTokens, proofHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).finalizeSettlement(siteId, period, 0n, totalTokens, proofHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).finalizeSettlement(siteId, period, totalWh, 0n, proofHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");

      await expect(
        c.connect(minter).finalizeSettlement(siteId, period, totalWh, totalTokens, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(c, "ZeroValue");
    });
  });

  describe("End-to-end happy path", function () {
    it("register → report → mint → burn → finalize (and prints events)", async function () {
      const { c, admin, minter, user } = await deploy();

      await c.connect(admin).setMinter(minter.address, true);

      const meterId = b32("METER-E2E");
      const metadataHash = b32("META-E2E");

      const intervalId = b32("E2E-INTERVAL-1");
      const dataHash = b32("E2E-DATA-1");
      const whDelta = 2500n;

      const tokenId = 1n;
      const mintAmount = 50n;
      const mintRef = b32("E2E-MINT-REF");

      const burnAmount = 20n;
      const burnRef = b32("E2E-BURN-REF");

      const siteId = b32("SITE-E2E");
      const period = b32("2026-03");
      const proofHash = b32("E2E-PROOF");
      const totalWh = 2500n;
      const totalTokens = 30n;

      // register
      await expect(c.registerMeter(meterId, user.address, metadataHash))
        .to.emit(c, "MeterRegistered");

      // report
      await expect(c.connect(minter).reportEnergy(meterId, intervalId, whDelta, dataHash))
        .to.emit(c, "EnergyReported");

      // mint
      await expect(c.connect(minter).mintCredits(meterId, user.address, tokenId, mintAmount, mintRef))
        .to.emit(c, "CreditsMinted");

      // burn by user
      await expect(c.connect(user).burnCredits(user.address, tokenId, burnAmount, burnRef))
        .to.emit(c, "CreditsBurned");

      expect(await c.balanceOf(user.address, tokenId)).to.equal(mintAmount - burnAmount);

      // finalize
      await expect(c.connect(minter).finalizeSettlement(siteId, period, totalWh, totalTokens, proofHash))
        .to.emit(c, "SettlementFinalized");

      // Optional: query & print all events from this contract
      const fromBlock = 0;
      const toBlock: any = "latest";

      const meterEvents = await c.queryFilter(c.filters.MeterRegistered(), fromBlock, toBlock);
      const energyEvents = await c.queryFilter(c.filters.EnergyReported(), fromBlock, toBlock);
      const mintEvents = await c.queryFilter(c.filters.CreditsMinted(), fromBlock, toBlock);
      const burnEvents = await c.queryFilter(c.filters.CreditsBurned(), fromBlock, toBlock);
      const settleEvents = await c.queryFilter(c.filters.SettlementFinalized(), fromBlock, toBlock);

      console.log("---- EVENTS (E2E) ----");
      for (const e of meterEvents) console.log("MeterRegistered:", e.args);
      for (const e of energyEvents) console.log("EnergyReported  :", e.args);
      for (const e of mintEvents) console.log("CreditsMinted   :", e.args);
      for (const e of burnEvents) console.log("CreditsBurned   :", e.args);
      for (const e of settleEvents) console.log("SettlementFinalized:", e.args);
      console.log("----------------------");
    });
  });
});