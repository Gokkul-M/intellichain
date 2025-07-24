import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { TransactionPreview } from "@/components/TransactionPreview";
import { WalletConnect } from "@/components/WalletConnect";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Download,
  Zap,
  Brain,
  Code2,
  Send,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { BDAGContractManager } from "@/components/BDAGContractManager";
import { Toaster } from "@/components/ui/sonner";
import Web3 from "web3";

interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  transaction?: any;
  status?: "pending" | "success" | "error";
}

const initialMessages: Message[] = [
  {
    id: "1",
    type: "system",
    content:
      'Welcome! I can help you interact with the blockchain using natural language. Try saying something like "swap 100 USDC for ETH" or "check my wallet balance".',
    timestamp: new Date(),
  },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  
  // BlockDAG specific state
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [friendBalance, setFriendBalance] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { account, balance, swapTransactions, isConnected, connectWallet, refreshBalance } = useWallet();

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

  // Update friend's balance when account changes
  useEffect(() => {
    if (account) {
      updateBothBalances();
    }
  }, [account]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Handle BlockDAG chatbot prompts
      if (content.toLowerCase().includes("check my balance") || content.toLowerCase().includes("balance")) {
        if (!account) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: "❌ Please connect your MetaMask wallet first to check balance.",
            timestamp: new Date(),
            status: "error",
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }

        await updateBothBalances();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `💰 **Current BDAG Balances:**

**Your Account (${account.slice(0, 6)}...${account.slice(-4)}):** ${balance || "Loading..."} BDAG
**Friend's Account (${friendAddress.slice(0, 6)}...${friendAddress.slice(-4)}):** ${friendBalance || "Loading..."} BDAG

Network: BlockDAG Primordial Testnet (Chain ID: 1043)
Token Contract: ${bdagTokenAddress}

🔍 View accounts on Explorer:
• Your Account: ${explorerUrl}/address/${account}
• Friend's Account: ${explorerUrl}/address/${friendAddress}`,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      if (content.toLowerCase().includes("transfer")) {
        if (!account) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: "❌ Please connect your MetaMask wallet first to perform transfers.",
            timestamp: new Date(),
            status: "error",
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }

        // Parse transfer prompt
        const transferMatch = content.match(/transfer\s+(\d+\.?\d*)\s+bdag\s+to\s+(0x[a-fA-F0-9]{40})/i);

        if (transferMatch) {
          const [, amount, recipientAddress] = transferMatch;

          if (!balance) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: "assistant",
              content: "❌ Unable to fetch your balance. Please ensure you're connected to BlockDAG testnet.",
              timestamp: new Date(),
              status: "error",
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }

          if (parseFloat(amount) <= 0) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: "assistant",
              content: "❌ Invalid amount. Please enter a positive number.",
              timestamp: new Date(),
              status: "error",
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }

          if (parseFloat(amount) > parseFloat(balance)) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: "assistant",
              content: `❌ Insufficient BDAG balance. You have ${balance} BDAG but trying to transfer ${amount} BDAG.

💡 Get more test tokens from the BlockDAG faucet:
🔗 ${explorerUrl} → Faucet (up to 100 BDAG per day)`,
              timestamp: new Date(),
              status: "error",
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }

          // Execute the transfer directly
          try {
            const txHash = await executeTransfer(amount, recipientAddress);
            if (txHash) {
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: "assistant",
                content: `🎉 **Transfer Successful!**

**Details:**
• Amount: ${amount} BDAG transferred
• To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}
• Transaction Hash: ${txHash}
• Status: Confirmed on BlockDAG blockchain

Check the transaction status in the BlockDAG header above for full details.`,
                timestamp: new Date(),
                status: "success",
              };
              setMessages((prev) => [...prev, assistantMessage]);
            }
          } catch (error: any) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: "assistant",
              content: `❌ Transfer failed: ${error.message}`,
              timestamp: new Date(),
              status: "error",
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          setIsLoading(false);
          return;

        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: `❌ Invalid transfer format. Please use:

📝 Correct format: "transfer [amount] BDAG to [address]"
📝 Example: "transfer 1 BDAG to 0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b"

Make sure the recipient address is 42 characters long and starts with 0x.`,
            timestamp: new Date(),
            status: "error",
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }
      }

      if (content.toLowerCase().includes("help") || content === "") {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `🤖 BlockDAG Contract Buddy - Available Commands:

💰 "check my balance" - View current BDAG token balances (yours + friend's)
📤 "transfer [amount] BDAG to [address]" - Send BDAG ERC-20 tokens
🔗 "help" - Show this help message

🌐 Network: BlockDAG Primordial Testnet (Chain ID: 1043)
🔍 Explorer: ${explorerUrl}
🪙 Token Contract: ${bdagTokenAddress}

💡 Example: "transfer 1 BDAG to 0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b"`,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Check if user is asking about swaps or wants to perform a swap
      if (content.toLowerCase().includes("swap")) {
        let swapResponse = "";

        // Check if it's a swap request (e.g., "swap 1 BDAG to ETH")
        const swapMatch = content.match(
          /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
        );

        if (swapMatch) {
          const [, amount, fromToken, toToken] = swapMatch;

          // Check if wallet is connected
          if (!account) {
            swapResponse =
              "❌ Please connect your MetaMask wallet first to perform token swaps.";
          } else if (!balance) {
            swapResponse =
              "❌ Unable to fetch your balance. Please ensure you're connected to BlockDAG testnet.";
          } else {
            // Validate the swap parameters
            const availableTokens = ["BDAG", "ETH", "USDC"];
            const fromTokenUpper = fromToken.toUpperCase();
            const toTokenUpper = toToken.toUpperCase();

            if (
              !availableTokens.includes(fromTokenUpper) ||
              !availableTokens.includes(toTokenUpper)
            ) {
              swapResponse = `❌ Unsupported token pair. Available tokens: ${availableTokens.join(", ")}`;
            } else if (fromTokenUpper === toTokenUpper) {
              swapResponse =
                "❌ Cannot swap the same token. Please choose different tokens.";
            } else if (parseFloat(amount) <= 0) {
              swapResponse =
                "❌ Invalid amount. Please enter a positive number.";
            } else if (
              fromTokenUpper === "BDAG" &&
              parseFloat(amount) > parseFloat(balance)
            ) {
              swapResponse = `❌ Insufficient BDAG balance. You have ${balance} BDAG but trying to swap ${amount} BDAG.`;
            } else {
              // Calculate estimated output
              const exchangeRates: {
                [key: string]: { [key: string]: number };
              } = {
                BDAG: { ETH: 0.0001, USDC: 0.5 },
                ETH: { BDAG: 10000, USDC: 3000 },
                USDC: { BDAG: 2, ETH: 0.00033 },
              };

              const rate = exchangeRates[fromTokenUpper]?.[toTokenUpper];
              const estimatedOutput = rate
                ? (parseFloat(amount) * rate * 0.98).toFixed(4)
                : "0";

              // Create confirmation message
              swapResponse = `🔄 **Swap Confirmation Required**

**Details:**
• From: ${amount} ${fromTokenUpper}
• To: ~${estimatedOutput} ${toTokenUpper} (estimated)
• Slippage: 2%
• Gas Fee: ~0.001 BDAG
• Current Balance: ${balance} BDAG

**Please confirm this swap by typing:** "confirm swap"

*Note: This is a simulation on BlockDAG testnet. Actual swaps require a deployed DEX contract.*`;

              // Store pending swap details
              (window as any).pendingSwap = {
                amount,
                fromToken: fromTokenUpper,
                toToken: toTokenUpper,
                estimatedOutput,
              };
            }
          }
        } else if (content.toLowerCase().includes("confirm swap")) {
          // Handle swap confirmation
          const pendingSwap = (window as any).pendingSwap;

          if (!pendingSwap) {
            swapResponse =
              "❌ No pending swap to confirm. Please initiate a swap first.";
          } else if (!account) {
            swapResponse = "❌ Please connect your wallet to confirm the swap.";
          } else {
            try {
              // Attempt to perform the swap
              const txHash = await swapTokens(
                pendingSwap.fromToken,
                pendingSwap.toToken,
                pendingSwap.amount,
              );

              if (txHash) {
                const lastSwap = swapTransactions[0]; // Get the most recent swap
                swapResponse = `✅ **Swap Completed Successfully!**

**Transaction Details:**
• Swapped: ${lastSwap.fromAmount} ${lastSwap.from} → ${lastSwap.toAmount} ${lastSwap.to}
• Transaction Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}
• Status: Confirmed on BlockDAG testnet
• Updated Balance: ${balance} BDAG

*You can view this transaction on the BlockDAG explorer.*`;

                // Clear pending swap
                delete (window as any).pendingSwap;
              } else {
                swapResponse =
                  "❌ Swap failed. Please try again or check your wallet connection.";
              }
            } catch (error: any) {
              swapResponse = `❌ **Swap Failed**

**Error:** ${error.message}

**Possible solutions:**
• Check your BDAG balance (Current: ${balance} BDAG)
• Ensure MetaMask is connected to BlockDAG testnet
• Make sure you have enough BDAG for gas fees
• Try with a smaller amount

**Missing for real swaps:**
• Deployed DEX contract on BlockDAG testnet
• Token contract addresses for USDC, ETH on BlockDAG
• Liquidity pools for trading pairs`;

              // Clear pending swap on error
              delete (window as any).pendingSwap;
            }
          }
        } else if (swapTransactions.length > 0) {
          // Show swap history
          const lastSwap = swapTransactions[0];
          swapResponse = `**Recent Swap History:**

**Latest:** ${lastSwap.fromAmount} ${lastSwap.from} → ${lastSwap.toAmount} ${lastSwap.to}
**Transaction:** ${lastSwap.hash.slice(0, 10)}...${lastSwap.hash.slice(-8)}
**Time:** ${lastSwap.timestamp.toLocaleString()}
**Total Swaps:** ${swapTransactions.length}`;
        } else {
          swapResponse = `**Token Swap Information**

**How to swap:**
1. Type: "swap [amount] [from_token] to [to_token]"
2. Example: "swap 1 BDAG to ETH"
3. Confirm when prompted

**Available tokens:** BDAG, ETH, USDC
**Current balance:** ${balance || "Please connect wallet"} BDAG

**Note:** This is currently a simulation. For real swaps, we need:
• Deployed DEX contract addresses
• Token contract addresses on BlockDAG testnet
• Active liquidity pools`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: swapResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Check if user is asking to transfer tokens
      if (content.toLowerCase().includes("transfer")) {
        let transferResponse = "";
        const transferMatch = content.match(
          /transfer\s+(\d+(?:\.\d+)?)\s+BDAG\s+to\s+(0x[a-fA-F0-9]{40})/i,
        );

        if (transferMatch) {
          const [, amount, recipientAddress] = transferMatch;

          if (!account) {
            transferResponse =
              "❌ Please connect your MetaMask wallet first to perform token transfers.";
          } else if (!balance) {
            transferResponse =
              "❌ Unable to fetch your balance. Please ensure you're connected to BlockDAG testnet.";
          } else if (parseFloat(amount) <= 0) {
            transferResponse =
              "❌ Invalid amount. Please enter a positive number.";
          } else if (parseFloat(amount) > parseFloat(balance)) {
            transferResponse = `❌ Insufficient BDAG balance. You have ${balance} BDAG but trying to transfer ${amount} BDAG.`;
          } else {
            // Simulate transfer - in real implementation, you would call a function to transfer the tokens
            // Assuming a successful transfer for simulation purposes
            transferResponse = `✅ **Transfer Initiated Successfully!**
**Details:**
• Amount: ${amount} BDAG
• Recipient: ${recipientAddress}

*Note: This is a simulation on BlockDAG testnet. Actual transfers require a deployed contract and gas fees.*`;
          }
        } else {
          transferResponse = `**Token Transfer Information**

**How to transfer:**
1. Type: "transfer [amount] BDAG to [recipient_address]"
2. Example: "transfer 1 BDAG to 0x1234567890123456789012345678901234567890"
**Current balance:** ${balance || "Please connect wallet"} BDAG

**Note:** This is currently a simulation. For real transfers, we need:
• Token contract address on BlockDAG testnet
• Proper handling of gas fees and transaction confirmation`;
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: transferResponse || swapResponse,
          timestamp: new Date(),
          status: "success",
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock AI response based on content
      const aiResponse = generateAIResponse(content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: aiResponse.content,
        timestamp: new Date(),
        transaction: aiResponse.transaction,
        status: aiResponse.status,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to process your request");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (
    input: string,
  ): { content: string; transaction?: any; status?: string } => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("swap") || lowerInput.includes("exchange")) {
      return {
        content:
          "I'll help you swap tokens. Here's the transaction I've prepared:",
        transaction: {
          type: "swap",
          from: "USDC",
          to: "ETH",
          amount: "100",
          estimatedOutput: "0.045 ETH",
          gasEstimate: "0.002 ETH (~$4.50)",
          protocol: "Uniswap V3",
        },
        status: "pending",
      };
    }

    if (lowerInput.includes("balance") || lowerInput.includes("wallet")) {
      return {
        content:
          "Here's your wallet balance:\n\n• ETH: 2.45 ETH ($4,900)\n• USDC: 1,250 USDC\n• LINK: 45.6 LINK ($540)\n• Total Portfolio: ~$6,690",
        status: "success",
      };
    }

    if (lowerInput.includes("nft") || lowerInput.includes("mint")) {
      return {
        content:
          "I can help you with NFT operations. Would you like to mint, buy, or sell an NFT? Please provide more details about what you'd like to do.",
        status: "pending",
      };
    }

    if (lowerInput.includes("stake") || lowerInput.includes("staking")) {
      return {
        content: "I'll help you stake your tokens. Here's what I found:",
        transaction: {
          type: "stake",
          token: "ETH",
          amount: "1.0",
          protocol: "Lido",
          apy: "4.2%",
          estimatedRewards: "0.042 ETH/year",
        },
        status: "pending",
      };
    }

    return {
      content:
        "I understand you want to interact with the blockchain. Could you please be more specific about what you'd like to do? For example:\n\n• Swap tokens\n• Check balances\n• Stake tokens\n• Mint NFTs\n• Provide liquidity",
      status: "pending",
    };
  };

  const handleExecuteTransaction = async (transaction: any) => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    toast.success("Transaction submitted successfully!");
    // Update message status
    setMessages((prev) =>
      prev.map((msg) =>
        msg.transaction === transaction
          ? { ...msg, status: "success" as const }
          : msg,
      ),
    );
  };

  const clearChat = () => {
    setMessages(initialMessages);
    toast.success("Chat cleared");
  };

  const exportChat = () => {
    const chatData = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully");
  };
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Integrated BlockDAG Header */}
      <Card className="m-4 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
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

      {/* BDAG Contract Manager */}
      <BDAGContractManager />

      {/* Chat Messages */}
      <main className="flex-1 px-4 md:px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-5rem)]">
            <Card className="flex flex-col flex-1 overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        AI Blockchain Assistant
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Online • Ready to help
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={exportChat}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={clearChat}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 py-2">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <MessageBubble
                          type={message.type}
                          content={message.content}
                          timestamp={message.timestamp}
                          status={message.status}
                        />
                        {message.transaction && (
                          <div className="mt-3 ml-12">
                            <TransactionPreview
                              transaction={message.transaction}
                              onExecute={() =>
                                handleExecuteTransaction(message.transaction)
                              }
                              disabled={!account}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex items-center gap-3 text-muted-foreground ml-12">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI is thinking...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <div className="border-t p-4">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  placeholder="Describe what you want to do..."
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <WalletConnect />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Check BDAG Balance", msg: "check my balance" },
                  { label: "Transfer to Friend", msg: `transfer 1 BDAG to ${friendAddress}` },
                  { label: "Help Commands", msg: "help" },
                  { label: "Swap Tokens", msg: "Swap 100 USDC for ETH" },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full justify-start text-sm"
                    onClick={() => handleSendMessage(action.msg)}
                    disabled={isLoading}
                  >
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;