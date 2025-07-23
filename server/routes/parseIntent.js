import express from 'express';
import AIController from '../controllers/aiController.js';
import LogController from '../controllers/logController.js';
import PromptToContract from '../services/promptToContract.js';
import SimulateTx from '../services/simulateTx.js';
import { storage } from '../storage.js';

const router = express.Router();
const aiController = new AIController();
const logController = new LogController(storage);
const promptToContract = new PromptToContract();
const simulateTx = new SimulateTx();

router.post('/parse-intent', async (req, res) => {
  try {
    const { prompt, sessionId = 'default', userAddress } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Step 1: Log user message
    await logController.createChatMessage({
      sessionId,
      content: prompt,
      isUser: true,
      intentLogId: null
    });

    // Step 2: Parse intent with AI
    const { parsedIntent, aiResponse } = await aiController.parseIntent(prompt);

    if (parsedIntent.error) {
      // Log AI error response
      await logController.createChatMessage({
        sessionId,
        content: aiResponse,
        isUser: false,
        intentLogId: null
      });

      return res.status(400).json({
        error: parsedIntent.error,
        messages: [
          { sender: "user", text: prompt },
          { sender: "bot", text: aiResponse }
        ]
      });
    }

    // Step 3: Convert to contract call
    const contractData = promptToContract.mapIntentToContract(parsedIntent);

    // Step 4: Simulate transaction
    const simulation = await simulateTx.validateTransaction(contractData);

    // Step 5: Create intent log
    const intentLog = await logController.createIntentLog({
      prompt,
      action: parsedIntent.action,
      token: parsedIntent.token || null,
      amount: parsedIntent.amount ? parsedIntent.amount.toString() : null,
      contractAddress: contractData.to,
      functionName: contractData.functionName,
      gasEstimate: simulation.gasEstimate,
      txHash: null,
      status: 'pending',
      blockNumber: null,
      simulationResult: simulation,
      parsedIntent: parsedIntent,
      userAddress: userAddress || null
    });

    // Step 6: Log AI response
    await logController.createChatMessage({
      sessionId,
      content: aiResponse,
      isUser: false,
      intentLogId: intentLog.id
    });

    // Step 7: Return response
    res.json({
      intentId: intentLog.id,
      messages: [
        { sender: "user", text: prompt },
        { sender: "bot", text: aiResponse }
      ],
      txPreview: {
        to: contractData.to,
        functionName: contractData.functionName,
        params: contractData.params,
        gasEstimate: simulation.gasEstimate,
        tokenFlow: contractData.tokenFlow,
        description: contractData.description,
        riskLevel: simulation.riskLevel,
        recommendation: simulation.recommendation,
        data: contractData.data
      },
      simulation: {
        isValid: simulation.isValid,
        error: simulation.error,
        gasEstimate: simulation.gasEstimate
      }
    });

  } catch (error) {
    console.error('Parse intent error:', error);
    res.status(500).json({ error: 'Failed to parse intent: ' + error.message });
  }
});

export default router;