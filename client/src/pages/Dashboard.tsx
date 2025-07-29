import { Navbar } from "@/components/Navbar";
import { WalletConnect } from "@/components/WalletConnect";
import { TokenSwap } from "@/components/TokenSwap";
import { IntentLogCard } from "@/components/IntentLogCard";
import { TxHistory } from "@/components/TxHistory";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  Activity, 
  Users, 
  Coins,
  Timer
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data
const mockStats = [
  {
    title: "Total Transactions",
    value: 48,
    description: "Across all protocols",
    icon: Activity,
    trend: "up" as const,
    trendValue: "+12% this week"
  },
  {
    title: "Gas Saved",
    value: "$127.50",
    description: "Through AI optimization",
    icon: Zap,
    trend: "up" as const,
    trendValue: "vs manual execution"
  },
  {
    title: "DeFi Interactions",
    value: 23,
    description: "Swaps, liquidity, staking",
    icon: DollarSign,
    trend: "neutral" as const,
    trendValue: "5 protocols"
  },
  {
    title: "NFT Operations",
    value: 8,
    description: "Mints, transfers, sales",
    icon: Users,
    trend: "up" as const,
    trendValue: "+3 this month"
  }
];

const mockActivityData = [
  { date: "Jan 14", transactions: 12, gasUsed: 2.1, volume: 15000 },
  { date: "Jan 15", transactions: 8, gasUsed: 1.8, volume: 12000 },
  { date: "Jan 16", transactions: 15, gasUsed: 2.8, volume: 18500 },
  { date: "Jan 17", transactions: 6, gasUsed: 1.2, volume: 8500 },
  { date: "Jan 18", transactions: 11, gasUsed: 2.3, volume: 14200 },
  { date: "Jan 19", transactions: 18, gasUsed: 3.2, volume: 22000 },
  { date: "Jan 20", transactions: 14, gasUsed: 2.6, volume: 17800 }
];

const mockTransactions = [
  {
    id: "1",
    hash: "0x742d35cc6c3f3f6a9c6bb7f7b8e6f8df2e4f8b1a8c7d6e5f4a3b2c1d0e9f8a7b",
    type: "Token Swap",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    value: "100 USDC → 0.098 ETH",
    gasUsed: "180,000"
  },
  {
    id: "2",
    hash: "0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    type: "NFT Mint",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    value: "CryptoPunk #1234",
    gasUsed: "85,000"
  },
  {
    id: "3",
    hash: "0xb2c3d4e5f678901234567890123456789012345678901234567890123456789012",
    type: "Token Delegation",
    status: "pending" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    value: "50 BDAG",
  },
  {
    id: "4",
    hash: "0xc3d4e5f67890123456789012345678901234567890123456789012345678901234",
    type: "Liquidity Add",
    status: "failed" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    value: "1 ETH + 3000 USDC",
  },
  {
    id: "5",
    hash: "0xd4e5f6789012345678901234567890123456789012345678901234567890123456",
    type: "Token Unstake",
    status: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    value: "150 BDAG",
    gasUsed: "120,000"
  }
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl mt-20">
        <div className="flex flex-col lg:flex-row gap-6">
        <main>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Monitor your Web3 activity and track your blockchain interactions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockStats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockActivityData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickMargin={8}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      fontSize={12}
                      tickMargin={8}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="transactions" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      name="Transactions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gasUsed" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                      name="Gas Used (ETH)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. Response Time</span>
                <span className="font-medium">2.3s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-success">94.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gas Efficiency</span>
                <span className="font-medium text-primary">+15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Protocols Used</span>
                <span className="font-medium">7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-medium">23 interactions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protocol Usage */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Top Protocols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Uniswap V3", interactions: 15, percentage: 31 },
                  { name: "AAVE", interactions: 8, percentage: 17 },
                  { name: "OpenSea", interactions: 6, percentage: 13 },
                  { name: "Compound", interactions: 5, percentage: 10 },
                  { name: "Others", interactions: 14, percentage: 29 }
                ].map((protocol, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full" style={{opacity: 1 - index * 0.15}} />
                      <span className="font-medium">{protocol.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{protocol.interactions}</div>
                      <div className="text-xs text-muted-foreground">{protocol.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "Token Swap", time: "30 min ago", status: "success" },
                  { action: "NFT Mint", time: "2 hours ago", status: "success" },
                  { action: "Delegation", time: "5 min ago", status: "pending" },
                  { action: "Liquidity Add", time: "4 hours ago", status: "failed" },
                  { action: "Unstake", time: "1 day ago", status: "success" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === "success" ? "bg-success" :
                      activity.status === "pending" ? "bg-warning" : "bg-destructive"
                    }`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <TxHistory transactions={mockTransactions} maxItems={10} />
        </main>
        <aside className="w-full lg:w-1/4 space-y-6 mt-30">
            <WalletConnect />
            <TokenSwap />
          </aside>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;