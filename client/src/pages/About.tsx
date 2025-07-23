import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Bot, 
  Brain, 
  Shield, 
  Zap, 
  Globe, 
  Code, 
  MessageSquare,
  ArrowRight,
  ExternalLink
} from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "Natural Language AI",
      description: "Advanced language models understand complex Web3 intents and translate them into precise smart contract calls."
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Every transaction is previewed before execution. You maintain full control and can review all parameters."
    },
    {
      icon: Zap,
      title: "Gas Optimization",
      description: "AI-powered gas estimation and optimization to reduce transaction costs by up to 20%."
    },
    {
      icon: Globe,
      title: "Multi-Protocol Support",
      description: "Works across major DeFi protocols, NFT marketplaces, and DAO governance systems."
    }
  ];

  const useCases = [
    {
      title: "DeFi Trading",
      description: "\"Swap 1000 USDC for ETH when the price hits $2500\"",
      examples: ["Token swaps on DEXs", "Liquidity provision", "Yield farming", "Staking operations"]
    },
    {
      title: "NFT Operations", 
      description: "\"Mint 3 NFTs from the CryptoPunks collection\"",
      examples: ["NFT minting", "Marketplace trading", "Collection management", "Metadata updates"]
    },
    {
      title: "DAO Governance",
      description: "\"Vote yes on proposal #42 and delegate 100 tokens\"",
      examples: ["Proposal voting", "Token delegation", "Governance participation", "Treasury management"]
    }
  ];

  const techStack = [
    { name: "React + TypeScript", description: "Modern frontend framework" },
    { name: "Tailwind CSS", description: "Utility-first styling" },
    { name: "OpenAI GPT", description: "Natural language processing" },
    { name: "ethers.js", description: "Ethereum interaction library" },
    { name: "BlockDAG Network", description: "Next-gen blockchain protocol" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Bot className="h-16 w-16 mx-auto text-primary mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Intellichain</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're building the future of Web3 interactions by making blockchain technology 
            accessible through natural language conversations.
          </p>
          <Link to="/chat">
            <Button variant="hero" size="lg">
              Try It Now <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Problem & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="gradient-card">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">The Problem</h2>
              <p className="text-muted-foreground mb-4">
                Web3 interactions are complex, intimidating, and error-prone. Users need to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  Navigate complex interfaces and technical jargon
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  Understand smart contract functions and parameters
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  Manage gas fees and transaction optimization
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  Risk losing funds due to user error
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="gradient-card border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground mb-4">
                Intellichain transforms Web3 interactions into simple conversations:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                  Describe what you want in plain English
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                  AI translates intent to precise smart contract calls
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                  Preview and approve transactions with confidence
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                  Execute safely on the BlockDAG Primordial Testnet
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="gradient-card text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Use Cases</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="gradient-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">{useCase.title}</h3>
                  <div className="bg-muted/50 p-3 rounded-lg mb-4 italic text-sm">
                    "{useCase.description}"
                  </div>
                  <ul className="space-y-2">
                    {useCase.examples.map((example, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe Your Intent",
                description: "Tell us what you want to do in natural language. Be as specific or general as you like.",
                icon: MessageSquare
              },
              {
                step: "2", 
                title: "AI Processing",
                description: "Our AI analyzes your request and generates the optimal smart contract interaction.",
                icon: Brain
              },
              {
                step: "3",
                title: "Review & Execute", 
                description: "Preview the transaction details, approve, and execute securely on-chain.",
                icon: Shield
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Built With</h2>
          <Card className="gradient-card">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techStack.map((tech, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">{tech.name}</div>
                      <div className="text-sm text-muted-foreground">{tech.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-accent/5 to-background rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience the Future?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join us in making Web3 accessible to everyone. Start your journey with Intellichain today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat">
              <Button variant="hero" size="lg">
                Try Intellichain <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <ExternalLink className="h-5 w-5 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
