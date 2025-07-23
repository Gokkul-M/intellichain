import OpenAI from 'openai';

class AIController {
  constructor() {
    // Only initialize OpenAI if we have a valid API key
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 20 && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.hasValidApiKey = true;
    } else {
      this.openai = null;
      this.hasValidApiKey = false;
      console.warn('OpenAI API key not configured - using fallback parsing');
    }
  }

  async parseIntent(prompt) {
    try {
      // Check if OpenAI is available
      if (!this.hasValidApiKey || !this.openai) {
        return this.parseIntentFallback(prompt);
      }

      const systemPrompt = `You are an expert blockchain transaction parser. Convert natural language instructions into structured JSON for smart contract interactions on BlockDAG Primordial Testnet.

      Analyze the user's prompt and extract:
      - action: The type of operation (stake, swap, mint, delegate, transfer, etc.)
      - amount: Numerical amount if specified
      - token: Token symbol if mentioned
      - targetToken: For swaps, the token to receive
      - contract: Infer contract type (vault, dex, nft, governance)
      - recipient: For transfers, the recipient address
      - additional: Any other relevant parameters

      Examples:
      Input: "Stake 100 USDC"
      Output: {"action": "stake", "amount": 100, "token": "USDC", "contract": "vault"}

      Input: "Swap 50 ETH for BDAG"
      Output: {"action": "swap", "amount": 50, "token": "ETH", "targetToken": "BDAG", "contract": "dex"}

      Input: "Mint an NFT from CryptoPunks"
      Output: {"action": "mint", "token": "NFT", "contract": "nft", "collection": "CryptoPunks"}

      Respond only with valid JSON. If the prompt is unclear, include an "error" field explaining what's missing.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const parsedIntent = JSON.parse(response.choices[0].message.content);
      
      // Generate AI response message
      const responseMessage = this.generateResponseMessage(parsedIntent);
      
      return {
        parsedIntent,
        aiResponse: responseMessage
      };
    } catch (error) {
      console.error('AI parsing error:', error);
      console.warn('Falling back to rule-based parsing');
      return this.parseIntentFallback(prompt);
    }
  }

  parseIntentFallback(prompt) {
    // Rule-based parsing as fallback
    const lowerPrompt = prompt.toLowerCase();
    let parsedIntent = {};

    // Extract numbers and tokens
    const amountMatch = prompt.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    // Common tokens
    const tokens = ['usdc', 'eth', 'bdag', 'weth', 'dai', 'usdt'];
    const foundToken = tokens.find(token => lowerPrompt.includes(token));

    // Parse actions
    if (lowerPrompt.includes('stake') || lowerPrompt.includes('staking')) {
      parsedIntent = {
        action: 'stake',
        amount,
        token: foundToken?.toUpperCase() || 'USDC',
        contract: 'vault'
      };
    } else if (lowerPrompt.includes('swap') || lowerPrompt.includes('exchange') || lowerPrompt.includes('trade')) {
      const forMatch = lowerPrompt.match(/for (\w+)/);
      const targetToken = forMatch ? forMatch[1].toUpperCase() : 'ETH';
      
      parsedIntent = {
        action: 'swap',
        amount,
        token: foundToken?.toUpperCase() || 'USDC',
        targetToken,
        contract: 'dex'
      };
    } else if (lowerPrompt.includes('mint') || lowerPrompt.includes('nft')) {
      parsedIntent = {
        action: 'mint',
        token: 'NFT',
        contract: 'nft'
      };
    } else if (lowerPrompt.includes('delegate') || lowerPrompt.includes('voting')) {
      parsedIntent = {
        action: 'delegate',
        amount,
        token: foundToken?.toUpperCase() || 'BDAG',
        contract: 'governance'
      };
    } else if (lowerPrompt.includes('transfer') || lowerPrompt.includes('send')) {
      parsedIntent = {
        action: 'transfer',
        amount,
        token: foundToken?.toUpperCase() || 'USDC',
        contract: 'erc20'
      };
    } else {
      parsedIntent = {
        error: 'Unable to understand the request. Please try commands like "stake 100 USDC" or "swap 50 ETH for BDAG"'
      };
    }

    const responseMessage = this.generateResponseMessage(parsedIntent);
    
    return {
      parsedIntent,
      aiResponse: responseMessage + ' (Using fallback parser - for best results, configure OpenAI API key)'
    };
  }

  generateResponseMessage(intent) {
    if (intent.error) {
      return `I need more information: ${intent.error}`;
    }

    const { action, amount, token, targetToken, contract } = intent;
    
    switch (action) {
      case 'stake':
        return `I'll help you stake ${amount} ${token} in the vault. Let me prepare this transaction for you.`;
      case 'swap':
        return `I'll swap ${amount} ${token} for ${targetToken} on the DEX. Checking for the best route...`;
      case 'mint':
        return `I'll mint an NFT for you. Let me find the contract and prepare the transaction.`;
      case 'delegate':
        return `I'll delegate ${amount} ${token} to the validator. Setting up the delegation transaction...`;
      case 'transfer':
        return `I'll transfer ${amount} ${token} to the specified address. Preparing the transfer...`;
      default:
        return `I understand you want to ${action}. Let me analyze the best way to execute this transaction.`;
    }
  }
}

export default AIController;