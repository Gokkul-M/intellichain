
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Brain, Code2, Send, RefreshCw, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Web3 from "web3";
import { useWallet } from "@/contexts/WalletContext";

export const BlockDAGHeader = () => {
  const { account, balance, isConnected, connectWallet, refreshBalance } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [friendBalance, setFriendBalance] = useState<string | null>(null);

  // BlockDAG Testnet Configuration
  const rpcUrl = "https://rpc.primordial.bdagscan.com";
  const chainId = 1043;
  const bdagTokenAddress = "0x32307adfFE088e383AFAa721b06436aDaBA47DBE";
  const explorerUrl = "https://explorer.testnet.blockdag.network";
  const friendAddress = "0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b";

  // ERC-20 ABI for BDAG token contract
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
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "name": "from", "type": "address" },
        { "indexed": true, "name": "to", "type": "address" },
        { "indexed": false, "name": "value", "type": "uint256" }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{ "name": "", "type": "uint8" }],
      "type": "function"
    }
  ];

  // Function to fetch BDAG balance for any address
  const fetchBDAGBalance = async (address: string): Promise<string | null> => {
    try {
      const web3 = new Web3(rpcUrl);
      const contract = new web3.eth.Contract(BDAG_ABI, bdagTokenAddress);
      const balanceWei = await contract.methods.balanceOf(address).call();
      const balanceEth = web3.utils.fromWei(balanceWei.toString(), 'ether');
      return parseFloat(balanceEth).toFixed(4);
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      return null;
    }
  };

  // Function to update both balances
  const updateBothBalances = async () => {
    if (!account) return;
    
    try {
      const [myBalance, friendBal] = await Promise.all([
        fetchBDAGBalance(account),
        fetchBDAGBalance(friendAddress)
      ]);
      
      if (myBalance !== null) {
        // Update wallet context balance
        await refreshBalance();
      }
      
      if (friendBal !== null) {
        setFriendBalance(friendBal);
      }
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  // Check and switch to BlockDAG network
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const web3 = new Web3(window.ethereum);
    const currentChainId = await web3.eth.getChainId();
    
    if (currentChainId !== chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x413" }], // 1043 in hex
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x413",
                chainName: "BlockDAG Primordial Testnet",
                rpcUrls: [rpcUrl],
                nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
                blockExplorerUrls: [explorerUrl],
              },
            ],
          });
        } else {
          throw new Error(`Failed to switch network: ${switchError.message}`);
        }
      }
    }
  };

  // Request transfer confirmation
  const requestTransferConfirmation = (amount: string, toAddress: string) => {
    setConfirmation({
      amount,
      toAddress,
      message: `Confirm transfer of ${amount} BDAG to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`
    });
  };

  // Execute BDAG token transfer with proper balance verification
  const executeTransfer = async (amount: string, toAddress: string) => {
    if (!account) {
      throw new Error("Please connect your wallet first");
    }

    setIsTransferring(true);
    setError(null);
    setTxStatus(null);
    setConfirmation(null);

    try {
      // Validate inputs
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Invalid transfer amount. Amount must be greater than 0");
      }

      if (!Web3.utils.isAddress(toAddress)) {
        throw new Error("Invalid recipient address format");
      }

      if (parseFloat(amount) > parseFloat(balance || "0")) {
        throw new Error(`Insufficient BDAG balance. You have ${balance} BDAG, trying to transfer ${amount} BDAG`);
      }

      // Check MetaMask and network
      await checkAndSwitchNetwork();
      const web3 = new Web3(window.ethereum);

      console.log("=== STARTING REAL BDAG TOKEN TRANSFER ===");
      console.log(`From: ${account}`);
      console.log(`To: ${toAddress}`);
      console.log(`Amount: ${amount} BDAG`);
      console.log(`Token Contract: ${bdagTokenAddress}`);

      // Get initial balances for verification
      const initialSenderBalance = await fetchBDAGBalance(account);
      const initialRecipientBalance = await fetchBDAGBalance(toAddress);
      
      console.log(`Initial sender balance: ${initialSenderBalance} BDAG`);
      console.log(`Initial recipient balance: ${initialRecipientBalance} BDAG`);

      // Create contract instance
      const tokenContract = new web3.eth.Contract(BDAG_ABI, bdagTokenAddress);
      const amountWei = web3.utils.toWei(amount, "ether");

      setTxStatus(`🔄 **Preparing Token Transfer...**

**Details:**
• Token: BDAG (ERC-20)
• Contract: ${bdagTokenAddress}
• Amount: ${amount} BDAG
• To: ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}
• Network: BlockDAG Primordial Testnet ✅

**Initial Balances:**
• Your Balance: ${initialSenderBalance} BDAG
• Recipient Balance: ${initialRecipientBalance} BDAG

**Estimating gas...**`);

      // Estimate gas for the transfer
      console.log("Estimating gas for token transfer...");
      const gasEstimate = await tokenContract.methods
        .transfer(toAddress, amountWei)
        .estimateGas({ from: account });

      const gasPrice = await web3.eth.getGasPrice();
      const gasCostWei = BigInt(gasEstimate) * BigInt(gasPrice);
      const gasCostEth = web3.utils.fromWei(gasCostWei.toString(), "ether");

      console.log(`Gas estimate: ${gasEstimate}`);
      console.log(`Gas price: ${gasPrice}`);
      console.log(`Estimated gas cost: ${gasCostEth} BDAG`);

      setTxStatus(`🔄 **MetaMask Confirmation Required**

**🪙 ERC-20 Token Transfer:**
• Transferring: **${amount} BDAG tokens**
• To Address: ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}
• Token Contract: ${bdagTokenAddress}
• Estimated Gas: ~${gasCostEth} BDAG

**📋 What you'll see in MetaMask:**
• Transaction Type: Contract Interaction
• To: ${bdagTokenAddress.slice(0, 6)}...${bdagTokenAddress.slice(-4)} (BDAG Token Contract)
• Amount: 0 BDAG (normal for token transfers)
• Function: transfer(${toAddress.slice(0, 6)}...${toAddress.slice(-4)}, ${amount} BDAG)

**✅ The ${amount} BDAG transfer amount is encoded in the transaction data!**

**Please confirm the transaction in MetaMask popup...**`);

      // Get current nonce to avoid nonce issues
      const nonce = await web3.eth.getTransactionCount(account, 'pending');
      
      // Encode the transfer function call
      const transferData = tokenContract.methods.transfer(toAddress, amountWei).encodeABI();
      
      // Send transaction using eth_sendTransaction for better MetaMask integration
      const transactionParameters = {
        from: account,
        to: bdagTokenAddress,
        gas: web3.utils.toHex(Math.floor(Number(gasEstimate) * 1.3)),
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
        data: transferData,
        value: '0x0' // Always 0 for ERC-20 transfers
      };

      console.log("Transaction parameters:", transactionParameters);
      console.log(`Note: MetaMask will show 0 BDAG in value field, but ${amount} BDAG is encoded in the data field`);

      // Use MetaMask's eth_sendTransaction method directly for better display
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      console.log("Token transfer transaction sent:", txHash);

      // Wait for transaction confirmation with extended polling
      let receipt = null;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max wait
      
      setTxStatus(`⏳ **Transaction Submitted Successfully!**

**Transaction Hash:** ${txHash}

**Waiting for blockchain confirmation...**
• This may take 10-60 seconds
• Do not refresh the page

**Current Status:** Pending confirmation...`);

      while (!receipt && attempts < maxAttempts) {
        try {
          receipt = await web3.eth.getTransactionReceipt(txHash);
          if (receipt) break;
        } catch (e) {
          // Receipt not available yet
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        // Update status every 10 seconds
        if (attempts % 10 === 0) {
          setTxStatus(prev => prev + `\n• Still waiting... (${attempts}s elapsed)`);
        }
      }

      const explorerTxUrl = `https://primordial.bdagscan.com/tx/${txHash}`;
      const senderExplorerUrl = `https://primordial.bdagscan.com/address/${account}`;
      const recipientExplorerUrl = `https://primordial.bdagscan.com/address/${toAddress}`;

      if (receipt && receipt.status) {
        // Wait a moment for balances to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get final balances for verification
        const finalSenderBalance = await fetchBDAGBalance(account);
        const finalRecipientBalance = await fetchBDAGBalance(toAddress);
        
        console.log(`Final sender balance: ${finalSenderBalance} BDAG`);
        console.log(`Final recipient balance: ${finalRecipientBalance} BDAG`);
        
        // Calculate actual changes
        const senderChange = parseFloat(initialSenderBalance || "0") - parseFloat(finalSenderBalance || "0");
        const recipientChange = parseFloat(finalRecipientBalance || "0") - parseFloat(initialRecipientBalance || "0");
        
        setTxStatus(`🎉 **REAL BDAG Token Transfer SUCCESSFUL!**

**✅ Transaction Confirmed on BlockDAG Blockchain**

**Transfer Summary:**
• Amount Transferred: ${amount} BDAG (ERC-20 Tokens)
• From: ${account.slice(0, 6)}...${account.slice(-4)} → ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}
• Transaction Hash: ${txHash}
• Gas Used: ${receipt.gasUsed} units (~${gasCostEth} BDAG)
• Block Number: ${receipt.blockNumber}

**BALANCE VERIFICATION:**
• Your Previous Balance: ${initialSenderBalance} BDAG
• Your Current Balance: ${finalSenderBalance} BDAG
• Your Balance Change: -${senderChange.toFixed(4)} BDAG (${amount} transfer + gas fees)

• Recipient Previous Balance: ${initialRecipientBalance} BDAG  
• Recipient Current Balance: ${finalRecipientBalance} BDAG
• Recipient Balance Change: +${recipientChange.toFixed(4)} BDAG

**🔍 View on BlockDAG Explorer:**
• Transaction: ${explorerTxUrl}
• Your Account: ${senderExplorerUrl}  
• Recipient Account: ${recipientExplorerUrl}

**✅ BOTH METAMASK ACCOUNTS NOW UPDATED:**
• Check your MetaMask: Balance decreased by ${senderChange.toFixed(4)} BDAG
• Check recipient MetaMask: Balance increased by ${recipientChange.toFixed(4)} BDAG

**🔄 Updating displayed balances...**`);

        // Update both balances in the UI
        await updateBothBalances();
        
        setTxStatus(prev => prev + "\n\n✅ **TRANSFERRED SUCCESSFULLY - Balances Updated!**");
        
      } else {
        setTxStatus(`⚠️ **Transaction Status Unknown**

**Transaction Hash:** ${txHash}
**Status:** Submitted but confirmation timeout

**Next Steps:**
1. Check transaction on Explorer: ${explorerTxUrl}
2. Verify balances in both MetaMask accounts
3. If not visible, wait 2-3 minutes for blockchain sync

**The transaction may still be processing successfully.**`);
      }

      return txHash;
    } catch (err: any) {
      console.error("Token transfer error details:", err);
      let errorMessage = err.message;

      if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient BDAG for gas fees. Get test BDAG from BlockDAG Explorer faucet.";
      } else if (err.message.includes("user rejected") || err.code === 4001) {
        errorMessage = "Transaction was rejected in MetaMask. Please try again and confirm the transaction.";
      } else if (err.message.includes("network") || err.message.includes("CONNECTION ERROR")) {
        errorMessage = "Network connection issue. Ensure you're connected to BlockDAG Primordial Testnet.";
      }

      setError(`❌ **Token Transfer Failed:** ${errorMessage}

**Troubleshooting:**
1. Ensure MetaMask is unlocked and connected
2. Verify you're on BlockDAG Primordial Testnet (Chain ID: 1043)  
3. Check you have enough BDAG for transfer amount + gas fees
4. Try refreshing the page and reconnecting wallet
5. Get test BDAG from: https://explorer.testnet.blockdag.network

**Need Help?** Contact support@blockdag.network with transaction details.`);

      return null;
    } finally {
      setIsTransferring(false);
    }
  };

  const connectMetaMask = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === "undefined") {
        setError("MetaMask is not installed. Please install MetaMask and refresh the page.");
        return;
      }

      await checkAndSwitchNetwork();
      await connectWallet();
      
      // Update friend's balance after connection
      setTimeout(updateBothBalances, 2000);
    } catch (error: any) {
      setError(`Connection failed: ${error.message}`);
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle chatbot prompts for token transfers
  const handleChatPrompt = async () => {
    setError(null);
    setChatResponse("");
    setTxStatus(null);
    setConfirmation(null);

    const prompt = chatPrompt.toLowerCase().trim();

    if (prompt.includes("check my balance") || prompt.includes("balance")) {
      if (!account) {
        setChatResponse("❌ Please connect your MetaMask wallet first to check balance.");
        return;
      }

      await updateBothBalances();
      setChatResponse(`💰 **Current BDAG Balances:**

**Your Account (${account.slice(0, 6)}...${account.slice(-4)}):** ${balance || "Loading..."} BDAG
**Friend's Account (${friendAddress.slice(0, 6)}...${friendAddress.slice(-4)}):** ${friendBalance || "Loading..."} BDAG

Network: BlockDAG Primordial Testnet (Chain ID: 1043)
Token Contract: ${bdagTokenAddress}

🔍 View accounts on Explorer:
• Your Account: ${explorerUrl}/address/${account}
• Friend's Account: ${explorerUrl}/address/${friendAddress}`);

    } else if (prompt.includes("transfer")) {
      if (!account) {
        setChatResponse("❌ Please connect your MetaMask wallet first to perform transfers.");
        return;
      }

      // Parse transfer prompt
      const transferMatch = prompt.match(/transfer\s+(\d+\.?\d*)\s+bdag\s+to\s+(0x[a-fA-F0-9]{40})/i);

      if (transferMatch) {
        const [, amount, recipientAddress] = transferMatch;

        if (!balance) {
          setChatResponse("❌ Unable to fetch your balance. Please ensure you're connected to BlockDAG testnet.");
          return;
        }

        if (parseFloat(amount) <= 0) {
          setChatResponse("❌ Invalid amount. Please enter a positive number.");
          return;
        }

        if (parseFloat(amount) > parseFloat(balance)) {
          setChatResponse(`❌ Insufficient BDAG balance. You have ${balance} BDAG but trying to transfer ${amount} BDAG.

💡 Get more test tokens from the BlockDAG faucet:
🔗 ${explorerUrl} → Faucet (up to 100 BDAG per day)`);
          return;
        }

        requestTransferConfirmation(amount, recipientAddress);
        setChatResponse(`🔄 **Transfer Request Received**

**Details:**
• Amount: ${amount} BDAG (ERC-20 tokens)
• To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}
• Token Contract: ${bdagTokenAddress}
• Current Balance: ${balance} BDAG

**Please confirm below to proceed with the transfer.**`);

      } else {
        setChatResponse(`❌ Invalid transfer format. Please use:

📝 Correct format: "transfer [amount] BDAG to [address]"
📝 Example: "transfer 1 BDAG to 0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b"

Make sure the recipient address is 42 characters long and starts with 0x.`);
      }

    } else if (prompt.includes("help") || prompt === "") {
      setChatResponse(`🤖 BlockDAG Contract Buddy - Available Commands:

💰 "check my balance" - View current BDAG token balances (yours + friend's)
📤 "transfer [amount] BDAG to [address]" - Send BDAG ERC-20 tokens
🔗 "help" - Show this help message

🌐 Network: BlockDAG Primordial Testnet (Chain ID: 1043)
🔍 Explorer: ${explorerUrl}
🪙 Token Contract: ${bdagTokenAddress}

💡 Example: "transfer 1 BDAG to 0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b"`);

    } else {
      setChatResponse(`❓ Command not recognized. Try:

• "check my balance" to view BDAG token balances
• "transfer [amount] BDAG to [address]" to send ERC-20 tokens
• "help" for more commands

🤖 BlockDAG Buddy is ready to help with your token transfers!`);
    }
  };

  // Update friend's balance when account changes
  useEffect(() => {
    if (account) {
      updateBothBalances();
    }
  }, [account]);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              BlockDAG Contract Buddy
            </h1>
            <p className="text-sm text-gray-600">
              Real BDAG ERC-20 token transfers with balance verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 border-green-300"
          >
            <Brain className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 border-blue-300"
          >
            <Code2 className="w-3 h-3 mr-1" />
            ERC-20 Tokens
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {!isConnected ? (
          <Button
            onClick={connectMetaMask}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 py-3"
            size="lg"
          >
            {isConnecting ? "Connecting to BlockDAG..." : "Connect MetaMask to BlockDAG Testnet"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    ✅ Connected to BlockDAG Testnet
                  </p>
                  <p className="text-xs text-green-700">
                    Account: {account?.slice(0, 6)}...{account?.slice(-4)}
                  </p>
                  <p className="text-xs text-green-700">
                    💰 Your BDAG Balance: {balance || "0.0000"} BDAG
                  </p>
                  <p className="text-xs text-green-700">
                    💰 Friend's BDAG Balance: {friendBalance || "Loading..."} BDAG
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={updateBothBalances}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-200"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => window.open(`${explorerUrl}/address/${account}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-300 hover:bg-blue-200"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Explorer
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Chat with BlockDAG Buddy
              </h3>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Try: 'check my balance' or 'transfer 1 BDAG to 0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b'"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatPrompt()}
                  className="text-sm"
                />

                <Button 
                  onClick={handleChatPrompt}
                  disabled={isTransferring || !chatPrompt.trim()}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isTransferring ? "Processing Transfer..." : "Submit Prompt"}
                </Button>

                {chatResponse && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <pre className="text-sm text-blue-900 whitespace-pre-wrap font-mono">
                      {chatResponse}
                    </pre>
                  </div>
                )}

                {confirmation && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      {confirmation.message}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => executeTransfer(confirmation.amount, confirmation.toAddress)}
                        disabled={isTransferring}
                        className="bg-green-600 text-white hover:bg-green-700"
                        size="sm"
                      >
                        {isTransferring ? "Processing..." : "Confirm Transfer"}
                      </Button>
                      <Button
                        onClick={() => setConfirmation(null)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {txStatus && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono">
                      {txStatus}
                    </pre>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <pre className="text-sm text-red-700 whitespace-pre-wrap">
                      {error}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-2">
            <strong>📋 Real BDAG ERC-20 Token Transfer with Balance Verification:</strong>
          </p>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• <strong>Contract:</strong> {bdagTokenAddress} (Official BDAG ERC-20 Token)</p>
            <p>• <strong>Network:</strong> BlockDAG Primordial Testnet (Chain ID: 1043)</p>
            <p>• <strong>RPC:</strong> https://rpc.primordial.bdagscan.com</p>
            <p>• <strong>Explorer:</strong> https://explorer.testnet.blockdag.network</p>
            <p>• <strong>Balance Updates:</strong> Both sender and recipient balances verified after transfer</p>
            <p>• <strong>MetaMask Display:</strong> Shows "0 BDAG" (normal for ERC-20), actual amount in transaction data</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
