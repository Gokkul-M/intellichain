class LogController {
  constructor(storage) {
    this.storage = storage;
  }

  async createIntentLog(intentData) {
    try {
      const intentLog = await this.storage.createIntentLog(intentData);
      return intentLog;
    } catch (error) {
      console.error('Failed to create intent log:', error);
      throw new Error('Failed to log intent: ' + error.message);
    }
  }

  async updateIntentLog(id, updates) {
    try {
      const updatedLog = await this.storage.updateIntentLog(id, updates);
      if (!updatedLog) {
        throw new Error('Intent log not found');
      }
      return updatedLog;
    } catch (error) {
      console.error('Failed to update intent log:', error);
      throw new Error('Failed to update intent log: ' + error.message);
    }
  }

  async getIntentLogs() {
    try {
      const logs = await this.storage.getAllIntentLogs();
      return logs;
    } catch (error) {
      console.error('Failed to fetch intent logs:', error);
      throw new Error('Failed to fetch intent logs: ' + error.message);
    }
  }

  async getIntentLog(id) {
    try {
      const log = await this.storage.getIntentLog(id);
      if (!log) {
        throw new Error('Intent log not found');
      }
      return log;
    } catch (error) {
      console.error('Failed to fetch intent log:', error);
      throw new Error('Failed to fetch intent log: ' + error.message);
    }
  }

  async createChatMessage(messageData) {
    try {
      const message = await this.storage.createChatMessage(messageData);
      return message;
    } catch (error) {
      console.error('Failed to create chat message:', error);
      throw new Error('Failed to log chat message: ' + error.message);
    }
  }

  async getChatHistory(sessionId) {
    try {
      const messages = await this.storage.getChatMessagesBySession(sessionId);
      return messages;
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      throw new Error('Failed to fetch chat history: ' + error.message);
    }
  }
}

export default LogController;