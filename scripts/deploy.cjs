const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Deploying Civitas...");
    const Civitas = await ethers.getContractFactory("Civitas");
    const civitas = await Civitas.deploy();

    await civitas.waitForDeployment();
    const address = await civitas.getAddress();

    console.log(`Civitas deployed to ${address}`);

    const targetDir = path.join(__dirname, "..", "src", "artifacts", "contracts", "Civitas.sol");

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const artifact = artifacts.readArtifactSync("Civitas");

    fs.writeFileSync(
        path.join(targetDir, "Civitas.json"),
        JSON.stringify({ ...artifact, address }, null, 2)
    );
    console.log(`Artifact saved to ${path.join(targetDir, "Civitas.json")}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
