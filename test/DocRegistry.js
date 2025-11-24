const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocRegistry", function () {
  it("Should deploy the contract", async function () {
    const [owner] = await ethers.getSigners();
    const DocRegistry = await ethers.getContractFactory("DocRegistry");
    const registry = await DocRegistry.deploy(owner.address);

    // Ethers v6 → use waitForDeployment instead of deployed
    await registry.waitForDeployment();

    const adminRole = await registry.DEFAULT_ADMIN_ROLE();
    expect(await registry.hasRole(adminRole, owner.address)).to.be.true;
  });
});
