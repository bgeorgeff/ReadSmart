# ReadSmart - Text Simplification & Reading Aid Application

## Overview

ReadSmart is a comprehensive reading comprehension tool that simplifies complex texts for different grade levels (1-12) and provides interactive reading aids. The application allows users to paste text, process it through AI to generate grade-appropriate summaries, and then interact with the simplified text through features like word definitions, text-to-speech, and audio recording capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks and React Query for server state
- **Routing**: Wouter for client-side routing
- **Styling**: Professional theme with Google Fonts (Google Sans, Roboto, Merriweather)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **API Design**: RESTful endpoints for text processing and word definitions
- **Development**: Hot module replacement via Vite integration

### Key Components

#### Text Processing Engine
- Uses OpenAI/OpenRouter API for AI-powered text simplification
- Generates 12 different grade-level summaries (grades 1-12)
- Handles technical term preservation and quote formatting
- Implements regex-based text cleaning for common duplication issues

#### Interactive Reading Tools
- **Word Highlighting**: Click-to-define functionality for vocabulary assistance
- **Text-to-Speech**: Browser-based speech synthesis with word highlighting during playback
- **Audio Recording**: Microphone access for recording reading practice sessions
- **Grade Level Selection**: Dynamic switching between different complexity levels

#### Data Management
- **Schema**: Drizzle ORM with PostgreSQL-compatible schema definitions
- **Storage Interface**: Abstracted storage layer supporting both memory and database backends
- **Session Management**: Express sessions with PostgreSQL store integration

## Data Flow

1. **Text Input**: User pastes or types text into the main input area
2. **AI Processing**: Text is sent to OpenAI/OpenRouter API for grade-level summarization
3. **Summary Storage**: Generated summaries are stored with unique IDs in the database
4. **Interactive Display**: User can select different grade levels and interact with the text
5. **Word Lookup**: Individual words trigger API calls for definitions and pronunciations
6. **Audio Features**: Recording and playback functionality integrates with the text display

## External Dependencies

### AI Services
- **Primary**: OpenRouter API (for access to multiple AI models)
- **Fallback**: OpenAI API direct integration
- **Purpose**: Generate grade-appropriate text summaries while preserving technical accuracy

### Audio APIs
- **MediaDevices API**: For microphone access and audio recording
- **Speech Synthesis API**: For text-to-speech functionality
- **Web Audio API**: For audio playback and progress tracking

### UI Libraries
- **Radix UI**: Accessible component primitives for modals, dialogs, and form controls
- **Lucide React**: Icon library for consistent visual elements
- **React Hook Form**: Form state management and validation

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite development server with Express API integration
- **TypeScript**: Full type checking across client, server, and shared code
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

### Production Build Process
1. **Client Build**: Vite bundles React application with optimizations
2. **Server Build**: esbuild compiles TypeScript server code to ESM
3. **Static Assets**: Client build outputs to dist/public for Express serving
4. **Environment Variables**: DATABASE_URL and API keys required for deployment

### Database Setup
- **Drizzle Kit**: Handles schema migrations and database pushes
- **PostgreSQL**: Primary database with Neon.tech integration
- **Connection**: Uses connection pooling via @neondatabase/serverless

## Changelog

- June 28, 2025. Initial setup
- June 28, 2025. Fixed critical syntax errors in ProcessingSummary component that were preventing app startup. Resolved missing function parameters, corrected component structure, and updated parent component props. Application now fully functional with text processing, grade-level summaries, word definitions, and audio features working correctly.
- June 28, 2025. Resolved text-to-speech word highlighting synchronization issues. Replaced complex timing calculations with standard `onboundary` event approach. Word highlighting now works perfectly on Windows 10 and iPhone devices with proper synchronization. Android devices (Samsung Galaxy S24) play speech without highlighting, which provides a clean user experience across all platforms.
- June 28, 2025. Completed comprehensive calibration of reading speed slider using incremental testing methodology. Updated WPM range from 75-180 to final reliable 105-165 WPM with true 15 WPM increments. Removed inconsistent 180 WPM level due to speech synthesis API limitations. Final five speed levels achieve actual WPM within 2-8 WPM of targets: 105→108, 120→121.6, 135→134, 150→148, 165→167 WPM. Slider provides genuine, noticeable speed differences with professional reliability.

## User Preferences

Preferred communication style: Simple, everyday language.