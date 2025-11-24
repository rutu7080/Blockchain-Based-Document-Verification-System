require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: "./contracts",   // <-- optional but ensures contracts folder is used
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
