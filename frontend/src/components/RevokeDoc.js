import { useContract } from "./ContractContext";
import { useState } from "react";
import { encodeBytes32String } from "ethers";
//import { ethers } from "ethers";

export default function RevokeDoc() {
  const { contract } = useContract();
  const [hash, setHash] = useState("");

  async function revoke() {
    const bytesHash = encodeBytes32String(hash);
    await contract.revokeDocument(bytesHash);
    alert("Document revoked!");
  }

  return (
    <div>
      <input placeholder="Doc Hash" onChange={(e) => setHash(e.target.value)} />
      <button onClick={revoke}>Revoke Document</button>
    </div>
  );
}

