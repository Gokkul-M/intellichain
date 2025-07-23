import { useState } from 'react';
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Zap,
  Shield,
  TrendingUp,
  Code,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intent Recognition",
    description: "Natural language processing that understands your blockchain intentions and converts them to executable transactions.",
    badge: "Core Feature"
  },
  {
    icon: Zap,
    title: "Gas Optimization",
    description: "Intelligent gas estimation and optimization to minimize transaction costs while ensuring successful execution.",
    badge: "Smart"
  },
  {
    icon: Shield,
    title: "Security Validation",
    description: "Comprehensive security checks and transaction simulation before execution to protect your assets.",
    badge: "Secure"
  },
  {
    icon: Code,
    title: "Smart Contract Integration",
    description: "Seamless integration with popular DeFi protocols, NFT marketplaces, and custom smart contracts.",
    badge: "Flexible"
  }
];

const useCases = [
  "Swap tokens on Uniswap",
  "Provide liquidity to pools",
  "Mint and trade NFTs",
  "Stake tokens for rewards",
  "Bridge assets cross-chain",
  "Execute complex DeFi strategies"
];

const Home = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 text-balance">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-28 pb-20">
        <div className="text-center max-w-5xl mx-auto">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-base">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Blockchain Interactions
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Talk to the Blockchain
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform natural language into blockchain transactions. No more complex interfaces—just tell us what you want to do.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <Button asChild size="lg" className="px-8 py-6 text-lg shadow-md">
              <Link to="/chat">
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Chatting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg border-muted-foreground/40 hover:border-primary shadow-sm">
              <Link to="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            ✨ No wallet required to explore • Connect when you're ready to transact
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powered by AI Intelligence</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our advanced AI understands blockchain context and executes your intentions safely and efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 px-10">
          {features.map((feature, index) => (
            <Card key={index} className="border border-muted rounded-2xl hover:shadow-lg transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary" className="mb-2 w-fit mx-auto text-xs px-2 py-1">
                  {feature.badge}
                </Badge>
                <CardTitle className="text-lg font-semibold leading-snug">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">What You Can Do</h2>
          <p className="text-lg text-muted-foreground mb-10">
            Just describe what you want to accomplish—our AI handles the rest
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">{useCase}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto text-center border border-primary/30 bg-gradient-to-r from-primary/5 to-blue-500/10 rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Experience the future of blockchain interactions today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="px-8 py-6 text-lg mb-4 shadow-md">
              <Link to="/chat">
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Your First Transaction
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Free to try • No credit card required
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
