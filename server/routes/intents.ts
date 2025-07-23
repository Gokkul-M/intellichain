
import express from 'express';
import LogController from '../controllers/logController.js';

const router = express.Router();
const logController = new LogController();

router.post('/', async (req, res) => {
  try {
    const { userPrompt, parsedIntent, aiResponse, txHash, gasEstimate } = req.body;
    
    if (!userPrompt || !parsedIntent || !aiResponse) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const intentLog = await logController.createIntentLog({
      userPrompt,
      parsedIntent,
      aiResponse,
      txHash,
      gasEstimate
    });

    res.json(intentLog);
  } catch (error) {
    console.error('Create intent log error:', error);
    res.status(500).json({ error: 'Failed to create intent log: ' + (error as Error).message });
  }
});

router.get('/', async (req, res) => {
  try {
    const intentLogs = await logController.getIntentLogs();
    res.json(intentLogs);
  } catch (error) {
    console.error('Get intent logs error:', error);
    res.status(500).json({ error: 'Failed to get intent logs: ' + (error as Error).message });
  }
});

export default router;
