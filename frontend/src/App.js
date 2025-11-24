import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import DocRegistry from "./artifacts/contracts/DocRegistry.sol/DocRegistry.json";
import "./App.css";

// UPDATE THIS with your NEW deployed contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // REPLACE WITH YOUR NEW ADDRESS
const localProviderUrl = "http://127.0.0.1:8545";

function App() {
  const [step, setStep] = useState("selectRole");
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [file, setFile] = useState(null);
  const [fileHash32, setFileHash32] = useState("");
  const [fetchedDoc, setFetchedDoc] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roleStatus, setRoleStatus] = useState(null);

  const provider = new ethers.JsonRpcProvider(localProviderUrl);

  useEffect(() => {
    if (signer) {
      const c = new ethers.Contract(contractAddress, DocRegistry.abi, signer);
      setContract(c);
      signer.getAddress().then(async (addr) => {
        setAccount(addr);
        // Check user's roles
        try {
          if (c.isAdmin && c.isIssuer) {
            const isAdmin = await c.isAdmin(addr);
            const isIssuer = await c.isIssuer(addr);
            setRoleStatus({ isAdmin, isIssuer });
            console.log("✅ Role check successful:", { isAdmin, isIssuer });
          } else {
            console.log("❌ Role check functions not available - using older contract version");
            setRoleStatus({ isAdmin: false, isIssuer: true });
          }
        } catch (err) {
          console.error("Error checking roles:", err);
          setRoleStatus({ isAdmin: false, isIssuer: true });
        }
      });
    } else {
      const c = new ethers.Contract(contractAddress, DocRegistry.abi, provider);
      setContract(c);
      setAccount(null);
      setRoleStatus(null);
    }
  }, [signer]);

  async function switchToHardhatNetwork() {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7A69',
              chainName: 'Hardhat Localhost',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found in your browser.");
      return;
    }
    try {
      await switchToHardhatNetwork();
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const walletProvider = new ethers.BrowserProvider(window.ethereum);
      const walletSigner = await walletProvider.getSigner();
      setSigner(walletSigner);
      setStep("options");
      setError(null);
    } catch (err) {
      setError("Wallet connection failed or rejected.");
    }
  }

  async function checkRoles() {
    if (!contract || !account) return;
    
    try {
      let roleInfo = "🔍 Role Check Results:\n\nAccount: " + account + "\n";
      
      if (contract.isAdmin && contract.isIssuer) {
        const isAdmin = await contract.isAdmin(account);
        const isIssuer = await contract.isIssuer(account);
        roleInfo += "Is Admin: " + (isAdmin ? "✅" : "❌") + "\n";
        roleInfo += "Is Issuer: " + (isIssuer ? "✅" : "❌") + "\n";
        roleInfo += "\n✅ Contract functions are available!";
        
        if (fileHash32 && contract.hasDocument) {
          const hasDoc = await contract.hasDocument(fileHash32);
          roleInfo += "\nDocument exists: " + (hasDoc ? "✅" : "❌");
        }
      } else {
        roleInfo += "⚠️ Using older contract version - role check functions not available\n\n";
        roleInfo += "Solution: Deploy updated contract and update contract address in React app.";
      }
      
      alert(roleInfo);
    } catch (err) {
      console.error("Role check failed:", err);
      setError("Role check failed: " + err.message);
    }
  }

  async function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    try {
      setFile(selectedFile);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setFileHash32("0x" + hashHex.slice(0, 64));
      console.log("File hash calculated:", "0x" + hashHex.slice(0, 64));
      setError(null);
      setFetchedDoc(null);
    } catch (err) {
      setError("Error processing file: " + err.message);
    }
  }

  async function issueDocument() {
    if (!file || !fileHash32) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log("Issuing document:", fileHash32, file.name);
      const tx = await contract.issueDocument(fileHash32, file.name);
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      alert(`✅ Document Issued Successfully!\n\nFile: ${file.name}\nHash: ${fileHash32}\nTransaction: ${tx.hash}\nBlock: ${receipt.blockNumber}`);
    } catch (err) {
      console.error("Issue failed:", err);
      if (err.message.includes("Already issued")) {
        alert(`✅ Document Already Exists!\n\nFile: ${file.name}\nThis document was already issued. Use 'Verify Document' to check its status.`);
      } else {
        setError("Issue failed: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function revokeDocument() {
    if (!fileHash32) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.revokeDocument(fileHash32);
      await tx.wait();
      alert(`✅ Document Revoked!\n\nFile: ${file.name}\nHash: ${fileHash32}`);
    } catch (err) {
      console.error("Revoke failed:", err);
      setError("Revoke failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function viewDocument() {
    if (!fileHash32) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchedDoc(null);
    
    try {
      const [issuer, ipfsUri, issuedAt, revoked] = await contract.getDocument(fileHash32);
      const issuedAtNumber = Number(issuedAt);
      
      if (issuer === "0x0000000000000000000000000000000000000000") {
        setError(`❌ Document Not Found\n\nThis document has not been issued by any authorized issuer.\n\nFile: ${file.name}\nHash: ${fileHash32.slice(0, 16)}...${fileHash32.slice(-16)}\n\nTo issue this document, use the 'Issuer' role.`);
        return;
      }
      
      setFetchedDoc({
        issuer,
        ipfsUri,
        issuedAt: issuedAtNumber === 0 ? "Unknown" : new Date(issuedAtNumber * 1000).toLocaleString(),
        revoked,
      });
    } catch (err) {
      console.error("View failed:", err);
      setError("View failed: " + err.message);
      setFetchedDoc(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyFile() {
    if (!file) {
      setError("Please select a file to verify");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      const hash32 = "0x" + hashHex.slice(0, 64);

      console.log("Verifying hash:", hash32);

      const readOnlyContract = new ethers.Contract(contractAddress, DocRegistry.abi, provider);
      const [issuer, ipfsUri, issuedAt, revoked] = await readOnlyContract.getDocument(hash32);
      
      console.log("Verification result:", { issuer, ipfsUri, issuedAt: issuedAt.toString(), revoked });

      if (issuer === "0x0000000000000000000000000000000000000000") {
        alert(`❌ DOCUMENT NOT FOUND\n\nFile: ${file.name}\nHash: ${hash32}\n\nThis document was not issued or doesn't exist in the blockchain.`);
      } else {
        const issuedAtNumber = Number(issuedAt);
        const issuedDate = issuedAtNumber === 0 ? "Unknown" : new Date(issuedAtNumber * 1000).toLocaleString();
        const status = revoked ? "❌ REVOKED" : "✅ VALID";
        
        alert(`✅ DOCUMENT VERIFIED!\n\nFile: ${file.name}\nStatus: ${status}\nIssuer: ${issuer}\nOriginal Name: ${ipfsUri}\nIssued: ${issuedDate}\nHash: ${hash32}`);
      }
    } catch (err) {
      console.error("Verify failed:", err);
      setError("Verify failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "selectRole") {
    return (
      <div style={{ textAlign: "center", marginTop: 50, padding: "20px" }}>
        <h1>🔐 Blockchain Document Verification System</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>Secure, immutable document verification on the blockchain</p>
        
        <h3>Select your role:</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
          <button onClick={() => { setRole("issuer"); setStep("connect"); }} style={{ margin: "10px", padding: "15px 25px", fontSize: "16px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", minWidth: "120px" }}>
            📝 Issuer<div style={{ fontSize: "12px", marginTop: "5px" }}>Issue & manage documents</div>
          </button>
          <button onClick={() => { setRole("user"); setStep("connect"); }} style={{ margin: "10px", padding: "15px 25px", fontSize: "16px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", minWidth: "120px" }}>
            👤 User<div style={{ fontSize: "12px", marginTop: "5px" }}>View document details</div>
          </button>
          <button onClick={() => { setRole("verifier"); setStep("connect"); }} style={{ margin: "10px", padding: "15px 25px", fontSize: "16px", backgroundColor: "#FF9800", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", minWidth: "120px" }}>
            🔍 Verifier<div style={{ fontSize: "12px", marginTop: "5px" }}>Verify document authenticity</div>
          </button>
        </div>
      </div>
    );
  }

  if (step === "connect") {
    return (
      <div style={{ textAlign: "center", marginTop: 50, padding: "20px" }}>
        <h2>Connect Wallet (Role: {role})</h2>
        {account ? (
          <div>
            <p style={{ color: "#4CAF50" }}>✅ Connected as: <code>{account}</code></p>
            {roleStatus && (
              <div style={{ backgroundColor: "#f0f8ff", padding: "10px", borderRadius: "5px", margin: "10px 0" }}>
                <p><strong>Your Roles:</strong> Admin: {roleStatus.isAdmin ? "✅" : "❌"} | Issuer: {roleStatus.isIssuer ? "✅" : "❌"}</p>
              </div>
            )}
          </div>
        ) : (
          <button onClick={connectWallet} style={{ padding: "12px 24px", fontSize: "16px", margin: "20px", backgroundColor: "#FF6B35", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            🦊 Connect MetaMask Wallet
          </button>
        )}
        <br />
        <button onClick={() => setStep("selectRole")} style={{ padding: "8px 16px", fontSize: "14px", backgroundColor: "#607D8B", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          ← Back to Role Selection
        </button>
      </div>
    );
  }

  if (step === "options") {
    return (
      <div style={{ textAlign: "center", marginTop: 20, padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>🔐 Document Verification System</h2>
        <p><strong>Contract:</strong> <code>{contractAddress}</code></p>
        <p><strong>Account:</strong> <code>{account ? `${account.slice(0,8)}...${account.slice(-6)}` : "Not connected"}</code></p>
        <p><strong>Role:</strong> <span style={{ backgroundColor: role === "issuer" ? "#4CAF50" : role === "user" ? "#2196F3" : "#FF9800", color: "white", padding: "4px 8px", borderRadius: "4px" }}>{role}</span></p>

        <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "10px", margin: "20px 0" }}>
          <h3>📁 File Selection</h3>
          <input type="file" onChange={handleFileChange} disabled={isLoading} style={{ margin: "10px", padding: "8px", border: "2px dashed #ccc", borderRadius: "5px", width: "300px" }} />
          <p style={{ wordBreak: "break-all", fontSize: "12px", color: "#666" }}>
            <strong>Document Hash:</strong><br/>{fileHash32 ? `${fileHash32.slice(0,16)}...${fileHash32.slice(-16)}` : "No file selected"}
          </p>
        </div>

        {error && (
          <div style={{ color: error.includes("✅") ? "#2e7d32" : "#d32f2f", backgroundColor: error.includes("✅") ? "#e8f5e8" : "#ffebee", padding: "15px", borderRadius: "8px", margin: "10px 0", whiteSpace: "pre-line", textAlign: "left" }}>
            <strong>{error.includes("✅") ? "✅ Success:" : "❌ Error:"}</strong><br/>{error}
          </div>
        )}

        {isLoading && <div style={{ color: "#1976d2", margin: "15px 0" }}><p>⏳ Processing transaction...</p></div>}

        {role === "issuer" && (
          <div style={{ backgroundColor: "#f3e5f5", padding: "15px", borderRadius: "8px", margin: "15px 0" }}>
            <h4>🔑 Role Check</h4>
            <button onClick={checkRoles} disabled={isLoading} style={{ padding: "8px 12px", backgroundColor: "#607D8B", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
              🔍 Check My Roles & Contract Status
            </button>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Check your permissions and contract version</p>
          </div>
        )}

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px", margin: "20px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h4>📋 Actions</h4>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {role === "issuer" && (
              <>
                <button onClick={issueDocument} disabled={isLoading || !file} style={{ margin: "5px", padding: "12px 18px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>📝 Issue Document</button>
                <button onClick={revokeDocument} disabled={isLoading || !file} style={{ margin: "5px", padding: "12px 18px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>❌ Revoke Document</button>
                <button onClick={viewDocument} disabled={isLoading || !file} style={{ margin: "5px", padding: "12px 18px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>👁️ View Document</button>
              </>
            )}
            {role === "user" && (
              <button onClick={viewDocument} disabled={isLoading || !file} style={{ margin: "5px", padding: "12px 18px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>👁️ View Document Details</button>
            )}
            {role === "verifier" && (
              <button onClick={verifyFile} disabled={isLoading || !file} style={{ margin: "5px", padding: "12px 18px", backgroundColor: "#FF9800", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>🔍 Verify Document</button>
            )}
          </div>
        </div>

        <button onClick={() => { setAccount(null); setSigner(null); setFile(null); setFileHash32(""); setError(null); setIsLoading(false); setRole(null); setStep("selectRole"); setFetchedDoc(null); setRoleStatus(null); }} style={{ padding: "10px 20px", backgroundColor: "#607D8B", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", margin: "20px 0" }}>🚪 Logout</button>

        {fetchedDoc && (
          <div style={{ marginTop: 30, border: "2px solid #ddd", padding: 20, borderRadius: "12px", backgroundColor: "#f9f9f9", textAlign: "left" }}>
            <h3 style={{ textAlign: "center" }}>📄 Document Details</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              <p><strong>🏢 Issuer:</strong> <code>{fetchedDoc.issuer}</code></p>
              <p><strong>📎 File Name:</strong> {fetchedDoc.ipfsUri}</p>
              <p><strong>📅 Issued At:</strong> {fetchedDoc.issuedAt}</p>
              <p><strong>📊 Status:</strong> <span style={{ backgroundColor: fetchedDoc.revoked ? "#f44336" : "#4CAF50", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>{fetchedDoc.revoked ? "❌ Revoked" : "✅ Valid"}</span></p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;
