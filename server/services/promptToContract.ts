
import { ethers } from 'ethers';

interface ParsedIntent {
  action: string;
  amount?: number;
  token?: string;
  targetToken?: string;
  contract?: string;
}

interface TransactionData {
  to: string;
  data: string;
  functionName: string;
  params: any[];
  tokenFlow: string;
  description: string;
}

interface ContractConfig {
  address: string;
  abi: any[];
}

class PromptToContractService {
  private contracts: Record<string, ContractConfig>;

  constructor() {
    this.contracts = {
      vault: {
        address: '0x1234567890123456789012345678901234567890',
        abi: [
          'function stake(uint256 amount) external',
          'function unstake(uint256 amount) external'
        ]
      },
      dex: {
        address: '0x2345678901234567890123456789012345678901',
        abi: [
          'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external'
        ]
      },
      nft: {
        address: '0x9C8f4B7F6B5A3C2D1E0F9A8B7C6D5E4F3A2B1C0D',
        abi: [
          'function mint(address to, string tokenURI) external'
        ]
      },
      governance: {
        address: '0xA1B2C3D4E5F6789012345678901234567890123456',
        abi: [
          'function delegate(address validator) external'
        ]
      },
      erc20: {
        address: '0x456789012345678901234567890123456789012',
        abi: [
          'function transfer(address to, uint256 amount) external'
        ]
      }
    };
  }

  async convertToTransaction(parsedIntent: ParsedIntent): Promise<TransactionData> {
    const { action, amount, token, targetToken } = parsedIntent;

    switch (action) {
      case 'stake':
        return this.buildStakeTransaction(amount || 0, token || 'USDC');
      case 'swap':
        return this.buildSwapTransaction(amount || 0, token || 'USDC', targetToken || 'ETH');
      case 'mint':
        return this.buildMintTransaction(parsedIntent);
      case 'delegate':
        return this.buildDelegateTransaction(amount || 0, token || 'BDAG');
      case 'transfer':
        return this.buildTransferTransaction(amount || 0, token || 'USDC');
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  buildStakeTransaction(amount: number, token: string): TransactionData {
    const contract = this.contracts.vault;
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('stake', [amountWei.toString()]);

    return {
      to: contract.address,
      data,
      functionName: 'stake',
      params: [amountWei.toString()],
      tokenFlow: `${amount} ${token} → Vault`,
      description: `Stake ${amount} ${token} in vault`
    };
  }

  buildSwapTransaction(amount: number, fromToken: string, toToken: string): TransactionData {
    const contract = this.contracts.dex;
    const amountIn = ethers.parseUnits(amount.toString(), 18);
    const amountOutMin = ethers.parseUnits((amount * 0.95).toString(), 18); // 5% slippage
    const path = [
      '0x1111111111111111111111111111111111111111', // fromToken address
      '0x2222222222222222222222222222222222222222'  // toToken address
    ];
    const to = '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a';
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('swapExactTokensForTokens', [
      amountIn.toString(),
      amountOutMin.toString(),
      path,
      to,
      deadline.toString()
    ]);

    return {
      to: contract.address,
      data,
      functionName: 'swapExactTokensForTokens',
      params: [amountIn.toString(), amountOutMin.toString(), path, to, deadline.toString()],
      tokenFlow: `${amount} ${fromToken} → ${toToken}`,
      description: `Swap ${amount} ${fromToken} for ${toToken} on DEX`
    };
  }

  buildMintTransaction(parsedIntent: ParsedIntent): TransactionData {
    const contract = this.contracts.nft;
    const to = '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a';
    const tokenURI = `ipfs://QmYourNFTMetadataHash/${Date.now()}`;

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('mint', [to, tokenURI]);

    return {
      to: contract.address,
      data,
      functionName: 'mint',
      params: [to, tokenURI],
      tokenFlow: `NFT → ${to}`,
      description: `Mint NFT to your address`
    };
  }

  buildDelegateTransaction(amount: number, token: string, validator?: string): TransactionData {
    const contract = this.contracts.governance;
    const validatorAddress = validator || '0x1234567890123456789012345678901234567890';

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('delegate', [validatorAddress]);

    return {
      to: contract.address,
      data,
      functionName: 'delegate',
      params: [validatorAddress],
      tokenFlow: `${amount} ${token} → Validator`,
      description: `Delegate ${amount} ${token} to validator`
    };
  }

  buildTransferTransaction(amount: number, token: string, recipient?: string): TransactionData {
    const contract = this.contracts.erc20;
    const to = recipient || '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a';
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('transfer', [to, amountWei.toString()]);

    return {
      to: contract.address,
      data,
      functionName: 'transfer',
      params: [to, amountWei.toString()],
      tokenFlow: `${amount} ${token} → ${to}`,
      description: `Transfer ${amount} ${token} to ${to}`
    };
  }
}

export { PromptToContractService };
