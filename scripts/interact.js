const hre = require("hardhat");

async function main() {
  const [admin, issuer] = await hre.ethers.getSigners();

  // 1️⃣ Deploy the DocRegistry contract
  const DocRegistry = await hre.ethers.getContractFactory("DocRegistry");
  const contract = await DocRegistry.deploy(admin.address);
  //await contract.deployed();
  await contract.waitForDeployment();
  console.log("✅ Contract deployed at:", contract.address);

  // 2️⃣ Grant ISSUER_ROLE to the issuer
  const ISSUER_ROLE = await contract.ISSUER_ROLE();
  await contract.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
  console.log("✅ Issuer role granted to:", issuer.address);

  // 3️⃣ Issue a document
  //const hash = hre.ethers.utils.formatBytes32String("doc1");
  const hash = ethers.encodeBytes32String("doc1");
  const uri = "ipfs://example";
  await contract.connect(issuer).issueDocument(hash, uri);
  console.log("✅ Document issued:", hash, uri);

  // 4️⃣ Check document status
  let doc = await contract.getDocument(hash);
  console.log("Document status after issuing:", doc);

  // 5️⃣ Revoke the document
  await contract.connect(issuer).revokeDocument(hash);
  console.log("✅ Document revoked:", hash);

  // 6️⃣ Check document status again
  doc = await contract.getDocument(hash);
  console.log("Document status after revoking:", doc);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
