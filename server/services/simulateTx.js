import axios from 'axios';
import { ethers } from 'ethers';

class SimulateTx {
  constructor() {
    this.tenderlyApiKey = process.env.TENDERLY_ACCESS_KEY;
    this.tenderlyProject = process.env.TENDERLY_PROJECT || 'intellichain';
    this.tenderlyUsername = process.env.TENDERLY_USERNAME || 'intellichain';
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://rpc.blockdag.network'
    );
  }

  async simulateTransaction(txData) {
    try {
      // Try Tenderly simulation first if available
      if (this.tenderlyApiKey) {
        return await this.simulateWithTenderly(txData);
      } else {
        // Fallback to local estimation
        return await this.simulateLocally(txData);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      throw new Error('Failed to simulate transaction: ' + error.message);
    }
  }

  async simulateWithTenderly(txData) {
    const { to, data, value = '0', from = '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a' } = txData;

    const simulationData = {
      network_id: '1', // BlockDAG network ID would go here
      from,
      to,
      input: data,
      value: ethers.parseEther(value).toString(),
      gas: 8000000,
      gas_price: '20000000000',
      save: true,
      save_if_fails: true
    };

    try {
      const response = await axios.post(
        `https://api.tenderly.co/api/v1/account/${this.tenderlyUsername}/project/${this.tenderlyProject}/simulate`,
        simulationData,
        {
          headers: {
            'X-Access-Key': this.tenderlyApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.transaction;
      
      return {
        success: result.status,
        gasEstimate: result.gas_used,
        gasPrice: result.gas_price,
        error: result.error_message || null,
        logs: result.logs || [],
        trace: result.trace || [],
        simulationUrl: `https://dashboard.tenderly.co/public/${this.tenderlyUsername}/${this.tenderlyProject}/simulator/${result.id}`
      };
    } catch (error) {
      console.warn('Tenderly simulation failed, falling back to local:', error.message);
      return await this.simulateLocally(txData);
    }
  }

  async simulateLocally(txData) {
    try {
      const { to, data, value = '0', from = '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1a' } = txData;

      // Estimate gas
      const gasEstimate = await this.provider.estimateGas({
        to,
        data,
        value: ethers.parseEther(value),
        from
      });

      // Get current gas price
      const feeData = await this.provider.getFeeData();

      // Basic balance check
      const balance = await this.provider.getBalance(from);
      const requiredValue = ethers.parseEther(value);
      const estimatedGasCost = gasEstimate * feeData.gasPrice;
      const totalRequired = requiredValue + estimatedGasCost;

      const hasEnoughBalance = balance >= totalRequired;

      return {
        success: hasEnoughBalance,
        gasEstimate: gasEstimate.toString(),
        gasPrice: feeData.gasPrice.toString(),
        gasCost: ethers.formatEther(estimatedGasCost),
        error: hasEnoughBalance ? null : 'Insufficient balance for transaction',
        logs: [],
        balanceCheck: {
          currentBalance: ethers.formatEther(balance),
          requiredAmount: ethers.formatEther(totalRequired),
          sufficient: hasEnoughBalance
        }
      };
    } catch (error) {
      return {
        success: false,
        gasEstimate: '0',
        gasPrice: '0',
        error: error.message,
        logs: []
      };
    }
  }

  async validateTransaction(txData) {
    const simulation = await this.simulateTransaction(txData);
    
    return {
      isValid: simulation.success,
      gasEstimate: simulation.gasEstimate,
      error: simulation.error,
      recommendation: this.generateRecommendation(simulation),
      riskLevel: this.assessRiskLevel(simulation)
    };
  }

  generateRecommendation(simulation) {
    if (!simulation.success) {
      if (simulation.error?.includes('insufficient')) {
        return 'Please ensure you have enough balance to cover the transaction and gas fees.';
      }
      return 'Transaction may fail. Please review the parameters and try again.';
    }

    const gasEstimate = parseInt(simulation.gasEstimate);
    if (gasEstimate > 500000) {
      return 'This transaction has high gas costs. Consider optimizing or splitting into smaller transactions.';
    }

    return 'Transaction looks good to proceed.';
  }

  assessRiskLevel(simulation) {
    if (!simulation.success) {
      return 'HIGH';
    }

    const gasEstimate = parseInt(simulation.gasEstimate);
    if (gasEstimate > 300000) {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}

export default SimulateTx;