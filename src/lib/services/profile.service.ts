import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDTO, ProfileEntity } from "../../types";
import { VALIDATION_CONSTRAINTS } from "../../types";

/**
 * Retrieves user profile with automatic AI limit reset
 *
 * This function:
 * 1. Calls check_and_reset_ai_limit database function
 * 2. Fetches the user profile from the database
 * 3. Transforms the entity to a DTO with computed fields
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the user
 * @returns ProfileDTO or null if profile not found
 * @throws Error if database operation fails
 */
export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null> {
  // Call database function to check and reset AI limit if needed
  // This function automatically resets ai_flashcards_used to 0 if limit_reset_date has passed
  const { error: resetError } = await supabase.rpc("check_and_reset_ai_limit", { p_user_id: userId });

  if (resetError) {
    throw new Error(`Failed to check AI limit: ${resetError.message}`);
  }

  // Fetch user profile with RLS automatically filtering by auth.uid()
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  if (!profileData) {
    return null;
  }

  // Transform database entity to DTO
  return transformProfileToDTO(profileData);
}

/**
 * Transforms ProfileEntity from database to ProfileDTO
 *
 * Adds computed field ai_flashcards_remaining and ensures
 * proper type conversions for API response
 *
 * @param entity - ProfileEntity from database query
 * @returns ProfileDTO with computed ai_flashcards_remaining field
 */
function transformProfileToDTO(entity: ProfileEntity): ProfileDTO {
  const aiFlashcardsRemaining = VALIDATION_CONSTRAINTS.AI_FLASHCARD_MONTHLY_LIMIT - entity.ai_flashcards_used;

  return {
    id: entity.id,
    ai_flashcards_used: entity.ai_flashcards_used,
    ai_flashcards_remaining: aiFlashcardsRemaining,
    limit_reset_date: entity.limit_reset_date,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}
