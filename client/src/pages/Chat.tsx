import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { TransactionPreview } from "@/components/TransactionPreview";
import { WalletConnect } from "@/components/WalletConnect";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { BlockDAGHeader } from "@/components/BlockDAGHeader";
import { BDAGContractManager } from "@/components/BDAGContractManager";
import { Toaster } from "@/components/ui/sonner";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { account, balance, swapTransactions } = useWallet();

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
      // Check if user is asking about balance
      if (content.toLowerCase().includes("balance")) {
        let balanceResponse = "";

        if (account && balance !== null) {
          balanceResponse = `Your current BDAG balance is ${balance} BDAG.`;
        } else if (account) {
          balanceResponse =
            "I'm fetching your balance... Please wait a moment.";
        } else {
          balanceResponse =
            "Please connect your MetaMask wallet first to check your BDAG balance.";
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: balanceResponse,
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
      {/* BlockDAG Header */}
      <BlockDAGHeader />

      {/* BDAG Contract Manager */}
      <BDAGContractManager />

      {/* Chat Messages */}
      <main className="flex-1 pt-16 px-4 md:px-6">
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
                  { label: "Check Balance", msg: "Check my wallet balance" },
                  { label: "Swap Tokens", msg: "Swap 100 USDC for ETH" },
                  {
                    label: "Stake Tokens",
                    msg: "Show me staking opportunities",
                  },
                  { label: "Mint NFT", msg: "Help me mint an NFT" },
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