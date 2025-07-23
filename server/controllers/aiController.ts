
import { Request, Response } from 'express';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

interface IntentRequest {
  message: string;
  walletAddress?: string;
  context?: any;
}

interface IntentResponse {
  intent: string;
  confidence: number;
  parameters: any;
  transaction?: any;
  requiresWallet: boolean;
  explanation: string;
}

export class AIController {
  async parseIntent(req: Request, res: Response) {
    try {
      const { message, walletAddress, context }: IntentRequest = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Mock AI processing for demo
      const intent = await this.processMessage(message);
      
      const response: IntentResponse = {
        intent: intent.type,
        confidence: intent.confidence,
        parameters: intent.parameters,
        transaction: intent.transaction,
        requiresWallet: intent.requiresWallet,
        explanation: intent.explanation
      };

      res.json(response);
    } catch (error) {
      console.error('Error parsing intent:', error);
      res.status(500).json({ error: 'Failed to parse intent' });
    }
  }

  async generateResponse(req: Request, res: Response) {
    try {
      const { message, intent, context } = req.body;

      // Mock response generation
      const response = await this.generateAIResponse(message, intent, context);

      res.json({
        response: response.content,
        transaction: response.transaction,
        suggestions: response.suggestions
      });
    } catch (error) {
      console.error('Error generating response:', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  }

  private async processMessage(message: string) {
    const lowerMessage = message.toLowerCase();
    
    // Swap intent
    if (lowerMessage.includes('swap') || lowerMessage.includes('exchange')) {
      const fromMatch = message.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
      const toMatch = message.match(/(?:for|to)\s*(\w+)/i);
      
      return {
        type: 'swap',
        confidence: 0.9,
        parameters: {
          fromToken: fromMatch?.[2]?.toUpperCase() || 'USDC',
          toToken: toMatch?.[1]?.toUpperCase() || 'ETH',
          amount: fromMatch?.[1] || '100'
        },
        transaction: {
          type: 'swap',
          from: fromMatch?.[2]?.toUpperCase() || 'USDC',
          to: toMatch?.[1]?.toUpperCase() || 'ETH',
          amount: fromMatch?.[1] || '100',
          estimatedOutput: '0.045 ETH',
          gasEstimate: '0.002 ETH (~$4.50)',
          protocol: 'Uniswap V3'
        },
        requiresWallet: true,
        explanation: 'I detected a token swap request. I\'ll help you exchange tokens using the best available rates.'
      };
    }

    // Balance check intent
    if (lowerMessage.includes('balance') || lowerMessage.includes('portfolio')) {
      return {
        type: 'balance',
        confidence: 0.95,
        parameters: {},
        transaction: null,
        requiresWallet: true,
        explanation: 'I\'ll check your wallet balance and show your current portfolio.'
      };
    }

    // Staking intent
    if (lowerMessage.includes('stake') || lowerMessage.includes('staking')) {
      const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
      const tokenMatch = message.match(/stake\s*(\w+)/i) || message.match(/(\w+)\s*stake/i);
      
      return {
        type: 'stake',
        confidence: 0.85,
        parameters: {
          token: tokenMatch?.[1]?.toUpperCase() || 'ETH',
          amount: amountMatch?.[1] || '1.0'
        },
        transaction: {
          type: 'stake',
          token: tokenMatch?.[1]?.toUpperCase() || 'ETH',
          amount: amountMatch?.[1] || '1.0',
          protocol: 'Lido',
          apy: '4.2%',
          estimatedRewards: '0.042 ETH/year'
        },
        requiresWallet: true,
        explanation: 'I found a staking opportunity for you. Staking helps secure the network and earns rewards.'
      };
    }

    // NFT intent
    if (lowerMessage.includes('nft') || lowerMessage.includes('mint')) {
      return {
        type: 'nft',
        confidence: 0.8,
        parameters: {
          action: lowerMessage.includes('mint') ? 'mint' : 'general'
        },
        transaction: null,
        requiresWallet: true,
        explanation: 'I can help you with NFT operations like minting, buying, or selling.'
      };
    }

    // Default fallback
    return {
      type: 'unknown',
      confidence: 0.3,
      parameters: {},
      transaction: null,
      requiresWallet: false,
      explanation: 'I\'m not sure what you\'re asking for. Could you please be more specific?'
    };
  }

  private async generateAIResponse(message: string, intent: any, context: any) {
    // Mock response generation based on intent
    switch (intent) {
      case 'swap':
        return {
          content: 'I\'ve prepared a token swap for you. The transaction will use Uniswap V3 for the best rates. Please review the details and confirm if you\'d like to proceed.',
          transaction: context.transaction,
          suggestions: ['Check current rates', 'Set slippage tolerance', 'Review gas fees']
        };
        
      case 'balance':
        return {
          content: 'Here\'s your current wallet balance and portfolio overview. Your total value has increased by 5.2% this week.',
          transaction: null,
          suggestions: ['View transaction history', 'Export portfolio', 'Set up alerts']
        };
        
      case 'stake':
        return {
          content: 'I found a great staking opportunity for you. Lido offers liquid staking with competitive rewards and the flexibility to unstake anytime.',
          transaction: context.transaction,
          suggestions: ['Compare staking options', 'Check rewards history', 'Learn about risks']
        };
        
      default:
        return {
          content: 'I\'m here to help you with blockchain transactions. You can ask me to swap tokens, check balances, stake assets, or interact with DeFi protocols.',
          transaction: null,
          suggestions: ['Show examples', 'Connect wallet', 'View help']
        };
    }
  }
}

export const aiController = new AIController();
