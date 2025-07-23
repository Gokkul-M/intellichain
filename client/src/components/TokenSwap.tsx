import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDownUp, Zap, Send, Brain } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

const AVAILABLE_TOKENS = [
  { symbol: "BDAG", name: "BlockDAG", address: "0x0000000000000000000000000000000000000000" },
  { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000001" },
  { symbol: "USDC", name: "USD Coin", address: "0x0000000000000000000000000000000000000002" }
];

// BDAG Token Contract Details - Using actual BlockDAG testnet contract
const BDAG_CONTRACT_ADDRESS = "0x32307adfFE088e383AFAa721b06436aDaBA47DBE"; // Official BDAG testnet contract
const BLOCKDAG_EXPLORER_URL = "https://explorer.testnet.blockdag.network";

// Simple ERC-20 ABI for transfer and balanceOf
const BDAG_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "success", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
];

// Placeholder DEX router address - would need actual deployed contract
const DEX_ROUTER_ADDRESS = "0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a"; // Placeholder

export const TokenSwap = () => {
  const { account, balance, swapTokens, swapTransactions } = useWallet();
  const [fromToken, setFromToken] = useState("BDAG");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [swapDetails, setSwapDetails] = useState<any>(null);

  // Transfer functionality
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferResult, setTransferResult] = useState<string | null>(null);

  // BDAG Token Transfer Function - Real Blockchain Transaction
  const transferBDAG = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError("Please enter a valid transfer amount");
      return;
    }

    if (!toAddress || toAddress.length !== 42 || !toAddress.startsWith('0x')) {
      setError("Please enter a valid recipient address (0x...)");
      return;
    }

    if (!account) {
      setError("Please connect your wallet");
      return;
    }

    if (!balance || parseFloat(transferAmount) > parseFloat(balance)) {
      setError(`Insufficient BDAG balance. You have ${balance} BDAG but trying to transfer ${transferAmount} BDAG`);
      return;
    }

    setIsTransferring(true);
    setError(null);
    setTransferResult(null);

    try {
      // Check MetaMask availability
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed or not available");
      }

      const Web3 = (await import('web3')).default;
      const web3 = new Web3(window.ethereum);
      
      console.log("Starting BDAG transfer...");
      console.log(`From: ${account}`);
      console.log(`To: ${toAddress}`);
      console.log(`Amount: ${transferAmount} BDAG`);

      // Force network check and switch if needed
      const currentChainId = await web3.eth.getChainId();
      const targetChainId = 1043; // BlockDAG Primordial Testnet
      
      if (currentChainId !== targetChainId) {
        console.log("Wrong network detected, attempting to switch...");
        
        try {
          // Try to switch to BlockDAG network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x413' }], // 1043 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network not added to MetaMask, add it
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
            throw new Error(`Failed to switch network: ${switchError.message}`);
          }
        }
        
        // Verify we're now on the correct network
        const newChainId = await web3.eth.getChainId();
        if (newChainId !== targetChainId) {
          throw new Error("Network switch failed. Please manually switch to BlockDAG Primordial Testnet in MetaMask");
        }
      }
      
      // Use native BDAG transfer (since BDAG is the native token on BlockDAG)
      const transferAmountWei = web3.utils.toWei(transferAmount, "ether");
      
      console.log("Estimating gas...");
      // Estimate gas for the transaction
      const gasEstimate = await web3.eth.estimateGas({
        from: account,
        to: toAddress,
        value: transferAmountWei
      });
      
      // Get current gas price
      const gasPrice = await web3.eth.getGasPrice();
      
      // Calculate gas cost
      const gasCostWei = BigInt(gasEstimate) * BigInt(gasPrice);
      const gasCostEth = web3.utils.fromWei(gasCostWei.toString(), "ether");
      
      console.log(`Gas estimate: ${gasEstimate}`);
      console.log(`Gas price: ${gasPrice}`);
      console.log(`Estimated gas cost: ${gasCostEth} BDAG`);

      // Show preparation message
      setTransferResult(`🔄 **Preparing Transfer...**

**Details:**
• Amount: ${transferAmount} BDAG
• To: ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}
• Estimated Gas: ~${gasCostEth} BDAG

**Please confirm in MetaMask...**`);
      
      // Send native BDAG transfer transaction
      console.log("Sending transaction...");
      const tx = await web3.eth.sendTransaction({
        from: account,
        to: toAddress,
        value: transferAmountWei,
        gas: Math.floor(Number(gasEstimate) * 1.2), // 20% buffer
        gasPrice: gasPrice
      });
      
      console.log("Transaction sent:", tx.transactionHash);
      
      const explorerUrl = `${BLOCKDAG_EXPLORER_URL}/tx/${tx.transactionHash}`;
      
      setTransferResult(`✅ **REAL Transfer Completed Successfully!**

**Transaction Details:**
• Transferred: ${transferAmount} BDAG (Native Token)
• From: ${account.slice(0, 6)}...${account.slice(-4)}
• To: ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}
• Transaction Hash: ${tx.transactionHash}
• Gas Used: ~${gasCostEth} BDAG

🔍 **View on BlockDAG Explorer:**
${explorerUrl}

✅ **Both MetaMask accounts should now show updated balances!**
✅ **This was a REAL blockchain transaction, not a simulation!**

🔄 **Auto-refreshing in 5 seconds...**`);
      
      // Reset form
      setTransferAmount("");
      setToAddress("");
      
      // Refresh balance after successful transfer
      setTimeout(() => {
        console.log("Auto-refreshing page to show updated balances...");
        window.location.reload();
      }, 5000);
      
    } catch (err: any) {
      console.error("Transfer error:", err);
      let errorMessage = err.message;
      
      if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient BDAG for gas fees. Get test BDAG from the BlockDAG Explorer faucet at https://explorer.testnet.blockdag.network";
      } else if (err.message.includes("user rejected") || err.code === 4001) {
        errorMessage = "Transaction was rejected in MetaMask. Please try again and confirm the transaction.";
      } else if (err.message.includes("network") || err.message.includes("CONNECTION ERROR")) {
        errorMessage = "Network connection issue. Ensure you're connected to BlockDAG Primordial Testnet.";
      } else if (err.message.includes("Chain ID") || err.message.includes("chain")) {
        errorMessage = "Wrong network. Please manually switch to BlockDAG Primordial Testnet (Chain ID: 1043) in MetaMask.";
      } else if (err.message.includes("gas")) {
        errorMessage = "Gas estimation failed. You may not have enough BDAG for transaction fees.";
      }
      
      setError(`❌ **Transfer Failed:** ${errorMessage}

**Troubleshooting:**
1. Ensure MetaMask is unlocked and connected
2. Check you're on BlockDAG Primordial Testnet (Chain ID: 1043)
3. Verify sufficient BDAG for transfer + gas fees
4. Get test BDAG: https://explorer.testnet.blockdag.network`);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!account) {
      setError("Please connect your wallet");
      return;
    }

    if (fromToken === toToken) {
      setError("Please select different tokens for swapping");
      return;
    }

    // Calculate swap details for confirmation
    const exchangeRates: { [key: string]: { [key: string]: number } } = {
      "BDAG": { "ETH": 0.0001, "USDC": 0.5 },
      "ETH": { "BDAG": 10000, "USDC": 3000 },
      "USDC": { "BDAG": 2, "ETH": 0.00033 }
    };

    const rate = exchangeRates[fromToken]?.[toToken];
    if (!rate) {
      setError(`Trading pair ${fromToken}/${toToken} not supported yet on BlockDAG testnet`);
      return;
    }

    const estimatedOutput = (parseFloat(amount) * rate * 0.98).toFixed(4);

    setSwapDetails({
      fromAmount: amount,
      fromToken,
      toToken,
      estimatedOutput,
      rate,
      slippage: "2%",
      gasFee: "~0.001 BDAG"
    });

    setShowConfirmation(true);
    setError(null);
  };

  const confirmSwap = async () => {
    setIsSwapping(true);
    setError(null);
    setSwapResult(null);
    setShowConfirmation(false);

    try {
      const txHash = await swapTokens(fromToken, toToken, amount);

      if (txHash) {
        const lastSwap = swapTransactions[0];
        setSwapResult(`✅ Swap Completed!

Swapped: ${lastSwap.fromAmount} ${lastSwap.from} → ${lastSwap.toAmount} ${lastSwap.to}
Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}

Your transaction has been confirmed on BlockDAG testnet.`);
        setAmount("");
      } else {
        setError("Swap failed. Please try again.");
      }
    } catch (err: any) {
      let errorMessage = err.message;

      // Add specific missing components info
      if (err.message.includes("not supported")) {
        errorMessage += "\n\n❌ Missing Components:\n• DEX contract not deployed on BlockDAG testnet\n• Token contracts need actual addresses\n• Liquidity pools not available";
      }

      setError(errorMessage);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const estimatedOutput = amount ? (parseFloat(amount) * 0.99).toFixed(4) : "0";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Token Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <div className="flex gap-2">
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg bg-background"
            >
              {AVAILABLE_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
          {fromToken === "BDAG" && balance && (
            <p className="text-xs text-muted-foreground">
              Balance: {balance} BDAG
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFlipTokens}
            className="rounded-full"
          >
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <div className="flex gap-2">
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg bg-background"
            >
              {AVAILABLE_TOKENS.filter(token => token.symbol !== fromToken).map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>
          <div className="px-3 py-2 border rounded-lg bg-muted">
            <span className="text-lg">{estimatedOutput}</span>
          </div>
        </div>

        {!showConfirmation ? (
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !account || !amount}
            className="w-full"
          >
            {isSwapping ? "Swapping..." : "Review Swap"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Confirm Swap Details</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>From:</span>
                  <span>{swapDetails.fromAmount} {swapDetails.fromToken}</span>
                </div>
                <div className="flex justify-between">
                  <span>To (estimated):</span>
                  <span>{swapDetails.estimatedOutput} {swapDetails.toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span>1 {swapDetails.fromToken} = {swapDetails.rate} {swapDetails.toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage:</span>
                  <span>{swapDetails.slippage}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Fee:</span>
                  <span>{swapDetails.gasFee}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSwap}
                disabled={isSwapping}
                className="flex-1"
              >
                {isSwapping ? "Swapping..." : "Confirm Swap"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {swapResult && (
          <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">{swapResult}</p>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Transfer BDAG Tokens
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Recipient Address</label>
              <Input
                type="text"
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium">Amount (BDAG)</label>
              <Input
                type="number"
                placeholder="0.0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1"
              />
              {balance && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {balance} BDAG
                </p>
              )}
            </div>
            
            <Button
              onClick={transferBDAG}
              disabled={isTransferring || !account || !transferAmount || !toAddress}
              className="w-full"
            >
              {isTransferring ? "Transferring..." : "Transfer BDAG"}
            </Button>
          </div>
        </div>

        {transferResult && (
          <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
            <pre className="text-xs text-green-600 whitespace-pre-wrap">{transferResult}</pre>
          </div>
        )}

        {swapTransactions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Swaps</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {swapTransactions.slice(0, 3).map((tx) => (
                <div key={tx.hash} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{tx.from}</Badge>
                    <ArrowDownUp className="w-3 h-3" />
                    <Badge variant="secondary">{tx.to}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.fromAmount} → {tx.toAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};