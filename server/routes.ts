import express from 'express';
import { aiController } from './controllers/aiController';
import { txController } from './controllers/txController';

const router = express.Router();

// AI Routes
router.post('/api/ai/parse-intent', aiController.parseIntent.bind(aiController));
router.post('/api/ai/generate-response', aiController.generateResponse.bind(aiController));

// Transaction Routes
router.post('/api/tx/simulate', txController.simulateTransaction.bind(txController));
router.post('/api/tx/execute', txController.executeTransaction.bind(txController));
router.get('/api/tx/status/:hash', txController.getTransactionStatus.bind(txController));
router.get('/api/tx/history/:address', txController.getTransactionHistory.bind(txController));

// Health check
router.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;