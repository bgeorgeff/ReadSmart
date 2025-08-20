# ReadSmart - Text Simplification & Reading Aid Application

## Overview
ReadSmart is a comprehensive reading comprehension tool designed to simplify complex texts for various grade levels (1-12) and offer interactive reading aids. The application enables users to input text, which is then processed by AI to generate grade-appropriate summaries. Key capabilities include word definitions, text-to-speech functionality, and audio recording for reading practice. The project includes a full admin dashboard for managing beta users and feedback. The project aims to provide an accessible and engaging platform for improving reading comprehension.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design Theme**: Professional, utilizing Google Fonts (Google Sans, Roboto, Merriweather).
- **Component Library**: shadcn/ui built on Radix UI for accessible components (modals, dialogs, form controls).
- **Iconography**: Lucide React for consistent visual elements.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, using Vite for builds, Tailwind CSS for styling, Wouter for routing, and React Query for server state management.
- **Backend**: Express.js with Node.js (ESM modules) and TypeScript, providing RESTful APIs.
- **Text Processing Engine**: Leverages OpenAI/OpenRouter APIs for AI-powered text simplification, generating 12 grade-level summaries, preserving technical terms, and handling quote formatting. Includes regex-based text cleaning.
- **Interactive Reading Tools**: Features click-to-define word highlighting, browser-based text-to-speech with synchronized highlighting, microphone access for audio recording, and dynamic grade level selection.
- **Data Management**: Uses Drizzle ORM with PostgreSQL (via Neon.tech) for schema definition and persistence, with an abstracted storage layer. Session management uses Express sessions with PostgreSQL store.
- **Admin Dashboard**: Complete admin interface at `/admin` with user management, feedback monitoring, statistics overview, and secure delete functionality with confirmation dialogs.

### System Design Choices
- **Development Workflow**: Hot module replacement, full TypeScript type checking, and configured path aliases.
- **Production Build**: Vite for client bundling, esbuild for server compilation, static asset serving via Express.
- **Database**: PostgreSQL as the primary database, managed with Drizzle Kit for migrations.
- **Syllabification System (Internal)**: An advanced V2 syllabification system leveraging the CMU Pronouncing Dictionary, incorporating morphological overrides, phonetic rules, and pattern-based fallbacks for linguistically accurate syllable division. This system operates in the background for future enhancements.

## External Dependencies

### AI Services
- **OpenRouter API**: Primary service for accessing various AI models for text summarization.
- **OpenAI API**: Fallback AI service for text processing.

### Audio APIs
- **MediaDevices API**: For microphone access and audio recording.
- **Speech Synthesis API**: For text-to-speech functionality.
- **Web Audio API**: For audio playback and progress tracking.

### Databases
- **PostgreSQL**: Used for data storage.
- **Neon.tech**: Provides serverless PostgreSQL capabilities.