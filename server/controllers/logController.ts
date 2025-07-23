
import { storage } from '../storage.js';

interface IntentLog {
  id: string;
  timestamp: string;
  userPrompt: string;
  parsedIntent: any;
  aiResponse: string;
  txHash?: string;
  status: 'pending' | 'success' | 'failed';
  gasEstimate?: string;
  blockNumber?: number;
}

class LogController {
  async createIntentLog(data: Omit<IntentLog, 'id' | 'timestamp' | 'status'>): Promise<IntentLog> {
    const intentLog: IntentLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...data
    };

    storage.intentLogs.push(intentLog);
    return intentLog;
  }

  async getIntentLogs(): Promise<IntentLog[]> {
    return storage.intentLogs.slice().reverse();
  }

  async updateIntentLog(id: string, updates: Partial<IntentLog>): Promise<IntentLog | null> {
    const index = storage.intentLogs.findIndex(log => log.id === id);
    if (index === -1) return null;

    storage.intentLogs[index] = { ...storage.intentLogs[index], ...updates };
    return storage.intentLogs[index];
  }

  async getIntentLogById(id: string): Promise<IntentLog | null> {
    return storage.intentLogs.find(log => log.id === id) || null;
  }
}

export default LogController;
