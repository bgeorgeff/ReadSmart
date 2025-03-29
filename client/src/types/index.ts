// Grade level type
export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Summaries object containing all grade levels
export type Summaries = Record<GradeLevel, string>;

// API responses
export interface ProcessTextResponse {
  success: boolean;
  summaryId: number;
  summaries: Summaries;
  message?: string;
}

export interface GradeLevelSummaryResponse {
  success: boolean;
  summary: string;
  gradeLevel: GradeLevel;
  message?: string;
}

export interface WordDetailResponse {
  success: boolean;
  word: string;
  syllables: string[];
  pronunciation: string;
  message?: string;
}

export interface SaveRecordingResponse {
  success: boolean;
  recordingId: number;
  message?: string;
}

// Audio recording states
export enum RecordingState {
  INACTIVE = 'inactive',
  RECORDING = 'recording',
  PLAYBACK = 'playback'
}

// App steps
export enum AppStep {
  TEXT_INPUT = 'text_input',
  PROCESSING = 'processing',
  SUMMARY = 'summary',
  READING = 'reading'
}
