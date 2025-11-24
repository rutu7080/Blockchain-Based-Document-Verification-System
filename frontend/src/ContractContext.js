import { createContext, useContext, useEffect, useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import DocRegistryAbi from "../artifacts/contracts/DocRegistry.sol/DocRegistry.json";

const ContractContext = createContext();

export function ContractProvider({ children }) {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    async function init() {
      const provider = new JsonRpcProvider("http://127.0.0.1:8545");
      const signer = await provider.getSigner();
      const contractAddress = "PASTE_YOUR_CONTRACT_ADDRESS_HERE";
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
