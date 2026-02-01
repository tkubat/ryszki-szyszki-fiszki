/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * This file contains all type definitions for API requests and responses.
 * DTOs are derived from database entity types defined in database.types.ts
 * to ensure type safety and consistency between database and API layers.
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

/**
 * Core database entity types extracted from the Database schema
 */
export type ProfileEntity = Database["public"]["Tables"]["profiles"]["Row"];
export type FlashcardEntity = Database["public"]["Tables"]["flashcards"]["Row"];
export type AIGenerationEntity = Database["public"]["Tables"]["ai_generations"]["Row"];
export type StudySessionEntity = Database["public"]["Tables"]["study_sessions"]["Row"];
export type StudyReviewEntity = Database["public"]["Tables"]["study_reviews"]["Row"];

export type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
export type StudySessionInsert = Database["public"]["Tables"]["study_sessions"]["Insert"];
export type StudyReviewInsert = Database["public"]["Tables"]["study_reviews"]["Insert"];

// ============================================================================
// Common/Shared DTOs
// ============================================================================

/**
 * Standard pagination metadata for list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

/**
 * Generic success message response
 */
export interface MessageResponseDTO {
  message: string;
}

/**
 * Standard error response format for all API errors
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | { field: string; message: string }[];
  };
}

/**
 * Progress tracking within a study session
 */
export interface SessionProgressDTO {
  cards_reviewed: number;
  cards_scheduled: number;
}

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * User profile with AI usage information
 * Extends ProfileEntity with computed ai_flashcards_remaining field
 */
