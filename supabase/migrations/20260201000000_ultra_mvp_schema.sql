-- Ultra-MVP Schema Migration
-- Minimalistyczna struktura - tylko jedna tabela flashcards
-- Usuwa wszystkie skomplikowane funkcje: SM-2, sesje nauki, limity AI, profile

-- ============================================================================
-- 1. DROP OLD SCHEMA (jeśli istnieje)
-- ============================================================================

-- Drop policies
DROP POLICY IF EXISTS study_reviews_delete_policy_authenticated ON public.study_reviews;
DROP POLICY IF EXISTS study_reviews_update_policy_authenticated ON public.study_reviews;
DROP POLICY IF EXISTS study_reviews_insert_policy_authenticated ON public.study_reviews;
DROP POLICY IF EXISTS study_reviews_select_policy_authenticated ON public.study_reviews;

DROP POLICY IF EXISTS study_sessions_delete_policy_authenticated ON public.study_sessions;
DROP POLICY IF EXISTS study_sessions_update_policy_authenticated ON public.study_sessions;
DROP POLICY IF EXISTS study_sessions_insert_policy_authenticated ON public.study_sessions;
DROP POLICY IF EXISTS study_sessions_select_policy_authenticated ON public.study_sessions;

DROP POLICY IF EXISTS ai_generations_delete_policy_authenticated ON public.ai_generations;
DROP POLICY IF EXISTS ai_generations_update_policy_authenticated ON public.ai_generations;
DROP POLICY IF EXISTS ai_generations_insert_policy_authenticated ON public.ai_generations;
DROP POLICY IF EXISTS ai_generations_select_policy_authenticated ON public.ai_generations;

DROP POLICY IF EXISTS flashcards_delete_policy_authenticated ON public.flashcards;
DROP POLICY IF EXISTS flashcards_update_policy_authenticated ON public.flashcards;
DROP POLICY IF EXISTS flashcards_insert_policy_authenticated ON public.flashcards;
DROP POLICY IF EXISTS flashcards_select_policy_authenticated ON public.flashcards;

DROP POLICY IF EXISTS profiles_insert_policy_anon ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_policy_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_policy_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_select_policy_authenticated ON public.profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.increment_ai_flashcards_used(uuid, integer);
DROP FUNCTION IF EXISTS public.delete_user_account();
DROP FUNCTION IF EXISTS public.check_and_reset_ai_limit(uuid);
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- Drop indexes
DROP INDEX IF EXISTS public.idx_study_reviews_session;
DROP INDEX IF EXISTS public.idx_study_reviews_flashcard_history;
DROP INDEX IF EXISTS public.idx_ai_generations_user;
DROP INDEX IF EXISTS public.idx_study_sessions_user;
DROP INDEX IF EXISTS public.idx_flashcards_user_created;
DROP INDEX IF EXISTS public.idx_flashcards_user_next_review;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.study_reviews;
DROP TABLE IF EXISTS public.study_sessions;
DROP TABLE IF EXISTS public.flashcards;
DROP TABLE IF EXISTS public.ai_generations;
DROP TABLE IF EXISTS public.profiles;

-- ============================================================================
-- 2. CREATE ULTRA-MVP SCHEMA
-- ============================================================================

-- Jedna prosta tabela dla fiszek
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL CHECK (char_length(front) > 0 AND char_length(front) <= 100),
  back TEXT NOT NULL CHECK (char_length(back) > 0 AND char_length(back) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.flashcards IS 'Ultra-MVP: Simple flashcards table without SM-2, sessions, or AI limits';
COMMENT ON COLUMN public.flashcards.front IS 'Front of flashcard (question, 1-100 chars)';
COMMENT ON COLUMN public.flashcards.back IS 'Back of flashcard (answer, 1-500 chars)';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Index dla szybkiego pobierania fiszek użytkownika
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);

-- Index dla sortowania chronologicznego (najnowsze na górze)
CREATE INDEX idx_flashcards_created_at ON public.flashcards(created_at DESC);

-- Compound index dla najczęstszego zapytania
CREATE INDEX idx_flashcards_user_created ON public.flashcards(user_id, created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- Włącz RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Select: użytkownicy widzą tylko swoje fiszki
CREATE POLICY flashcards_select_own 
  ON public.flashcards 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert: użytkownicy tworzą fiszki tylko dla siebie
CREATE POLICY flashcards_insert_own 
  ON public.flashcards 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update: użytkownicy edytują tylko swoje fiszki
CREATE POLICY flashcards_update_own 
  ON public.flashcards 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete: użytkownicy usuwają tylko swoje fiszki
CREATE POLICY flashcards_delete_own 
  ON public.flashcards 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. HELPER FUNCTIONS (opcjonalne, dla wygody)
-- ============================================================================

-- Funkcja do pobrania losowej fiszki użytkownika
CREATE OR REPLACE FUNCTION public.get_random_flashcard(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  front TEXT,
  back TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.front, f.back, f.created_at
  FROM public.flashcards f
  WHERE f.user_id = p_user_id
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_random_flashcard(UUID) IS 'Returns a random flashcard for the user (for study mode)';

-- Funkcja do statystyk użytkownika
CREATE OR REPLACE FUNCTION public.get_user_flashcard_stats(p_user_id UUID)
RETURNS TABLE (
  total_count BIGINT,
  oldest_date TIMESTAMPTZ,
  newest_date TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_count,
    MIN(created_at) AS oldest_date,
    MAX(created_at) AS newest_date
  FROM public.flashcards
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_flashcard_stats(UUID) IS 'Returns basic statistics about user flashcards';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
