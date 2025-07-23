import { ethers } from 'ethers';

// Mock contract addresses for BlockDAG Primordial Testnet (valid checksummed addresses)
const CONTRACTS = {
  vault: {
    address: '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a',
    abi: [
      'function stake(uint256 amount) external',
      'function unstake(uint256 amount) external',
      'function getStakedAmount(address user) external view returns (uint256)'
    ]
  },
  dex: {
    address: '0x9C8f4B7F6B5A3C2D1E0F9A8B7C6D5E4F3A2B1C0d',
    abi: [
      'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external',
      'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)'
    ]
  },
  nft: {
    address: '0xA1B2C3D4E5F6789012345678901234567890ABCD',
    abi: [
      'function mint(address to, string calldata tokenURI) external',
      'function safeMint(address to, uint256 tokenId) external'
    ]
  },
  governance: {
    address: '0xB2C3D4E5F678901234567890123456789012ABCD',
    abi: [
      'function delegate(address delegatee) external',
      'function vote(uint256 proposalId, uint8 support) external'
    ]
  },
  erc20: {
    abi: [
      'function transfer(address to, uint256 amount) external returns (bool)',
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function balanceOf(address account) external view returns (uint256)',
      'function decimals() external view returns (uint8)'
    ]
  }
};

// Mock token addresses (valid checksummed addresses)
const TOKENS = {
  'USDC': '0xA0b86a33E6441148Ba787981E51aFc39Bb83E70C',
  'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  'BDAG': '0x1234567890123456789012345678901234567890',
  'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
};

class PromptToContract {
  constructor() {
    this.contracts = CONTRACTS;
    this.tokens = TOKENS;
  }

  mapIntentToContract(parsedIntent) {
    const { action, amount, token, targetToken, contract } = parsedIntent;

    switch (action) {
      case 'stake':
        return this.buildStakeTransaction(amount, token);
      case 'unstake':
        return this.buildUnstakeTransaction(amount, token);
      case 'swap':
        return this.buildSwapTransaction(amount, token, targetToken);
      case 'mint':
        return this.buildMintTransaction(parsedIntent);
      case 'delegate':
        return this.buildDelegateTransaction(amount, token, parsedIntent.validator);
      case 'transfer':
        return this.buildTransferTransaction(amount, token, parsedIntent.recipient);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  buildStakeTransaction(amount, token) {
    const contract = this.contracts.vault;
    const tokenDecimals = this.getTokenDecimals(token);
    const amountWei = ethers.parseUnits(amount.toString(), tokenDecimals);

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('stake', [amountWei]);

    return {
      to: contract.address,
      data,
      functionName: 'stake',
      params: [amountWei.toString()],
      tokenFlow: `${amount} ${token} → Vault`,
      description: `Stake ${amount} ${token} to earn rewards`
    };
  }

  buildUnstakeTransaction(amount, token) {
    const contract = this.contracts.vault;
    const tokenDecimals = this.getTokenDecimals(token);
    const amountWei = ethers.parseUnits(amount.toString(), tokenDecimals);

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('unstake', [amountWei]);

    return {
      to: contract.address,
      data,
      functionName: 'unstake',
      params: [amountWei.toString()],
      tokenFlow: `${amount} ${token} ← Vault`,
      description: `Unstake ${amount} ${token} from vault`
    };
  }

  buildSwapTransaction(amount, fromToken, toToken) {
    const contract = this.contracts.dex;
    const fromTokenDecimals = this.getTokenDecimals(fromToken);
    const amountIn = ethers.parseUnits(amount.toString(), fromTokenDecimals);
    
    // Build token path
    const path = [this.tokens[fromToken], this.tokens[toToken]];
    const to = '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a'; // User address placeholder
    const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes from now
    const amountOutMin = 0; // Simplified for demo

    const iface = new ethers.Interface(contract.abi);
    const data = iface.encodeFunctionData('swapExactTokensForTokens', [
      amountIn,
      amountOutMin,
      path,
      to,
      deadline
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

  buildMintTransaction(parsedIntent) {
    const contract = this.contracts.nft;
    const to = '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a'; // User address placeholder
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

  buildDelegateTransaction(amount, token, validator) {
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

  buildTransferTransaction(amount, token, recipient) {
    const tokenAddress = this.tokens[token];
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${token}`);
    }

    const tokenDecimals = this.getTokenDecimals(token);
    const amountWei = ethers.parseUnits(amount.toString(), tokenDecimals);

    const iface = new ethers.Interface(this.contracts.erc20.abi);
    const data = iface.encodeFunctionData('transfer', [recipient, amountWei]);

    return {
      to: tokenAddress,
      data,
      functionName: 'transfer',
      params: [recipient, amountWei.toString()],
      tokenFlow: `${amount} ${token} → ${recipient}`,
      description: `Transfer ${amount} ${token} to ${recipient}`
    };
  }

  getTokenDecimals(token) {
    // Simplified decimal mapping
    const decimals = {
      'USDC': 6,
      'ETH': 18,
      'WETH': 18,
      'BDAG': 18
    };
    return decimals[token] || 18;
  }

  estimateGas(contractData) {
    // Simplified gas estimation based on function type
    const gasEstimates = {
      'stake': '120000',
      'unstake': '100000',
      'swapExactTokensForTokens': '180000',
      'mint': '85000',
      'delegate': '75000',
      'transfer': '21000'
    };

    return gasEstimates[contractData.functionName] || '150000';
  }
}

export default PromptToContract;