
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Zap, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import Web3 from "web3";

export const BDAGContractManager = () => {
  const { account, balance, isConnected, deployBDAGContract, fetchBalance } = useWallet();
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [nativeBalance, setNativeBalance] = useState<string>("0");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const explorerUrl = "https://explorer.testnet.blockdag.network";

  useEffect(() => {
    if (account) {
      refreshBalances();
    }
  }, [account, contractAddress]);

  const refreshBalances = async () => {
    if (!account) return;
    
    try {
      const Web3 = (await import('web3')).default;
      const web3 = new Web3("https://rpc.primordial.bdagscan.com");
      
      // Get native BDAG balance for gas fees
      const nativeBalanceWei = await web3.eth.getBalance(account);
      const nativeBalanceFormatted = web3.utils.fromWei(nativeBalanceWei.toString(), "ether");
      setNativeBalance(parseFloat(nativeBalanceFormatted).toFixed(4));
      
      // Get token balance if contract is deployed
      if (contractAddress) {
        const tokenBalanceResult = await fetchBalance(web3, account, contractAddress);
        setTokenBalance(tokenBalanceResult || "0");
      }
    } catch (err) {
      console.error("Balance refresh error:", err);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setTxHash(null);
    
    try {
      console.log("Deploying BDAG contract...");
      const deployedAddress = await deployBDAGContract();
      setContractAddress(deployedAddress);
      console.log("Contract deployed successfully at:", deployedAddress);
      
      // Refresh balances after deployment
      setTimeout(refreshBalances, 2000);
    } catch (err: any) {
      console.error("Deployment error:", err);
      setError(`Deployment failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const mintTokens = async () => {
    if (!contractAddress || !account) return;
    
    setIsMinting(true);
    setError(null);
    
    try {
      const Web3 = (await import('web3')).default;
      const web3 = new Web3(window.ethereum);
      
      const BDAG_ABI_Module = await import('../abis/BDAG.json');
      const BDAG_ABI = BDAG_ABI_Module.default;
      
      const contract = new web3.eth.Contract(BDAG_ABI, contractAddress);
      const mintAmount = web3.utils.toWei("1000", "ether"); // Mint 1000 tokens
      
      const gasEstimate = await contract.methods.mint(account, mintAmount).estimateGas({ from: account });
      
      const tx = await contract.methods.mint(account, mintAmount).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2)
      });
      
      setTxHash(tx.transactionHash);
      console.log("Minted 1000 BDAG tokens successfully");
      
      // Refresh balances after minting
      setTimeout(refreshBalances, 3000);
    } catch (err: any) {
      console.error("Minting error:", err);
      setError(`Minting failed: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const transferTokens = async () => {
    if (!contractAddress || !account || !transferAmount || !recipientAddress) return;
    
    setIsTransferring(true);
    setError(null);
    setTxHash(null);
    
    try {
      if (!Web3.utils.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address");
      }
      
      if (parseFloat(transferAmount) <= 0) {
        throw new Error("Invalid transfer amount");
      }
      
      if (parseFloat(transferAmount) > parseFloat(tokenBalance)) {
        throw new Error(`Insufficient token balance. You have ${tokenBalance} BDAG`);
      }
      
      const Web3 = (await import('web3')).default;
      const web3 = new Web3(window.ethereum);
      
      const BDAG_ABI_Module = await import('../abis/BDAG.json');
      const BDAG_ABI = BDAG_ABI_Module.default;
      
      const contract = new web3.eth.Contract(BDAG_ABI, contractAddress);
      const amountWei = web3.utils.toWei(transferAmount, "ether");
      
      // Estimate gas
      const gasEstimate = await contract.methods.transfer(recipientAddress, amountWei).estimateGas({ from: account });
      
      // Get current gas price
      const gasPrice = await web3.eth.getGasPrice();
      const gasCostWei = BigInt(gasEstimate) * BigInt(gasPrice) * BigInt(120) / BigInt(100); // 20% buffer
      const gasCostEth = web3.utils.fromWei(gasCostWei.toString(), "ether");
      
      console.log(`Estimated gas cost: ${gasCostEth} BDAG`);
      
      if (parseFloat(nativeBalance) < parseFloat(gasCostEth)) {
        throw new Error(`Insufficient BDAG for gas fees. Need ~${gasCostEth} BDAG, you have ${nativeBalance} BDAG`);
      }
      
      // Send transfer transaction
      const tx = await contract.methods.transfer(recipientAddress, amountWei).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
        gasPrice: gasPrice
      });
      
      setTxHash(tx.transactionHash);
      console.log("Transfer completed successfully:", tx.transactionHash);
      
      // Clear form and refresh balances
      setTransferAmount("");
      setRecipientAddress("");
      setTimeout(refreshBalances, 3000);
      
    } catch (err: any) {
      console.error("Transfer error:", err);
      let errorMessage = err.message;
      
      if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient BDAG for gas fees. Get more test tokens from the faucet.";
      } else if (err.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected in MetaMask";
      }
      
      setError(`Transfer failed: ${errorMessage}`);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6">
        <CardContent>
          <p className="text-center text-muted-foreground">
            Please connect your wallet to deploy and manage BDAG tokens
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contract Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            BDAG Token Contract
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!contractAddress ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No BDAG contract deployed yet. Deploy a new contract to start transferring tokens.
              </p>
              <Button 
                onClick={handleDeploy} 
                disabled={isDeploying}
                className="w-full"
              >
                {isDeploying ? "Deploying..." : "Deploy BDAG Contract"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Contract Deployed</span>
              </div>
              <div className="text-xs break-all bg-gray-100 p-2 rounded">
                {contractAddress}
              </div>
              <a
                href={`${explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                View on Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Balances</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalances}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Native BDAG (for gas)</p>
              <p className="text-lg font-semibold">{nativeBalance}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">BDAG Tokens</p>
              <p className="text-lg font-semibold">{tokenBalance}</p>
            </div>
          </div>
          
          {contractAddress && parseFloat(tokenBalance) === 0 && (
            <Button
              onClick={mintTokens}
              disabled={isMinting}
              variant="outline"
              className="w-full"
            >
              {isMinting ? "Minting..." : "Mint 1000 BDAG Tokens"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transfer Section */}
      {contractAddress && parseFloat(tokenBalance) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Transfer BDAG Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Recipient Address</label>
              <Input
                type="text"
                placeholder="0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Amount (BDAG)</label>
              <Input
                type="number"
                placeholder="10"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {tokenBalance} BDAG
              </p>
            </div>
            
            <Button
              onClick={transferTokens}
              disabled={isTransferring || !transferAmount || !recipientAddress}
              className="w-full"
            >
              {isTransferring ? "Transferring..." : `Transfer ${transferAmount || "0"} BDAG`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {txHash && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Transaction Successful!</p>
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                View on Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">REAL Blockchain Transfer Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Connect Account A (sender) in Chrome browser to BlockDAG testnet</li>
              <li>Get test BDAG from the faucet if balance is insufficient</li>
              <li>Use transfer function - this creates REAL blockchain transactions</li>
              <li>Connect Account B (recipient) in Firefox browser</li>
              <li>Both accounts will show updated balances in MetaMask</li>
              <li>Verify transaction on BlockDAG Explorer</li>
            </ol>
            <p className="mt-3">
              💡 Get test BDAG for gas fees from the{" "}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                BlockDAG Explorer faucet
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
