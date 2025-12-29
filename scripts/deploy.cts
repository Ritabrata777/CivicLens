import { ethers, artifacts } from "hardhat";
import "@nomicfoundation/hardhat-toolbox";

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;

    const Civitas = await ethers.getContractFactory("Civitas");
    const civitas = await Civitas.deploy();

    await civitas.waitForDeployment();
    const address = await civitas.getAddress();

    console.log(`Civitas deployed to ${address}`);

    // Save content to file
    const fs = require("fs");
    const path = require("path");
    const artifact = artifacts.readArtifactSync("Civitas");

    // We want to save it to src/artifacts/Civitas.json
    // But ensure directory exists
    const contractsDir = path.join(__dirname, "..", "src", "artifacts");
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(contractsDir, "Civitas.json"),
        JSON.stringify({ ...artifact, address }, null, 2)
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
