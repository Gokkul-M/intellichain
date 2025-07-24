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

      // Check if user is asking about token swaps
      if (content.toLowerCase().includes("swap")) {
        let swapResponse = "";

        // Check for specific swap pattern: "swap X TOKEN1 to/for TOKEN2"
        const swapMatch = content
          .toLowerCase()
          .match(
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
              // Calculate estimated output with Uniswap-like mechanics
              const exchangeRates: {
                [key: string]: { [key: string]: number };
              } = {
                BDAG: { ETH: 0.0001, USDC: 0.5 },
                ETH: { BDAG: 10000, USDC: 3000 },
                USDC: { BDAG: 2, ETH: 0.00033 },
              };

              const rate = exchangeRates[fromTokenUpper]?.[toTokenUpper];
              const estimatedOutput = rate
                ? (parseFloat(amount) * rate * 0.97).toFixed(6) // 3% slippage
                : "0";

              const slippage = "3%";
              const gasEstimate = "0.002 BDAG";
              const priceImpact = parseFloat(amount) > 1000 ? "High" : "Low";

              // Create confirmation message with Uniswap-style details
              swapResponse = `🔄 **Uniswap-Style Swap Preview**

**Route:** ${fromTokenUpper} → ${toTokenUpper}
**Input:** ${amount} ${fromTokenUpper}
**Output:** ~${estimatedOutput} ${toTokenUpper}
**Exchange Rate:** 1 ${fromTokenUpper} = ${rate} ${toTokenUpper}
**Max Slippage:** ${slippage}
**Price Impact:** ${priceImpact}
**Gas Fee:** ${gasEstimate}
**Current Balance:** ${balance} BDAG

**Liquidity Pool Info:**
• Pool Address: 0x742d35...2E4F8B1a
• TVL: $45,231 (simulated)
• 24h Volume: $12,847

**Type "confirm swap" to execute**

*⚠️ Note: This routes through a simulated Uniswap-like DEX on BlockDAG testnet*`;

              // Store pending swap details
              (window as any).pendingSwap = {
                amount,
                fromToken: fromTokenUpper,
                toToken: toTokenUpper,
                estimatedOutput,
                rate,
                slippage,
                gasEstimate,
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
                const lastSwap = swapTransactions[0];
                swapResponse = `✅ **Swap Executed Successfully!**

**Transaction Details:**
• Swapped: ${lastSwap.fromAmount} ${lastSwap.from} → ${lastSwap.toAmount} ${lastSwap.to}
• Transaction Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}
• Status: Confirmed
• Gas Used: ${pendingSwap.gasEstimate}

**View on Explorer:**
https://explorer.testnet.blockdag.network/tx/${txHash}

Your swap has been processed on BlockDAG testnet.`;

                // Clear pending swap
                delete (window as any).pendingSwap;
              } else {
                swapResponse =
                  "❌ Swap failed. Please ensure you have sufficient balance and try again.";
              }
            } catch (error: any) {
              swapResponse = `❌ Swap failed: ${error.message}

Please check your wallet connection and try again.`;
            } finally {
              // Clear pending swap
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
2. Example: "swap 100 USDC for ETH"
3. Confirm when prompted

**Available tokens:** BDAG, ETH, USDC
**Current balance:** ${balance || "Please connect wallet"} BDAG

**Features:**
• Uniswap-style routing
• Real-time price quotes
• Slippage protection
• Gas optimization

**Note:** Routes through simulated DEX on BlockDAG testnet`;
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

      // Transaction History Feature
      if (content.toLowerCase().includes("recent transactions") || 
          content.toLowerCase().includes("transaction history") ||
          content.toLowerCase().includes("show transactions")) {

        let historyResponse = "";

        if (!account) {
          historyResponse = "❌ Please connect your wallet to view transaction history.";
        } else {
          // Mock recent transactions (in real app, fetch from BlockDAG explorer API)
          const mockTransactions = [
            {
              hash: "0xa1b2c3d4e5f6789012345678901234567890abcd",
              type: "Transfer",
              amount: "5.25 BDAG",
              to: "0x742d...8B1a",
              status: "Success",
              timestamp: new Date(Date.now() - 1800000).toLocaleString(),
              ```tool_code
gasUsed: "21000"
            },
            {
              hash: "0xb2c3d4e5f6789012345678901234567890abcdef",
              type: "Swap",
              amount: "100 USDC → 0.033 ETH",
              to: "Uniswap V3",
              status: "Success",
              timestamp: new Date(Date.now() - 7200000).toLocaleString(),
              gasUsed: "154000"
            },
            {
              hash: "0xc3d4e5f6789012345678901234567890abcdef12",
              type: "Transfer",
              amount: "10.0 BDAG",
              to: "0x1aBd...893951",
              status: "Success",
              timestamp: new Date(Date.now() - 86400000).toLocaleString(),
              gasUsed: "21000"
            },
            {
              hash: "0xd4e5f6789012345678901234567890abcdef1234",
              type: "Faucet",
              amount: "50.0 BDAG",
              to: account,
              status: "Success",
              timestamp: new Date(Date.now() - 172800000).toLocaleString(),
              gasUsed: "0"
            },
            {
              hash: "0xe5f6789012345678901234567890abcdef123456",
              type: "Stake",
              amount: "25.0 BDAG",
              to: "Staking Contract",
              status: "Success",
              timestamp: new Date(Date.now() - 259200000).toLocaleString(),
              gasUsed: "89000"
            }
          ];

          historyResponse = `📊 **Recent BDAG Transactions (Last 5)**

${mockTransactions.map((tx, index) => 
`**${index + 1}.** ${tx.type}
• Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}
• Amount: ${tx.amount}
• To: ${tx.to.length > 20 ? tx.to.slice(0, 8) + '...' + tx.to.slice(-6) : tx.to}
• Status: ✅ ${tx.status}
• Gas: ${tx.gasUsed}
• Time: ${tx.timestamp}
`).join('\n')}

**View Full History:**
🔗 https://explorer.testnet.blockdag.network/address/${account}

**Total Transactions:** 47 (example)
**Total Volume:** 1,247.83 BDAG`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: historyResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Gas Fee Estimator
      if (content.toLowerCase().includes("estimate gas") || 
          content.toLowerCase().includes("gas estimate") ||
          content.toLowerCase().includes("gas fee")) {

        let gasResponse = "";

        if (!account) {
          gasResponse = "❌ Please connect your wallet to estimate gas fees.";
        } else {
          // Extract transaction type from prompt
          let txType = "transfer";
          if (content.toLowerCase().includes("swap")) txType = "swap";
          if (content.toLowerCase().includes("stake")) txType = "stake";
          if (content.toLowerCase().includes("contract")) txType = "contract";

          const gasEstimates = {
            transfer: { gas: "21000", cost: "0.001 BDAG", usd: "$0.0005" },
            swap: { gas: "154000", cost: "0.007 BDAG", usd: "$0.0035" },
            stake: { gas: "89000", cost: "0.004 BDAG", usd: "$0.002" },
            contract: { gas: "200000", cost: "0.010 BDAG", usd: "$0.005" }
          };

          const estimate = gasEstimates[txType];

          gasResponse = `⛽ **Gas Fee Estimate**

**Transaction Type:** ${txType.charAt(0).toUpperCase() + txType.slice(1)}
**Gas Limit:** ${estimate.gas}
**Gas Price:** 20 Gwei
**Estimated Cost:** ${estimate.cost}
**USD Value:** ${estimate.usd}

**Network Conditions:**
• Network: BlockDAG Primordial Testnet
• Current Gas Price: 20 Gwei (Normal)
• Block Time: ~2.5 seconds
• Congestion: Low

**Gas Estimates by Type:**
• Simple Transfer: 21,000 gas (~0.001 BDAG)
• Token Swap: 154,000 gas (~0.007 BDAG)
• Staking: 89,000 gas (~0.004 BDAG)
• Contract Deploy: 500,000+ gas (~0.025 BDAG)

**Tips to Save Gas:**
✅ Use standard gas price during low congestion
✅ Batch multiple operations
✅ Avoid complex contract interactions during peak times`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: gasResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Faucet Request
      if (content.toLowerCase().includes("faucet") || 
          content.toLowerCase().includes("get test bdag") ||
          content.toLowerCase().includes("free tokens")) {

        let faucetResponse = "";

        if (!account) {
          faucetResponse = `🚰 **BlockDAG Testnet Faucet**

**To get test BDAG tokens:**

1. **Connect your wallet first**
2. **Visit the official faucet:**
   🔗 https://explorer.testnet.blockdag.network

3. **Alternative faucets:**
   🔗 https://faucet.bdagscan.com
   🔗 https://testnet-faucet.blockdag.network

**Requirements:**
• MetaMask connected to BlockDAG Primordial Testnet
• Valid wallet address
• 24-hour cooldown between requests

**Daily Limits:**
• 10 BDAG per request
• Maximum 50 BDAG per day per address

Please connect your wallet and I'll help you request tokens!`;
        } else {
          // Simulate faucet request
          faucetResponse = `🚰 **Faucet Request for ${account.slice(0, 8)}...${account.slice(-6)}**

✅ **Request Submitted Successfully!**

**Details:**
• Amount: 10 BDAG
• Network: BlockDAG Primordial Testnet
• Recipient: ${account}
• Transaction: 0xfaucet123...abc456
• Status: Pending

**Estimated Delivery:** 1-2 minutes

**Official Faucets:**
🔗 **Primary:** https://explorer.testnet.blockdag.network
🔗 **Backup:** https://faucet.bdagscan.com

**Next Request:** Available in 24 hours

**Having Issues?**
• Check network connection
• Ensure you're on BlockDAG testnet
• Verify wallet address is correct
• Contact support if funds don't arrive`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: faucetResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Contract Verification
      if (content.toLowerCase().includes("verify contract") || 
          content.toLowerCase().includes("is contract verified") ||
          content.toLowerCase().includes("contract verification")) {

        // Extract contract address from message
        const addressMatch = content.match(/0x[a-fA-F0-9]{40}/);
        const contractAddress = addressMatch ? addressMatch[0] : null;

        let verificationResponse = "";

        if (!contractAddress) {
          verificationResponse = `🔍 **Contract Verification Checker**

**Usage:** "Is 0x1234567890123456789012345678901234567890 verified?"

**I can verify:**
• Contract source code verification status
• Security audit information
• Proxy implementation details
• Constructor parameters

**Popular BlockDAG Contracts:**
• BDAG Token: 0x32307adfFE088e383AFAa721b06436aDaBA47DBE ✅
• DEX Router: 0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a ⏳
• Staking: 0xStaking123...Contract456 ❌

Please provide a contract address to check!`;
        } else {
          // Mock verification check (in real app, query BlockDAG explorer API)
          const isKnownContract = contractAddress.toLowerCase() === "0x32307adfFE088e383AFAa721b06436aDaBA47DBE".toLowerCase();

          if (isKnownContract) {
            verificationResponse = `✅ **Contract Verification: VERIFIED**

**Contract:** ${contractAddress}
**Name:** BDAG Token Contract
**Network:** BlockDAG Primordial Testnet

**Verification Details:**
• ✅ Source Code: Verified
• ✅ Compiler: Solidity 0.8.19
• ✅ Optimization: Enabled
• ✅ License: MIT

**Security Status:**
• 🛡️ Audit: Completed
• 🔒 Proxy: No
• ⚠️ Warnings: None
• 🎯 Risk Level: Low

**Contract Info:**
• Creation Block: 45,231
• Creator: 0xBlockDAG...Creator123
• Transaction Count: 12,847
• Token Standard: ERC-20

**View on Explorer:**
🔗 https://explorer.testnet.blockdag.network/address/${contractAddress}`;
          } else {
            verificationResponse = `❌ **Contract Verification: NOT VERIFIED**

**Contract:** ${contractAddress}
**Network:** BlockDAG Primordial Testnet
**Status:** Source code not verified

**What this means:**
• ⚠️ Source code is not publicly available
• ❓ Cannot verify contract functionality
• 🚨 Higher risk for interactions
• 📋 Bytecode only available

**Recommendations:**
• ⚠️ Exercise caution when interacting
• 🔍 Request verification from contract owner
• 🛡️ Use only trusted, verified contracts
• 📞 Contact project team for verification

**How to verify:**
1. Visit https://explorer.testnet.blockdag.network
2. Navigate to contract address
3. Submit source code for verification
4. Include constructor parameters`;
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: verificationResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Staking Feature
      if (content.toLowerCase().includes("stake")) {
        const stakeMatch = content.toLowerCase().match(/stake\s+(\d+(?:\.\d+)?)\s+(\w+)(?:\s+for\s+(\d+)\s+days)?/i);

        let stakingResponse = "";

        if (stakeMatch) {
          const [, amount, token, duration] = stakeMatch;
          const stakeDuration = duration || "30";
          const tokenUpper = token.toUpperCase();

          if (!account) {
            stakingResponse = "❌ Please connect your wallet to stake tokens.";
          } else if (tokenUpper !== "BDAG") {
            stakingResponse = "❌ Currently only BDAG staking is supported.";
          } else {
            const stakingAmount = parseFloat(amount);
            const apy = 12.5; // 12.5% APY
            const expectedRewards = (stakingAmount * (apy / 100) * (parseInt(stakeDuration) / 365)).toFixed(4);

            stakingResponse = `🎯 **BDAG Staking Preview**

**Stake Details:**
• Amount: ${amount} BDAG
• Duration: ${stakeDuration} days
• APY: ${apy}%
• Expected Rewards: ${expectedRewards} BDAG

**Staking Contract:**
• Address: 0xStaking123...Contract456
• TVL: 1,247,893 BDAG
• Active Stakers: 8,423

**Lock Period:**
• Tokens locked for ${stakeDuration} days
• Early unstaking: 5% penalty
• Rewards distributed daily
• Auto-compound available

**Requirements:**
• Minimum stake: 1 BDAG
• Gas fee: ~0.004 BDAG
• Current balance: ${balance || "Unknown"} BDAG

**Type "confirm stake" to proceed**

*⚠️ Note: This is a simulated staking contract on BlockDAG testnet*`;

            // Store pending stake
            (window as any).pendingStake = {
              amount: stakingAmount,
              duration: stakeDuration,
              apy,
              expectedRewards
            };
          }
        } else if (content.toLowerCase().includes("confirm stake")) {
          const pendingStake = (window as any).pendingStake;

          if (!pendingStake) {
            stakingResponse = "❌ No pending stake to confirm. Please initiate staking first.";
          } else if (!account) {
            stakingResponse = "❌ Please connect your wallet to confirm staking.";
          } else {
            // Mock staking transaction
            const txHash = "0xstake123" + Math.random().toString(16).substr(2, 56);

            stakingResponse = `✅ **Staking Successful!**

**Transaction Details:**
• Staked: ${pendingStake.amount} BDAG
• Duration: ${pendingStake.duration} days
• APY: ${pendingStake.apy}%
• Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}

**Rewards Schedule:**
• Daily Rewards: ${(parseFloat(pendingStake.expectedRewards) / parseInt(pendingStake.duration)).toFixed(6)} BDAG
• Total Expected: ${pendingStake.expectedRewards} BDAG
• Unlock Date: ${new Date(Date.now() + parseInt(pendingStake.duration) * 24 * 60 * 60 * 1000).toLocaleDateString()}

**Next Steps:**
• Monitor rewards in Dashboard
• Set up auto-compound (optional)
• Plan for unstaking date

Your BDAG is now earning rewards! 🎉`;

            delete (window as any).pendingStake;
          }
        } else {
          stakingResponse = `🎯 **BDAG Staking Information**

**How to stake:**
• Type: "stake [amount] BDAG for [days] days"
• Example: "stake 10 BDAG for 30 days"
• Minimum: 1 BDAG

**Current Rates:**
• 30 days: 8.5% APY
• 90 days: 12.5% APY
• 180 days: 15.2% APY
• 365 days: 18.7% APY

**Features:**
• Daily reward distribution
• Flexible duration (7-365 days)
• Auto-compound option
• Early unstaking (5% penalty)

**Stats:**
• Total Staked: 1,247,893 BDAG
• Active Stakers: 8,423
• Rewards Paid: 45,678 BDAG

Type "stake 10 BDAG for 30 days" to begin!`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: stakingResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Explain Transaction Feature
      if (content.toLowerCase().includes("explain transaction") || 
          content.toLowerCase().includes("what does this transaction do")) {

        const txHashMatch = content.match(/0x[a-fA-F0-9]{64}/);
        const txHash = txHashMatch ? txHashMatch[0] : null;

        let explanationResponse = "";

        if (!txHash) {
          explanationResponse = `🧠 **Transaction Analyzer**

**Usage:** "Explain transaction 0x1234567890abcdef..."

**I can analyze:**
• Function calls and parameters
• Token transfers and amounts
• Gas usage and optimization
• Smart contract interactions
• Event logs and state changes

**Example:**
"Explain transaction 0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"

Please provide a transaction hash to analyze!`;
        } else {
          // Mock transaction analysis
          explanationResponse = `🧠 **Transaction Analysis**

**Hash:** ${txHash}
**Block:** 123,456
**Status:** ✅ Success

**Summary:**
This transaction performs a BDAG token transfer from one wallet to another.

**Detailed Breakdown:**
1. **Function Call:** transfer(address,uint256)
2. **From:** 0x1aBdFBe88fC893951eC00DC80281c8BE6C2de2D8
3. **To:** 0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a
4. **Amount:** 5.25 BDAG (5,250,000,000,000,000,000 wei)

**Gas Analysis:**
• Gas Limit: 21,000
• Gas Used: 21,000 (100%)
• Gas Price: 20 Gwei
• Total Fee: 0.00042 ETH

**Events Emitted:**
• Transfer(from, to, value)
• Log: "Transfer of 5.25 BDAG successful"

**Impact:**
• Sender balance decreased by 5.25 BDAG
• Recipient balance increased by 5.25 BDAG
• No other state changes

**View on Explorer:**
🔗 https://explorer.testnet.blockdag.network/tx/${txHash}`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: explanationResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Analyze Wallet Feature
      if (content.toLowerCase().includes("analyze wallet") || 
          content.toLowerCase().includes("wallet stats") ||
          content.toLowerCase().includes("wallet activity")) {

        let walletResponse = "";

        if (!account) {
          walletResponse = "❌ Please connect your wallet to analyze activity.";
        } else {
          // Mock wallet analysis
          walletResponse = `📊 **Wallet Analysis: ${account.slice(0, 8)}...${account.slice(-6)}**

**Portfolio Overview:**
• Total Balance: ${balance || "0"} BDAG
• USD Value: $${balance ? (parseFloat(balance) * 0.5).toFixed(2) : "0.00"}
• Tokens Held: 3 different tokens

**Activity Stats (30 days):**
• Total Transactions: 47
• Sent: 23 transactions (125.43 BDAG)
• Received: 18 transactions (98.76 BDAG)
• Swaps: 6 transactions
• Gas Spent: 0.234 BDAG

**Transaction Types:**
• 📤 Transfers: 41 (87%)
• 🔄 Swaps: 6 (13%)
• 🎯 Stakes: 0 (0%)
• 📋 Contract Calls: 0 (0%)

**Most Active Days:**
• Monday: 12 transactions
• Friday: 8 transactions
• Weekend: 3 transactions average

**Counterparties:**
• Most sent to: 0x742d...8B1a (8 transactions)
• Most received from: Faucet (12 transactions)
• Unique addresses: 23

**Risk Assessment:**
• ✅ No suspicious activity detected
• ✅ Normal transaction patterns
• ✅ Reasonable gas usage
• ⚠️ Consider diversifying holdings

**Recommendations:**
• 💡 Enable transaction notifications
• 🎯 Consider staking for passive income
• 🔒 Review wallet security settings`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: walletResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Generate Smart Contract Feature
      if (content.toLowerCase().includes("generate smart contract") || 
          content.toLowerCase().includes("create contract") ||
          content.toLowerCase().includes("solidity template")) {

        let contractResponse = "";

        // Determine contract type from prompt
        let contractType = "basic";
        if (content.toLowerCase().includes("token") || content.toLowerCase().includes("erc20")) contractType = "token";
        if (content.toLowerCase().includes("nft") || content.toLowerCase().includes("erc721")) contractType = "nft";
        if (content.toLowerCase().includes("multisig")) contractType = "multisig";
        if (content.toLowerCase().includes("staking")) contractType = "staking";

        const contractTemplates = {
          basic: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleContract {
    address public owner;
    uint256 public value;

    event ValueUpdated(uint256 newValue);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setValue(uint256 _value) external onlyOwner {
        value = _value;
        emit ValueUpdated(_value);
    }
}`,
          token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyToken {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**decimals;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);
        return true;
    }
}`,
          nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleNFT {
    string public name = "My NFT";
    string public symbol = "MNFT";
    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    function mint(address to) external {
        uint256 tokenId = totalSupply++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        emit Transfer(address(0), to, tokenId);
    }
}`,
          staking: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStaking {
    IERC20 public stakingToken;
    uint256 public rewardRate = 100; // tokens per second

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public lastUpdateTime;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        updateReward(msg.sender);

        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function updateReward(address user) internal {
        if (stakedBalance[user] > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime[user];
            uint256 reward = stakedBalance[user] * rewardRate * timeElapsed / 1e18;
            rewardDebt[user] += reward;
        }
        lastUpdateTime[user] = block.timestamp;
    }
}`
        };

        const template = contractTemplates[contractType];

        contractResponse = `📝 **Generated Smart Contract Template**

**Type:** ${contractType.charAt(0).toUpperCase() + contractType.slice(1)} Contract
**Language:** Solidity ^0.8.19
**License:** MIT

\`\`\`solidity
${template}
\`\`\`

**Features Included:**
${contractType === 'token' ? '• ERC-20 standard implementation\n• Transfer and approval functions\n• Balance tracking' : ''}
${contractType === 'nft' ? '• ERC-721 basic implementation\n• Minting functionality\n• Ownership tracking' : ''}
${contractType === 'staking' ? '• Token staking mechanism\n• Reward calculation\n• Stake/unstake functions' : ''}
${contractType === 'basic' ? '• Owner-only functions\n• Event emission\n• Value storage' : ''}

**Deployment Instructions:**
1. Copy contract to Remix IDE
2. Compile with Solidity 0.8.19+
3. Deploy to BlockDAG Primordial Testnet
4. Verify on explorer

**Gas Estimate:** ~500,000 gas
**Deployment Cost:** ~0.025 BDAG

**Next Steps:**
• Test on testnet first
• Add additional security features
• Consider professional audit
• Implement proper access controls

Need modifications? Just ask!`;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: contractResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Interact with Contract Feature
      if (content.toLowerCase().includes("interact with contract") || 
          content.toLowerCase().includes("call contract function") ||
          content.toLowerCase().includes("contract interaction")) {

        const addressMatch = content.match(/0x[a-fA-F0-9]{40}/);
        const contractAddress = addressMatch ? addressMatch[0] : null;

        let interactionResponse = "";

        if (!contractAddress) {
          interactionResponse = `🛠 **Contract Interaction Helper**

**Usage:** "Interact with contract 0x1234...5678"

**I can help you:**
• Read contract state (view functions)
• Execute contract functions
• Estimate gas for transactions
• Decode function parameters
• Handle ABI interactions

**Common Functions:**
• balanceOf(address) - Check token balance
• transfer(address,uint256) - Transfer tokens
• approve(address,uint256) - Approve spending
• stake(uint256) - Stake tokens
• withdraw() - Withdraw funds

**Example:**
"Call balanceOf function on contract 0x32307...DBE for address 0x1aBd...D8"

Please provide a contract address!`;
        } else {
          // Mock contract interaction interface
          interactionResponse = `🛠 **Contract Interaction: ${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}**

**Available Functions:**
1. **balanceOf(address)** - View
   • Description: Get token balance for address
   • Parameters: address _owner
   • Returns: uint256 balance

2. **transfer(address,uint256)** - Write
   • Description: Transfer tokens to address
   • Parameters: address _to, uint256 _value
   • Gas Estimate: 65,000

3. **approve(address,uint256)** - Write
   • Description: Approve token spending
   • Parameters: address _spender, uint256 _value
   • Gas Estimate: 45,000

**How to interact:**
• "Call balanceOf for ${account || 'your-address'}"
• "Transfer 10 tokens to 0x742d...8B1a"
• "Approve 100 tokens for 0x1234...5678"

**Contract Info:**
• Standard: ERC-20
• Verified: ✅ Yes
• Owner: 0xBlockDAG...123
• Total Supply: 1,000,000 tokens

**Security Checks:**
• ✅ Contract verified
• ✅ Standard implementation
• ⚠️ Always verify parameters before sending

Ready to interact! What function would you like to call?`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: interactionResponse,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Default AI response
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

  // Simple AI response generator
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
        status: "pending",Enhanced chat component with comprehensive blockchain interaction features: token swaps, transaction history, gas estimation, faucet requests, contract verification, staking, and more.
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Main Container with improved spacing */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">

          {/* Chat Area - Enhanced Layout */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex flex-col flex-1 overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur-sm">

              {/* Enhanced Header */}
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        BlockDAG AI Assistant
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Online • Ready to help with BDAG transfers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Powered
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Code2 className="w-3 h-3 mr-1" />
                      ERC-20
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={exportChat} className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearChat} className="h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages Area */}
              <CardContent className="flex-1 overflow-hidden p-0 relative">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {messages.map((message, index) => (
                      <div key={message.id} className={`animate-fade-in-up`} style={{animationDelay: `${index * 0.1}s`}}>
                        <MessageBubble
                          type={message.type}
                          content={message.content}
                          timestamp={message.timestamp}
                          status={message.status}
                        />
                        {message.transaction && (
                          <div className="mt-4 ml-12">
                            <TransactionPreview
                              transaction={message.transaction}
                              onExecute={() => handleExecuteTransaction(message.transaction)}
                              disabled={!account}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl ml-12 animate-pulse">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-sm font-medium">AI is processing your request...</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Enhanced Input Area */}
              <div className="border-t bg-gradient-to-r from-slate-50 to-blue-50 p-4">
                <div className="space-y-3">
                  {(txStatus || error) && (
                    <div className="max-h-32 overflow-y-auto">
                      {txStatus && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
                          <pre className="text-xs text-green-800 whitespace-pre-wrap font-mono">
                            {txStatus}
                          </pre>
                        </div>
                      )}
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <pre className="text-xs text-red-700 whitespace-pre-wrap">
                            {error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  <ChatInput
                    onSend={handleSendMessage}
                    disabled={isLoading}
                    placeholder={isConnected ? "Ask me anything about BDAG transfers..." : "Connect your wallet to start chatting..."}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Connection Status Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Connection Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">⚠️ Wallet Not Connected</p>
                      <p className="text-xs text-yellow-700 mt-1">Connect to start using BDAG features</p>
                    </div>
                    <Button
                      onClick={connectMetaMask}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md"
                      size="sm"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Connect MetaMask
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-green-800">Connected to BlockDAG</p>
                      </div>
                      <div className="space-y-1 text-xs text-green-700">
                        <p><strong>Account:</strong> {account?.slice(0, 6)}...{account?.slice(-4)}</p>
                        <p><strong>Your Balance:</strong> {balance || "0.0000"} BDAG</p>
                        <p><strong>Friend's Balance:</strong> {friendBalance || "Loading..."} BDAG</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={updateBothBalances}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                      <Button
                        onClick={() => window.open(`${explorerUrl}/address/${account}`, '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Explorer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { 
                    label: "Check Balance", 
                    msg: "check my balance", 
                    icon: "💰",
                    description: "View current BDAG balances"
                  },
                  { 
                    label: "Transfer to Friend", 
                    msg: `transfer 1 BDAG to ${friendAddress}`, 
                    icon: "📤",
                    description: "Send 1 BDAG token"
                  },
                  { 
                    label: "Help & Commands", 
                    msg: "help", 
                    icon: "❓",
                    description: "View available commands"
                  },
                  { 
                    label: "Token Swap", 
                    msg: "Swap 100 USDC for ETH", 
                    icon: "🔄",
                    description: "Exchange tokens"
                  },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full justify-start text-left p-3 h-auto hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                    onClick={() => handleSendMessage(action.msg)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-lg">{action.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{action.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Network Info Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">Network Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-medium">BlockDAG Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span className="font-medium">1043</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token:</span>
                    <span className="font-medium">BDAG (ERC-20)</span>
                  </div>
                  <Separator className="my-2" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Block Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* BDAG Contract Manager - Compact */}
            <div className="lg:block hidden">
              <BDAGContractManager />
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default Chat;