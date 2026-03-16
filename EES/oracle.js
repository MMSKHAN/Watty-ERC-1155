const express = require("express");
const { ethers } = require("ethers");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

/* ---------------- IDENTITY STORAGE ---------------- */

const processedIntervals = new Set();

/* ---------------- ETH CONNECTION ---------------- */

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const wallet = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
);

/* ---------------- CONTRACT ---------------- */

const artifact = require("./abi.json");
const abi = artifact.abi;

const contract = new ethers.Contract(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi,
    wallet
);

/* ---------------- METER CONFIG ---------------- */

const METER_ID = ethers.encodeBytes32String("meter-1");

const metadataHash = ethers.keccak256(
    ethers.toUtf8Bytes("meter metadata")
);

/* ---------------- SET MINTER ---------------- */

async function ensureMinter() {

    try {

        console.log("Setting oracle as minter...");

        const tx = await contract.setMinter(wallet.address, true);

        await tx.wait();

        console.log("Oracle is now a minter");

    } catch (err) {

        console.log("Minter already set");

    }

}

/* ---------------- REGISTER METER ---------------- */

async function registerMeter() {

    try {

        console.log("Registering meter...");

        const tx = await contract.registerMeter(
            METER_ID,
            wallet.address,
            metadataHash
        );

        await tx.wait();

        console.log("Meter registered");

    } catch (err) {

        console.log("Meter already registered");

    }

}

/* ---------------- ENERGY EVENT API ---------------- */

app.post("/energy", async (req, res) => {

    const { meterId, intervalId, whDelta, dataHash } = req.body;

    const key = meterId + "-" + intervalId;

    /* ---------- IDEMPOTENCY ---------- */

    if (processedIntervals.has(key)) {

        // console.log("Duplicate interval ignored");

        // return res.json({ status: "duplicate interval ignored" });

    }

    /* ---------- MONOTONIC CHECK ---------- */

    if (whDelta <= 0) {

        return res.status(400).json({ error: "invalid delta" });

    }

    /* ---------- PLAUSIBLE RANGE ---------- */

    if (whDelta > 100000) {

        return res.status(400).json({ error: "delta too large" });

    }

    try {

        console.log("Minting credits...");

        const tx = await contract.mintCredits(
            meterId,
            wallet.address,
            1,
            whDelta,
            dataHash
        );

        await tx.wait();

        processedIntervals.add(key);

        console.log("Mint success:", tx.hash);

        res.json({
            status: "minted",
            txHash: tx.hash
        });

    } catch (err) {

        console.error("Mint failed:", err);

        res.status(500).json({ error: "transaction failed" });

    }

});

/* ---------------- START SERVER ---------------- */

app.listen(4000, async () => {

    console.log("Oracle service running on port 4000");

    await ensureMinter();

    await registerMeter();

});