import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { IntentLogCard } from "@/components/IntentLogCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, FileText, Calendar } from "lucide-react";

// Mock data for intent logs
const mockIntents = [
  {
    id: "1",
    prompt: "Swap 100 USDC for ETH on Uniswap",
    functionName: "swapExactTokensForTokens",
    txHash: "0x742d35cc6c3f3f6a9c6bb7f7b8e6f8df2e4f8b1a8c7d6e5f4a3b2c1d0e9f8a7b",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    gasUsed: "180,000 gas"
  },
  {
    id: "2", 
    prompt: "Mint an NFT from the CryptoPunks collection",
    functionName: "mintNFT",
    txHash: "0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    gasUsed: "85,000 gas"
  },
  {
    id: "3",
    prompt: "Delegate 50 tokens to validator node xyz123",
    functionName: "delegate",
    txHash: "0xb2c3d4e5f678901234567890123456789012345678901234567890123456789012",
    status: "pending" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: "4",
    prompt: "Provide liquidity to ETH/USDC pool with 1 ETH and 3000 USDC",
    functionName: "addLiquidity",
    txHash: "0xc3d4e5f67890123456789012345678901234567890123456789012345678901234",
    status: "failed" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
  {
    id: "5",
    prompt: "Withdraw my staked tokens from protocol",
    functionName: "unstake",
    txHash: "0xd4e5f6789012345678901234567890123456789012345678901234567890123456",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    gasUsed: "120,000 gas"
  },
  {
    id: "6",
    prompt: "Buy NFT #1234 from OpenSea marketplace",
    functionName: "fulfillOrder",
    txHash: "0xe5f678901234567890123456789012345678901234567890123456789012345678",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    gasUsed: "95,000 gas"
  }
];

const Registry = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredIntents = mockIntents.filter(intent => {
    const matchesSearch = intent.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intent.functionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || intent.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return mockIntents.filter(intent => intent.status === status).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Intent Registry</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Complete transparency into your Web3 interactions and transaction history
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-primary">{mockIntents.length}</div>
            <div className="text-sm text-muted-foreground">Total Intents</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-success">{getStatusCount("success")}</div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-warning">{getStatusCount("pending")}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-destructive">{getStatusCount("failed")}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search intents, functions, or transaction hashes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              All
            </Button>
            <Badge 
              variant="outline" 
              className="cursor-pointer px-3 py-1 bg-success/10 text-success border-success/20 hover:bg-success/20"
              onClick={() => setStatusFilter(statusFilter === "success" ? "all" : "success")}
            >
              Success ({getStatusCount("success")})
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer px-3 py-1 bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
              onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
            >
              Pending ({getStatusCount("pending")})
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer px-3 py-1 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
              onClick={() => setStatusFilter(statusFilter === "failed" ? "all" : "failed")}
            >
              Failed ({getStatusCount("failed")})
            </Badge>
          </div>
        </div>

        {/* Intent Logs */}
        <div className="space-y-4">
          {filteredIntents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No intents found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Your intent history will appear here after you start using the chat assistant"
                }
              </p>
            </div>
          ) : (
            filteredIntents.map((intent) => (
              <IntentLogCard
                key={intent.id}
                id={intent.id}
                prompt={intent.prompt}
                functionName={intent.functionName}
                txHash={intent.txHash}
                status={intent.status}
                timestamp={intent.timestamp}
                gasUsed={intent.gasUsed}
              />
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {filteredIntents.length > 10 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline">Load More</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registry;