export interface ProfileDTO extends Omit<ProfileEntity, "id"> {
  id: string;
  ai_flashcards_used: number;
  ai_flashcards_remaining: number;
  limit_reset_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Command to delete user account (GDPR compliance)
 * Requires exact confirmation phrase
 */
export interface DeleteAccountCommand {
  confirmation: string;
}

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Complete flashcard data transfer object
 * Directly maps to FlashcardEntity from database
 */
export interface FlashcardDTO {
  id: number;
  front: string;
  back: string;
  source: string;
  ai_generation_id: number | null;
  ai_quality_rating: number | null;
  next_review_date: string;
  easiness_factor: number;
  repetitions: number;
  interval_days: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified flashcard DTO for due cards in study sessions
 * Contains only fields needed for studying
 */
export interface FlashcardDueDTO {
  id: number;
  front: string;
  back: string;
  easiness_factor: number;
  repetitions: number;
  interval_days: number;
  next_review_date: string;
}

/**
 * Command to create a new manual flashcard
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * Command to update an existing flashcard
 * Both fields are optional but at least one must be provided
 */
export interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}

/**
 * Command to update AI-generated flashcard quality rating
 * Rating: 1 = thumbs up, -1 = thumbs down, null = clear rating
 */
export interface UpdateFlashcardRatingCommand {
  rating: 1 | -1 | null;
}

/**
 * Paginated list response for flashcards
 */
export interface FlashcardListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// AI Generation DTOs
// ============================================================================

/**
 * Command to generate flashcards using AI
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
  requested_count: number;
}

/**
 * Preview of a single generated flashcard (before acceptance)
 * Contains temporary ID for tracking during acceptance phase
 */
export interface GeneratedFlashcardPreviewDTO {
  temp_id: string;
  front: string;
  back: string;
}

/**
 * Response from AI flashcard generation endpoint
 * Contains preview flashcards and generation metadata
 */
export interface GenerateFlashcardsResponseDTO {
  generation_id: number;
  requested_count: number;
  generated_count: number;
  flashcards: GeneratedFlashcardPreviewDTO[];
  generation_time_ms: number;
  model_used: string;
}

/**
 * Single flashcard in the acceptance request
 * User can edit content and provide quality rating
 */
export interface AcceptFlashcardDTO {
  temp_id: string;
  front: string;
  back: string;
  rating: 1 | -1 | null;
}

/**
 * Command to accept (and optionally edit) generated flashcards
 */
export interface AcceptGeneratedFlashcardsCommand {
  flashcards: AcceptFlashcardDTO[];
}

/**
 * Single accepted flashcard in the response
 * Contains database ID and final saved data
 */
export interface AcceptedFlashcardDTO {
  id: number;
  front: string;
  back: string;
  source: string;
  ai_generation_id: number;
  ai_quality_rating: number | null;
  created_at: string;
}

/**
 * Response after accepting generated flashcards
 * Includes saved flashcards and updated AI limit
 */
export interface AcceptGeneratedFlashcardsResponseDTO {
  accepted_count: number;
  flashcards: AcceptedFlashcardDTO[];
  ai_flashcards_remaining: number;
}

/**
 * Response after rejecting generated flashcards
 */
export interface RejectGeneratedFlashcardsResponseDTO {
  message: string;
  ai_flashcards_remaining: number;
}

// ============================================================================
// Study Session DTOs
// ============================================================================

/**
 * Complete study session data
 * Extends StudySessionEntity with computed duration field
 */
export interface StudySessionDTO {
  id: number;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  cards_scheduled: number;
  cards_reviewed: number;
  cards_easy: number;
  cards_medium: number;
  cards_hard: number;
  duration_seconds?: number;
}

/**
 * Simplified study session for list view
 */
export interface StudySessionListItemDTO {
  session_id: number;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  cards_reviewed: number;
  cards_easy: number;
  cards_medium: number;
  cards_hard: number;
}

/**
 * Response when starting a new study session
 */
export interface StartStudySessionResponseDTO {
  session_id: number;
  started_at: string;
  cards_scheduled: number;
  cards_reviewed: number;
  flashcards: FlashcardDueDTO[];
}

/**
 * Response for GET /api/v1/flashcards/due
 */
export interface FlashcardsDueResponseDTO {
  count: number;
  flashcards: FlashcardDueDTO[];
}

/**
 * Command to submit a flashcard review within a study session
 * Difficulty rating: 1 = easy, 2 = medium, 3 = hard
 */
export interface SubmitReviewCommand {
  flashcard_id: number;
  difficulty_rating: 1 | 2 | 3;
}

/**
 * Response after submitting a flashcard review
 * Contains SM-2 algorithm results and session progress
 */
export interface SubmitReviewResponseDTO {
  review_id: number;
  flashcard_id: number;
  difficulty_rating: number;
  previous_ef: number;
  new_ef: number;
  previous_interval: number;
  new_interval: number;
  next_review_date: string;
  reviewed_at: string;
  session_progress: SessionProgressDTO;
}

/**
 * Command to complete or interrupt a study session
 */
export interface CompleteStudySessionCommand {
  completed: boolean;
}

/**
 * Individual review record in session summary
 */
export interface ReviewHistoryItemDTO {
  flashcard_id: number;
  difficulty_rating: number;
  reviewed_at: string;
}

/**
 * Complete study session summary including review history
 */
export interface StudySessionSummaryDTO extends StudySessionDTO {
  reviews: ReviewHistoryItemDTO[];
}

/**
 * Paginated list response for study sessions
 */
export interface StudySessionListResponseDTO {
  data: StudySessionListItemDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Statistics DTOs
// ============================================================================

/**
 * Nested statistics for flashcards
 */
export interface FlashcardStatisticsDTO {
  total: number;
  ai_generated: number;
  manual: number;
  due_today: number;
  new: number;
}

/**
 * Nested statistics for study sessions
 */
export interface StudySessionStatisticsDTO {
  total: number;
  this_week: number;
  this_month: number;
  completed: number;
  interrupted: number;
}

/**
 * Nested statistics for reviews
 */
export interface ReviewStatisticsDTO {
  total: number;
  this_week: number;
  this_month: number;
  easy: number;
  medium: number;
  hard: number;
}

/**
 * Nested statistics for AI usage
 */
export interface AIUsageStatisticsDTO {
  ai_flashcards_used: number;
  ai_flashcards_remaining: number;
  limit_reset_date: string;
}

/**
 * Complete user statistics response
 * Aggregated data from multiple tables
 */
export interface UserStatisticsDTO {
  flashcards: FlashcardStatisticsDTO;
  study_sessions: StudySessionStatisticsDTO;
  reviews: ReviewStatisticsDTO;
  ai_usage: AIUsageStatisticsDTO;
}

// ============================================================================
// Type Guards and Validation Helpers
// ============================================================================

/**
 * Type guard to check if a rating is valid
 */
export function isValidRating(rating: unknown): rating is 1 | -1 | null {
  return rating === 1 || rating === -1 || rating === null;
}

/**
 * Type guard to check if a difficulty rating is valid
 */
export function isValidDifficultyRating(rating: unknown): rating is 1 | 2 | 3 {
  return rating === 1 || rating === 2 || rating === 3;
}

/**
 * Type guard to check if a flashcard source is valid
 */
export function isValidFlashcardSource(source: unknown): source is "ai" | "manual" {
  return source === "ai" || source === "manual";
}

// ============================================================================
// Constants
// ============================================================================

/**
 * API validation constraints
 */
export const VALIDATION_CONSTRAINTS = {
  FLASHCARD_FRONT_MIN: 1,
  FLASHCARD_FRONT_MAX: 100,
  FLASHCARD_BACK_MIN: 1,
  FLASHCARD_BACK_MAX: 500,
  SOURCE_TEXT_MIN: 50,
  SOURCE_TEXT_MAX: 2000,
  REQUESTED_COUNT_MIN: 1,
  REQUESTED_COUNT_MAX: 10,
  AI_FLASHCARD_MONTHLY_LIMIT: 100,
  EASINESS_FACTOR_MIN: 1.3,
  EASINESS_FACTOR_MAX: 2.5,
  DEFAULT_EASINESS_FACTOR: 2.5,
  PAGE_SIZE_DEFAULT: 50,
  PAGE_SIZE_MAX: 100,
  SESSION_PAGE_SIZE_DEFAULT: 20,
  SESSION_PAGE_SIZE_MAX: 50,
} as const;

/**
 * Flashcard sources
 */
export const FLASHCARD_SOURCES = {
  AI: "ai",
  MANUAL: "manual",
} as const;

/**
 * Difficulty ratings for SM-2 algorithm
 */
export const DIFFICULTY_RATINGS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
} as const;

/**
 * Quality ratings for AI-generated flashcards
 */
export const QUALITY_RATINGS = {
  THUMBS_UP: 1,
  THUMBS_DOWN: -1,
} as const;

/**
 * SM-2 algorithm quality mapping from difficulty ratings
 */
export const SM2_QUALITY_MAP = {
  [DIFFICULTY_RATINGS.EASY]: 5,
  [DIFFICULTY_RATINGS.MEDIUM]: 3,
  [DIFFICULTY_RATINGS.HARD]: 0,
} as const;
