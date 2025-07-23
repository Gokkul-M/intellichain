
import express from 'express';
import TxController from '../controllers/txController.js';
import LogController from '../controllers/logController.js';

const router = express.Router();
const txController = new TxController();
const logController = new LogController();

router.post('/', async (req, res) => {
  try {
    const txData = req.body;
    
    if (!txData.to || !txData.data) {
      return res.status(400).json({ error: 'Transaction data is required' });
    }

    const result = await txController.sendTransaction(txData);
    
    res.json(result);
  } catch (error) {
    console.error('Send transaction error:', error);
    res.status(500).json({ error: 'Failed to send transaction: ' + (error as Error).message });
  }
});

router.get('/tx-status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const status = await txController.getTransactionStatus(txHash);
    
    res.json(status);
  } catch (error) {
    console.error('Transaction status error:', error);
    res.status(500).json({ error: 'Failed to get transaction status: ' + (error as Error).message });
  }
});

router.post('/update-tx-status', async (req, res) => {
  try {
    const { txHash, status, blockNumber, gasUsed } = req.body;
    
    if (!txHash || !status) {
      return res.status(400).json({ error: 'Transaction hash and status are required' });
    }

    const allIntents = await logController.getIntentLogs();
    const intentLog = allIntents.find(log => log.txHash === txHash);
    
    if (!intentLog) {
      return res.status(404).json({ error: 'Intent not found for transaction hash' });
    }

    await logController.updateIntentLog(intentLog.id, {
      status: status,
      blockNumber: blockNumber || undefined,
      gasEstimate: gasUsed || intentLog.gasEstimate
    });

    res.json({
      success: true,
      message: 'Transaction status updated'
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Failed to update transaction status: ' + (error as Error).message });
  }
});

export default router;
