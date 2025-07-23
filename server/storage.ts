import { 
  users, 
  intentLogs, 
  chatMessages,
  type User, 
  type InsertUser, 
  type IntentLog, 
  type InsertIntentLog,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Intent log methods
  createIntentLog(intent: InsertIntentLog): Promise<IntentLog>;
  getIntentLog(id: number): Promise<IntentLog | undefined>;
  getAllIntentLogs(): Promise<IntentLog[]>;
  updateIntentLog(id: number, updates: Partial<IntentLog>): Promise<IntentLog | undefined>;

  // Chat message methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private intentLogs: Map<number, IntentLog>;
  private chatMessages: Map<number, ChatMessage>;
  private userIdCounter: number;
  private intentIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.intentLogs = new Map();
    this.chatMessages = new Map();
    this.userIdCounter = 1;
    this.intentIdCounter = 1;
    this.messageIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createIntentLog(intent: InsertIntentLog): Promise<IntentLog> {
    const id = this.intentIdCounter++;
    const intentLog: IntentLog = { 
      ...intent, 
      id, 
      timestamp: new Date()
    };
    this.intentLogs.set(id, intentLog);
    return intentLog;
  }

  async getIntentLog(id: number): Promise<IntentLog | undefined> {
    return this.intentLogs.get(id);
  }

  async getAllIntentLogs(): Promise<IntentLog[]> {
    return Array.from(this.intentLogs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async updateIntentLog(id: number, updates: Partial<IntentLog>): Promise<IntentLog | undefined> {
    const existing = this.intentLogs.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.intentLogs.set(id, updated);
    return updated;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageIdCounter++;
    const chatMessage: ChatMessage = { 
      ...message, 
      id, 
      timestamp: new Date()
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

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

interface TransactionHistory {
  id: string;
  timestamp: string;
  txHash: string;
  status: string;
  gasUsed?: string;
}

export const storage = {
  intentLogs: [] as IntentLog[],
  transactionHistory: [] as TransactionHistory[]
};