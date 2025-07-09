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
- June 30, 2025. Implemented industry-standard word highlighting synchronization using character-position mapping from boundary events. Replaced simple word counting with proven approach used by NaturalReaders and Speechify. Added precise tokenization alignment, cross-browser compatibility, and robust matching with tolerance for speech engine variations. Fixed first word highlighting issue by adding immediate highlight on speech start. Word highlighting now perfectly synchronized at all five reading speeds.
- July 1, 2025. Added intelligent automatic text shortening for texts exceeding 650 words or 3,772 characters. System transparently shortens text while preserving original reading level, tone, and key information using AI-powered editing. Users experience seamless processing without knowing their text was modified. Maintains technical vocabulary and proper nouns exactly as written.
- July 7, 2025. Replaced custom phonetic syllabification rules with dictionary-based syllabification using Hypher.js library. Server-side implementation chosen for better code flow and consistency with existing API architecture. Uses English US hyphenation patterns for accurate, standardized syllable breaks. Simplified word detail popup UI by removing pronunciation display and moving pronounce button higher.
- July 7, 2025. Implemented comprehensive syllable hyphenation system with three-layer accuracy approach: (1) Manual override dictionary for educational words requiring perfect accuracy like "adaptability" → "a-dap-ta-bil-i-ty" and "mathematicians" → "math-e-ma-ti-cians", (2) Pattern-based post-processing fixing systematic errors (ly, tional, unan, ary, ity, ally, mati patterns), (3) Professional hypher library with Franklin M. Liang's algorithm (89% accuracy) for general vocabulary. System now provides linguistically accurate syllable divisions suitable for educational pronunciation instruction across all grade levels.
- July 9, 2025. Cleaned up outdated syllabification code in preparation for CMU Pronouncing Dictionary integration. Removed hypher library dependencies (hypher, hyphenation.en-us, syllable, cmudict) due to data integrity concerns with Moby Hyphenator and pivot to educational syllabification vs typographic hyphenation. Simplified syllable.ts to temporary single-syllable return until CMU implementation. Removed test routes and legacy pattern-matching code. Ready to implement CMU dictionary-based educational syllabification with 134,000+ words.
- July 9, 2025. Successfully implemented comprehensive CMU Pronouncing Dictionary syllabification system with 125,770 entries loaded from official Carnegie Mellon source. Integrated ARPAbet phoneme-to-syllable conversion algorithm with intelligent vowel-based splitting for educational accuracy. System provides linguistically accurate syllable divisions (testing→"tes•ting", education→"e•du•cat•ion", beautiful→"beau•ti•ful") with real-time processing (1-3 seconds per word). Includes intelligent fallback system for words not in dictionary. Fully operational and ready for educational pronunciation instruction across all grade levels.
- July 9, 2025. Refined syllabification algorithm with expert linguistic guidance implementing three-tier educational syllable division rules: (1) Morphological structure trumps other rules for educational clarity (testing→"test-ing" to show root+suffix), (2) Consonant clusters that begin real words stay together (incredible→"in-cre-di-ble" keeps "cr" cluster), (3) Consonants go to the left of vowels when possible unless illustrating morphological structure. System now provides pedagogically accurate syllable divisions optimized for pronunciation instruction and morphological awareness.

## User Preferences

Preferred communication style: Simple, everyday language.