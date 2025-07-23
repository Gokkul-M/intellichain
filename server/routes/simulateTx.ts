
import express from 'express';
import { SimulateTxService } from '../services/simulateTx.js';

const router = express.Router();
const simulateTxService = new SimulateTxService();

router.post('/', async (req, res) => {
  try {
    const txData = req.body;
    
    if (!txData.to || !txData.data) {
      return res.status(400).json({ error: 'Transaction data is required' });
    }

    const validation = await simulateTxService.validateTransaction(txData);
    
    res.json({
      isValid: validation.isValid,
      gasEstimate: validation.gasEstimate,
      error: validation.error,
      recommendation: validation.recommendation,
      riskLevel: validation.riskLevel
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Failed to validate transaction: ' + (error as Error).message });
  }
});

export default router;
