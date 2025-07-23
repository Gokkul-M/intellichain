import { ethers } from 'ethers';

class TxController {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://rpc.blockdag.network'
    );
    
    // Initialize wallet if private key is provided (for relayer mode)
    if (process.env.PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    }
  }

  async sendTransaction(txData) {
    try {
      if (!this.wallet) {
        throw new Error('No wallet configured for transaction signing');
      }

      const { to, data, value = '0' } = txData;
      
      // Estimate gas
      const gasEstimate = await this.provider.estimateGas({
        to,
        data,
        value: ethers.parseEther(value)
      });

      // Get current gas price
      const gasPrice = await this.provider.getFeeData();

      const tx = {
        to,
        data,
        value: ethers.parseEther(value),
        gasLimit: gasEstimate,
        gasPrice: gasPrice.gasPrice,
      };

      const transaction = await this.wallet.sendTransaction(tx);
      
      return {
        txHash: transaction.hash,
        status: 'pending',
        gasUsed: gasEstimate.toString(),
        blockNumber: null
      };
    } catch (error) {
      console.error('Transaction error:', error);
      throw new Error('Failed to send transaction: ' + error.message);
    }
  }

  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { status: 'pending' };
      }

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        logs: receipt.logs
      };
    } catch (error) {
      console.error('Transaction status error:', error);
      throw new Error('Failed to get transaction status: ' + error.message);
    }
  }

  async estimateGas(to, data, value = '0') {
    try {
      const gasEstimate = await this.provider.estimateGas({
        to,
        data,
        value: ethers.parseEther(value)
      });

      const gasPrice = await this.provider.getFeeData();
      const gasCost = gasEstimate * gasPrice.gasPrice;
      
      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        gasCost: ethers.formatEther(gasCost),
        gasCostUSD: this.estimateGasCostUSD(gasCost)
      };
    } catch (error) {
      console.error('Gas estimation error:', error);
      throw new Error('Failed to estimate gas: ' + error.message);
    }
  }

  estimateGasCostUSD(gasCostWei) {
    // Approximate USD cost calculation (would need price oracle in production)
    const ethPrice = 2500; // Placeholder - should use real price feed
    const gasCostEth = parseFloat(ethers.formatEther(gasCostWei));
    return (gasCostEth * ethPrice).toFixed(2);
  }
}

export default TxController;