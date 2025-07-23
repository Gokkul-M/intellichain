import express from 'express';
import SimulateTx from '../services/simulateTx.js';

const router = express.Router();
const simulateTx = new SimulateTx();

router.post('/simulate', async (req, res) => {
  try {
    const { to, data, value, from } = req.body;

    if (!to || !data) {
      return res.status(400).json({ error: 'Contract address (to) and data are required' });
    }

    const txData = {
      to,
      data,
      value: value || '0',
      from: from || '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1A'
    };

    const simulation = await simulateTx.simulateTransaction(txData);

    res.json({
      success: simulation.success,
      gasEstimate: simulation.gasEstimate,
      gasPrice: simulation.gasPrice,
      gasCost: simulation.gasCost,
      error: simulation.error,
      logs: simulation.logs,
      simulationUrl: simulation.simulationUrl,
      balanceCheck: simulation.balanceCheck
    });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to simulate transaction: ' + error.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { to, data, value, from } = req.body;

    if (!to || !data) {
      return res.status(400).json({ error: 'Contract address (to) and data are required' });
    }

    const txData = {
      to,
      data,
      value: value || '0',
      from: from || '0x742d35Cc6C3F3f6a9C6bB7F7B8e6F8Df2E4F8B1A'
    };

    const validation = await simulateTx.validateTransaction(txData);

    res.json({
      isValid: validation.isValid,
      gasEstimate: validation.gasEstimate,
      error: validation.error,
      recommendation: validation.recommendation,
      riskLevel: validation.riskLevel
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Failed to validate transaction: ' + error.message });
  }
});

export default router;