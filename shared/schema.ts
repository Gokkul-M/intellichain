import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const intentLogs = pgTable("intent_logs", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  action: text("action").notNull(),
  token: text("token"),
  amount: decimal("amount", { precision: 18, scale: 8 }),
  contractAddress: text("contract_address"),
  functionName: text("function_name"),
  gasEstimate: text("gas_estimate"),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"), // pending, success, failed
  blockNumber: integer("block_number"),
  simulationResult: jsonb("simulation_result"),
  parsedIntent: jsonb("parsed_intent"),
  userAddress: text("user_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  intentLogId: integer("intent_log_id").references(() => intentLogs.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertIntentLogSchema = createInsertSchema(intentLogs).omit({
  id: true,
  timestamp: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type IntentLog = typeof intentLogs.$inferSelect;
export type InsertIntentLog = z.infer<typeof insertIntentLogSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
