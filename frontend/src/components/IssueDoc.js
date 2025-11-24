import { useContract } from "./ContractContext";
import { useState } from "react";
import { encodeBytes32String } from "ethers";
//import { ethers } from "ethers";

export default function IssueDoc() {
  const { contract } = useContract();
  const [hash, setHash] = useState("");
  const [uri, setUri] = useState("");

  async function issue() {
    const bytesHash = encodeBytes32String(hash);
    await contract.issueDocument(bytesHash, uri);
    alert("Document issued!");
  }

  return (
    <div>
      <input placeholder="Doc Hash" onChange={(e) => setHash(e.target.value)} />
      <input placeholder="IPFS URI" onChange={(e) => setUri(e.target.value)} />
      <button onClick={issue}>Issue Document</button>
    </div>
  );
}

