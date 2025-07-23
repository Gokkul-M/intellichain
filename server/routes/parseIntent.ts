
import express from 'express';
import AIController from '../controllers/aiController.js';

const router = express.Router();
const aiController = new AIController();

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiController.parseIntent(prompt);
    
    res.json(result);
  } catch (error) {
    console.error('Parse intent error:', error);
    res.status(500).json({ error: 'Failed to parse intent: ' + (error as Error).message });
  }
});

export default router;
