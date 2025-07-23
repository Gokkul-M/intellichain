import express from 'express';
import LogController from '../controllers/logController.js';
import { storage } from '../storage.js';

const router = express.Router();
const logController = new LogController(storage);

router.get('/intents', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let intents = await logController.getIntentLogs();
    
    // Filter by status if provided
    if (status) {
      intents = intents.filter(intent => intent.status === status);
    }
    
    // Apply pagination
    const paginatedIntents = intents.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    // Calculate statistics
    const stats = {
      total: intents.length,
      successful: intents.filter(i => i.status === 'success').length,
      failed: intents.filter(i => i.status === 'failed').length,
      pending: intents.filter(i => i.status === 'pending' || i.status === 'submitted').length
    };

    res.json({
      intents: paginatedIntents,
      pagination: {
        total: intents.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: intents.length > parseInt(offset) + parseInt(limit)
      },
      stats
    });

  } catch (error) {
    console.error('Get intents error:', error);
    res.status(500).json({ error: 'Failed to fetch intents: ' + error.message });
  }
});

router.get('/intents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const intent = await logController.getIntentLog(parseInt(id));
    
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    res.json(intent);

  } catch (error) {
    console.error('Get intent error:', error);
    res.status(500).json({ error: 'Failed to fetch intent: ' + error.message });
  }
});

router.get('/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const messages = await logController.getChatHistory(sessionId);
    
    res.json({
      sessionId,
      messages
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history: ' + error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const intents = await logController.getIntentLogs();
    
    // Calculate analytics
    const totalIntents = intents.length;
    const successfulIntents = intents.filter(i => i.status === 'success').length;
    const failedIntents = intents.filter(i => i.status === 'failed').length;
    const pendingIntents = intents.filter(i => i.status === 'pending' || i.status === 'submitted').length;
    
    // Group by action type
    const actionCounts = intents.reduce((acc, intent) => {
      acc[intent.action] = (acc[intent.action] || 0) + 1;
      return acc;
    }, {});
    
    // Group by token
    const tokenCounts = intents.reduce((acc, intent) => {
      if (intent.token) {
        acc[intent.token] = (acc[intent.token] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Calculate gas usage
    const totalGasEstimate = intents.reduce((sum, intent) => {
      return sum + (parseInt(intent.gasEstimate || '0'));
    }, 0);
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentIntents = intents.filter(intent => 
      new Date(intent.timestamp) > sevenDaysAgo
    );

    res.json({
      overview: {
        totalIntents,
        successfulIntents,
        failedIntents,
        pendingIntents,
        successRate: totalIntents > 0 ? (successfulIntents / totalIntents * 100).toFixed(2) : 0
      },
      actionBreakdown: actionCounts,
      tokenBreakdown: tokenCounts,
      gasUsage: {
        totalEstimatedGas: totalGasEstimate.toString(),
        averageGasPerTx: totalIntents > 0 ? Math.round(totalGasEstimate / totalIntents).toString() : '0'
      },
      recentActivity: {
        last7Days: recentIntents.length,
        trend: 'up' // Simplified - would calculate actual trend
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics: ' + error.message });
  }
});

export default router;