
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ExternalLink, Copy, Send, RefreshCw } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

export const RealTransferGuide = () => {
  const { account, balance, isConnected, connectWallet, refreshBalance } = useWallet();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState("");
  const [error, setError] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const executeTransfer = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError("Please enter a valid transfer amount");
      return;
    }

    if (!recipientAddress || !recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      setError("Please enter a valid recipient address (0x... format, 42 characters)");
      return;
    }

    if (parseFloat(transferAmount) > parseFloat(balance || "0")) {
      setError(`Insufficient balance. You have ${balance} BDAG, trying to transfer ${transferAmount} BDAG`);
      return;
    }

    setIsTransferring(true);
    setError("");
    setTransferResult("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const Web3 = (await import('web3')).default;
      const web3 = new Web3(window.ethereum);

      console.log("=== STARTING REAL BDAG TRANSFER ===");
      console.log(`From: ${account}`);
      console.log(`To: ${recipientAddress}`);
      console.log(`Amount: ${transferAmount} BDAG`);

      // Force network verification and switch
      const currentChainId = await web3.eth.getChainId();
      const targetChainId = 1043;

      if (currentChainId !== targetChainId) {
        setTransferResult("🔄 Wrong network detected. Switching to BlockDAG Primordial Testnet...");
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x413' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x413',
                chainName: 'BlockDAG Primordial Testnet',
                rpcUrls: ['https://rpc.primordial.bdagscan.com'],
                nativeCurrency: {
                  name: 'BDAG',
                  symbol: 'BDAG',
                  decimals: 18
                },
                blockExplorerUrls: ['https://explorer.testnet.blockdag.network']
              }]
            });
          } else {
            throw switchError;
          }
        }
        
        const newChainId = await web3.eth.getChainId();
        if (newChainId !== targetChainId) {
          throw new Error("Network switch failed");
        }
      }

      setTransferResult("✅ Connected to BlockDAG Primordial Testnet\n🔄 Preparing transaction...");

      const amountWei = web3.utils.toWei(transferAmount, "ether");
      
      // Estimate gas
      const gasEstimate = await web3.eth.estimateGas({
        from: account,
        to: recipientAddress,
        value: amountWei
      });

      const gasPrice = await web3.eth.getGasPrice();
      const gasCostWei = BigInt(gasEstimate) * BigInt(gasPrice);
      const gasCostEth = web3.utils.fromWei(gasCostWei.toString(), "ether");

      setTransferResult(`✅ Connected to BlockDAG Primordial Testnet
✅ Transaction prepared
💰 Amount: ${transferAmount} BDAG
⛽ Estimated Gas: ~${gasCostEth} BDAG
🎯 To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}

🔄 **Please confirm the transaction in MetaMask...**`);

      // Send transaction
      const tx = await web3.eth.sendTransaction({
        from: account,
        to: recipientAddress,
        value: amountWei,
        gas: Math.floor(Number(gasEstimate) * 1.2),
        gasPrice: gasPrice
      });

      const explorerUrl = `https://explorer.testnet.blockdag.network/tx/${tx.transactionHash}`;

      setTransferResult(`🎉 **REAL TRANSFER COMPLETED SUCCESSFULLY!**

**Transaction Details:**
✅ Status: Confirmed on BlockDAG Blockchain
💰 Amount: ${transferAmount} BDAG (Native Token)
📤 From: ${account.slice(0, 6)}...${account.slice(-4)}
📥 To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}
🔗 Tx Hash: ${tx.transactionHash}
⛽ Gas Used: ~${gasCostEth} BDAG

🔍 **View on BlockDAG Explorer:**
${explorerUrl}

✅ **Both MetaMask accounts will show updated balances!**
✅ **This was a REAL blockchain transaction!**

🔄 Refreshing balance in 3 seconds...`);

      // Clear form
      setTransferAmount("");
      setRecipientAddress("");

      // Refresh balance
      setTimeout(async () => {
        await refreshBalance();
        setTransferResult(prev => prev + "\n\n✅ **Balance refreshed!**");
      }, 3000);

    } catch (err: any) {
      console.error("Transfer failed:", err);
      
      let errorMessage = err.message;
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user in MetaMask";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient BDAG for gas fees. Get test BDAG from faucet.";
      } else if (err.message.includes("network")) {
        errorMessage = "Network connection issue. Check your internet connection.";
      }

      setError(`❌ **Transfer Failed:** ${errorMessage}

**Get Test BDAG:**
Visit https://explorer.testnet.blockdag.network and use the faucet to get test tokens.`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Network Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Real BDAG Transfer Between Two MetaMask Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This app performs REAL blockchain transactions on BlockDAG Primordial Testnet. 
              Transfers will be visible in both MetaMask accounts and on the BlockDAG Explorer.
            </AlertDescription>
          </Alert>

          {/* Setup Steps */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">1</Badge>
                Network Setup
              </h4>
              <div className="text-sm space-y-2">
                <p><strong>Chain ID:</strong> 1043</p>
                <p><strong>RPC URL:</strong> https://rpc.primordial.bdagscan.com</p>
                <p><strong>Symbol:</strong> BDAG</p>
                <p><strong>Explorer:</strong> https://explorer.testnet.blockdag.network</p>
                <Button
                  onClick={() => copyToClipboard("1043")}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Chain ID
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">2</Badge>
                Get Test Tokens
              </h4>
              <div className="text-sm space-y-2">
                <p>• Visit BlockDAG Explorer</p>
                <p>• Use the faucet feature</p>
                <p>• Get up to 100 BDAG per day</p>
                <a 
                  href="https://explorer.testnet.blockdag.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Faucet
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">3</Badge>
                Two Browser Setup
              </h4>
              <div className="text-sm space-y-2">
                <p>• Chrome: Account A (sender)</p>
                <p>• Firefox: Account B (recipient)</p>
                <p>• Both connected to BlockDAG testnet</p>
                <p>• Both accounts have test BDAG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Execute Real BDAG Transfer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Connect your wallet to start transferring BDAG tokens</p>
              <Button onClick={connectWallet} className="w-full">
                Connect MetaMask
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account Info */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      ✅ Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                    </p>
                    <p className="text-sm text-green-700">
                      💰 Balance: {balance || "0.0000"} BDAG
                    </p>
                  </div>
                  <Button
                    onClick={refreshBalance}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Transfer Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Recipient Address</label>
                  <Input
                    type="text"
                    placeholder="0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the address of Account B (recipient in other browser)
                  </p>
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
                    Available: {balance || "0.0000"} BDAG
                  </p>
                </div>

                <Button
                  onClick={executeTransfer}
                  disabled={isTransferring || !transferAmount || !recipientAddress}
                  className="w-full"
                  size="lg"
                >
                  {isTransferring ? "Processing Transaction..." : `Transfer ${transferAmount || "0"} BDAG`}
                </Button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {transferResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <pre className="text-sm text-green-700 whitespace-pre-wrap font-mono">{transferResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">📋 Step-by-Step Transfer Process:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Connect Account A (sender) in Chrome browser</li>
              <li>Ensure both accounts have test BDAG from faucet</li>
              <li>Enter Account B address and transfer amount</li>
              <li>Click "Transfer BDAG" - MetaMask will popup for confirmation</li>
              <li>Confirm transaction in MetaMask</li>
              <li>Wait for blockchain confirmation (~10-30 seconds)</li>
              <li>Check Account B in Firefox - balance should be updated</li>
              <li>Verify transaction on BlockDAG Explorer</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-900 text-xs">
                💡 <strong>Pro Tip:</strong> This performs REAL blockchain transactions. 
                Both MetaMask accounts will show updated balances immediately after confirmation.
                Transaction fees are paid in BDAG (typically ~0.0001 BDAG per transfer).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
