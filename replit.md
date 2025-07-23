# Intellichain Agent

## Overview

Intellichain Agent is a Web3 AI assistant application that allows users to interact with blockchain smart contracts through natural language processing. Built specifically for the BlockDAG Primordial Testnet, it transforms complex blockchain operations into simple conversational interfaces.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

This is a full-stack TypeScript application using a monorepo structure with the following key architectural decisions:

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Framework**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Voice Input**: Web Speech API integration for natural language input

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Development**: Hot module replacement via Vite middleware integration
- **Storage**: In-memory storage with interface for future database integration

### Database Strategy
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Centralized in `/shared/schema.ts` for type safety across frontend/backend
- **Current State**: Using in-memory storage with migration path to PostgreSQL
- **Migration**: Drizzle Kit for database schema management

## Key Components

### Chat Interface
- Real-time chat with AI assistant simulation
- Voice input support via Web Speech API
- Transaction preview and confirmation workflow
- Message history with timestamps

### Transaction Management
- Pre-transaction preview with gas estimation
- User confirmation required before blockchain interaction
- Transaction status tracking (pending, success, failed)
- Intent logging for audit trail

### Dashboard & Analytics
- Statistics cards showing user activity
- Transaction history with filtering
- Gas optimization insights
- Chart visualization using Recharts

### Intent Registry
- Complete log of user intents and their blockchain outcomes
- Searchable and filterable transaction history
- Status tracking with visual indicators

## Data Flow

1. **User Input**: Natural language or voice input captured
2. **AI Processing**: Simulated AI intent recognition and smart contract function mapping
3. **Transaction Preview**: Gas estimation and parameter display
4. **User Confirmation**: Explicit approval required before execution
5. **Blockchain Interaction**: Transaction submission to BlockDAG testnet
6. **Status Tracking**: Real-time updates and result logging
7. **Historical Record**: Storage in intent registry for future reference

## External Dependencies

### UI Components
- Radix UI for accessible component primitives
- Lucide React for consistent iconography
- Embla Carousel for interactive content

### Development Tools
- Vite for fast development and building
- Replit integration for cloud development
- TypeScript for type safety

### Blockchain Integration
- Neon Database serverless for PostgreSQL hosting
- Drizzle ORM for type-safe database operations
- Connect-pg-simple for session management

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- Express server with TypeScript execution via tsx
- In-memory storage for rapid iteration

### Production
- Static build output served via Express
- Database connection to PostgreSQL via environment variables
- ESM bundle with external package dependencies
- Replit deployment ready with cloud hosting

### Environment Configuration
- `DATABASE_URL` for PostgreSQL connection
- `NODE_ENV` for environment detection
- Session-based storage ready for production scaling

The application follows a progressive enhancement approach, starting with in-memory storage and voice simulation, with clear migration paths to production blockchain integration and database persistence.