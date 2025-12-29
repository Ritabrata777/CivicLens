const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Civitas Admin Flow", function () {
    let Civitas, civitas, owner, admin1, user1;

    beforeEach(async function () {
        [owner, admin1, user1] = await ethers.getSigners();
        Civitas = await ethers.getContractFactory("Civitas");
        civitas = await Civitas.deploy();
        await civitas.waitForDeployment();
    });

    it("Should allow owner to add admin", async function () {
        await civitas.addAdmin(admin1.address);
        expect(await civitas.isAdmin(admin1.address)).to.be.true;
    });

    it("Should allow admin to set name once", async function () {
        await civitas.addAdmin(admin1.address);

        await civitas.connect(admin1).setAdminName("Alice");
        expect(await civitas.adminNames(admin1.address)).to.equal("Alice");

        await expect(
            civitas.connect(admin1).setAdminName("Bob")
        ).to.be.revertedWith("Name already set");
    });

    it("Should distribute rewards", async function () {
        await civitas.addAdmin(admin1.address);

        await civitas.connect(admin1).distributeReward(user1.address, 100);
        expect(await civitas.rewards(user1.address)).to.equal(100);
    });

    it("Should prevent non-admin from distributing rewards", async function () {
        await expect(
            civitas.connect(user1).distributeReward(user1.address, 100)
        ).to.be.revertedWith("Caller is not an admin");
    });
});
