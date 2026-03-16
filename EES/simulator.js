const axios = require("axios");
const { ethers } = require("ethers");

const METER_ID = ethers.encodeBytes32String("meter-1");

function generateReading() {

    const delta = Math.floor(Math.random() * 50) + 10;

    const event = {
        meterId: METER_ID,
        intervalId: Math.floor(Date.now() / 60000),
        whDelta: delta,
        dataHash: ethers.keccak256(
            ethers.toUtf8Bytes("energy-proof")
        )
    };

    console.log("Sending energy event:", event);

    axios.post("http://localhost:4000/energy", event)
        .catch(err => console.log(err.message));
}

setInterval(generateReading, 5000);