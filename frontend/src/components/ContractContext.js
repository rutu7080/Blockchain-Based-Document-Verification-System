import { createContext, useContext, useEffect, useState } from "react";
//import { ethers } from "ethers";
import { JsonRpcProvider, Contract } from "ethers";
import DocRegistryAbi from "../artifacts/contracts/DocRegistry.sol/DocRegistry.json";

const ContractContext = createContext();

export function ContractProvider({ children }) {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    async function init() {
      const provider = new JsonRpcProvider("http://127.0.0.1:8545");
      const signer = provider.getSigner(0);
      const contractAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
      const contract = new Contract(contractAddress, DocRegistryAbi.abi, signer);

      setContract(contract);
      setSigner(signer);
    }
    init();
  }, []);

  return (
    <ContractContext.Provider value={{ contract, signer }}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  return useContext(ContractContext);
}
