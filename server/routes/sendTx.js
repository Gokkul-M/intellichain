import express from 'express';
import TxController from '../controllers/txController.js';
import LogController from '../controllers/logController.js';
import { storage } from '../storage.js';

const router = express.Router();
const txController = new TxController();
const logController = new LogController(storage);

router.post('/send-tx', async (req, res) => {
  try {
    const { intentId, txData, userSignature } = req.body;

    if (!intentId || !txData) {
      return res.status(400).json({ error: 'Intent ID and transaction data are required' });
    }

    // Get the intent log
    const intentLog = await logController.getIntentLog(intentId);
    if (!intentLog) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    // Validate that intent is still pending
    if (intentLog.status !== 'pending') {
      return res.status(400).json({ error: 'Intent already processed' });
    }

    // Send transaction
    const result = await txController.sendTransaction(txData);

    // Update intent log with transaction hash
    await logController.updateIntentLog(intentId, {
      txHash: result.txHash,
      status: 'submitted'
    });

    res.json({
      success: true,
      txHash: result.txHash,
      status: result.status,
      message: 'Transaction submitted successfully'
    });

  } catch (error) {
    console.error('Send transaction error:', error);
    
    // Update intent log with error
    if (req.body.intentId) {
      try {
        await logController.updateIntentLog(req.body.intentId, {
          status: 'failed',
          simulationResult: { error: error.message }
        });
      } catch (logError) {
        console.error('Failed to update intent log:', logError);
      }
    }

    res.status(500).json({ error: 'Failed to send transaction: ' + error.message });
  }
});

router.get('/tx-status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const status = await txController.getTransactionStatus(txHash);
    
    res.json(status);
  } catch (error) {
    console.error('Transaction status error:', error);
    res.status(500).json({ error: 'Failed to get transaction status: ' + error.message });
  }
});

router.post('/update-tx-status', async (req, res) => {
  try {
    const { txHash, status, blockNumber, gasUsed } = req.body;
    
    if (!txHash || !status) {
      return res.status(400).json({ error: 'Transaction hash and status are required' });
    }

    // Find intent log by transaction hash
    const allIntents = await logController.getIntentLogs();
    const intentLog = allIntents.find(log => log.txHash === txHash);
    
    if (!intentLog) {
      return res.status(404).json({ error: 'Intent not found for transaction hash' });
    }

    // Update intent log
    await logController.updateIntentLog(intentLog.id, {
      status: status,
      blockNumber: blockNumber || null,
      gasEstimate: gasUsed || intentLog.gasEstimate
    });

    res.json({
      success: true,
      message: 'Transaction status updated'
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Failed to update transaction status: ' + error.message });
  }
});

export default router;