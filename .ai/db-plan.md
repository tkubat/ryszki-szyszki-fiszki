# Schema Bazy Danych - Ryszki Szyszki Fiszki

## 1. Tabele

### 1.1 profiles

Tabela przechowująca dane użytkowników aplikacji. Powiązana 1:1 z `auth.users` z Supabase Auth.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_flashcards_used INTEGER NOT NULL DEFAULT 0,
    limit_reset_date DATE NOT NULL DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_profiles_ai_limit CHECK (ai_flashcards_used >= 0 AND ai_flashcards_used <= 100)
);
```

**Kolumny:**
- `id` (UUID, PK, FK) - identyfikator użytkownika, klucz obcy do `auth.users.id`
- `ai_flashcards_used` (INTEGER) - liczba wykorzystanych fiszek AI w bieżącym miesiącu (0-100)
- `limit_reset_date` (DATE) - data następnego resetu limitu fiszek AI
- `created_at` (TIMESTAMPTZ) - data utworzenia profilu
- `updated_at` (TIMESTAMPTZ) - data ostatniej aktualizacji profilu

**Constraints:**
- `chk_profiles_ai_limit` - wymusza wartość 0-100 dla licznika fiszek AI

---

### 1.2 flashcards

Tabela przechowująca wszystkie fiszki (zarówno wygenerowane przez AI, jak i utworzone ręcznie).

```sql
CREATE TABLE public.flashcards (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    front VARCHAR(100) NOT NULL,
    back VARCHAR(500) NOT NULL,
    source TEXT NOT NULL,
    ai_generation_id BIGINT REFERENCES public.ai_generations(id) ON DELETE SET NULL,
    ai_quality_rating SMALLINT,
    easiness_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50,
    repetitions INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 0,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_flashcards_front_length CHECK (LENGTH(front) >= 1 AND LENGTH(front) <= 100),
    CONSTRAINT chk_flashcards_back_length CHECK (LENGTH(back) >= 1 AND LENGTH(back) <= 500),
    CONSTRAINT chk_flashcards_source_valid CHECK (source IN ('ai', 'manual')),
    CONSTRAINT chk_flashcards_source_consistency CHECK (
        (source = 'ai' AND ai_generation_id IS NOT NULL) OR 
        (source = 'manual' AND ai_generation_id IS NULL)
    ),
    CONSTRAINT chk_flashcards_ai_rating CHECK (ai_quality_rating IN (-1, 1) OR ai_quality_rating IS NULL),
    CONSTRAINT chk_flashcards_easiness_factor CHECK (easiness_factor >= 1.30 AND easiness_factor <= 2.50),
    CONSTRAINT chk_flashcards_repetitions CHECK (repetitions >= 0),
    CONSTRAINT chk_flashcards_interval CHECK (interval_days >= 0)
);
```

**Kolumny:**
- `id` (BIGSERIAL, PK) - unikalny identyfikator fiszki
- `user_id` (UUID, FK) - właściciel fiszki
- `front` (VARCHAR(100)) - przód fiszki (pytanie)
- `back` (VARCHAR(500)) - tył fiszki (odpowiedź)
- `source` (TEXT) - źródło fiszki: 'ai' lub 'manual'
- `ai_generation_id` (BIGINT, FK, nullable) - referencja do sesji generowania AI (tylko dla fiszek AI)
- `ai_quality_rating` (SMALLINT, nullable) - ocena jakości fiszki AI: -1 (thumbs down), 1 (thumbs up), NULL (brak oceny)
- `easiness_factor` (DECIMAL(3,2)) - współczynnik łatwości SM-2 (1.30-2.50)
- `repetitions` (INTEGER) - liczba udanych powtórek SM-2
- `interval_days` (INTEGER) - interwał dni do następnej powtórki SM-2
- `next_review_date` (DATE) - data następnej zaplanowanej powtórki
- `last_reviewed_at` (TIMESTAMPTZ, nullable) - data i czas ostatniej powtórki
- `created_at` (TIMESTAMPTZ) - data utworzenia fiszki
- `updated_at` (TIMESTAMPTZ) - data ostatniej modyfikacji fiszki

**Constraints:**
- `chk_flashcards_front_length` - wymusza długość 1-100 znaków dla przodu fiszki
- `chk_flashcards_back_length` - wymusza długość 1-500 znaków dla tyłu fiszki
- `chk_flashcards_source_valid` - wymusza wartość 'ai' lub 'manual'
- `chk_flashcards_source_consistency` - wymusza spójność: fiszki AI muszą mieć `ai_generation_id`, manualne muszą mieć NULL
- `chk_flashcards_ai_rating` - wymusza wartość -1, 1 lub NULL
- `chk_flashcards_easiness_factor` - wymusza zakres 1.30-2.50 dla współczynnika SM-2
- `chk_flashcards_repetitions` - wymusza wartość >= 0
- `chk_flashcards_interval` - wymusza wartość >= 0

---

### 1.3 ai_generations

Tabela przechowująca informacje o sesjach generowania fiszek przez AI (dla analityki i debugowania).

```sql
CREATE TABLE public.ai_generations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_text VARCHAR(2000) NOT NULL,
    requested_count INTEGER NOT NULL,
    generated_count INTEGER NOT NULL DEFAULT 0,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    generation_time_ms INTEGER,
    model_used VARCHAR(100),
    prompt_version VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_ai_generations_source_length CHECK (LENGTH(source_text) >= 50 AND LENGTH(source_text) <= 2000),
    CONSTRAINT chk_ai_generations_requested CHECK (requested_count >= 1 AND requested_count <= 10),
    CONSTRAINT chk_ai_generations_counts CHECK (
        generated_count >= 0 AND 
        accepted_count >= 0 AND 
        accepted_count <= generated_count
    ),
    CONSTRAINT chk_ai_generations_time CHECK (generation_time_ms IS NULL OR generation_time_ms >= 0)
);
```

**Kolumny:**
- `id` (BIGSERIAL, PK) - unikalny identyfikator sesji generowania
- `user_id` (UUID, FK) - użytkownik, który zlecił generowanie
- `source_text` (VARCHAR(2000)) - tekst źródłowy użyty do generowania fiszek
- `requested_count` (INTEGER) - liczba żądanych fiszek (1-10)
- `generated_count` (INTEGER) - liczba faktycznie wygenerowanych fiszek
- `accepted_count` (INTEGER) - liczba zaakceptowanych przez użytkownika fiszek
- `generation_time_ms` (INTEGER, nullable) - czas generowania w milisekundach
- `model_used` (VARCHAR(100), nullable) - nazwa użytego modelu AI (np. "gpt-3.5-turbo")
- `prompt_version` (VARCHAR(50), nullable) - wersja użytego promptu (dla analizy zmian)
- `error_message` (TEXT, nullable) - komunikat błędu (jeśli generowanie się nie powiodło)
- `created_at` (TIMESTAMPTZ) - data i czas rozpoczęcia generowania

**Constraints:**
- `chk_ai_generations_source_length` - wymusza długość 50-2000 znaków dla tekstu źródłowego
- `chk_ai_generations_requested` - wymusza zakres 1-10 dla liczby żądanych fiszek
- `chk_ai_generations_counts` - wymusza logiczność liczników (accepted <= generated, wartości >= 0)
- `chk_ai_generations_time` - wymusza wartość >= 0 dla czasu generowania (lub NULL)

---

### 1.4 study_sessions

Tabela przechowująca informacje o sesjach nauki użytkowników.

```sql
CREATE TABLE public.study_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    completed BOOLEAN NOT NULL DEFAULT false,
    cards_scheduled INTEGER NOT NULL DEFAULT 0,
    cards_reviewed INTEGER NOT NULL DEFAULT 0,
    cards_easy INTEGER NOT NULL DEFAULT 0,
    cards_medium INTEGER NOT NULL DEFAULT 0,
    cards_hard INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT chk_study_sessions_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT chk_study_sessions_reviewed_count CHECK (cards_reviewed <= cards_scheduled),
    CONSTRAINT chk_study_sessions_difficulty_sum CHECK (
        cards_easy + cards_medium + cards_hard = cards_reviewed
    ),
    CONSTRAINT chk_study_sessions_counts CHECK (
        cards_scheduled >= 0 AND 
        cards_reviewed >= 0 AND 
        cards_easy >= 0 AND 
        cards_medium >= 0 AND 
        cards_hard >= 0
    )
);
```

**Kolumny:**
- `id` (BIGSERIAL, PK) - unikalny identyfikator sesji nauki
- `user_id` (UUID, FK) - użytkownik przeprowadzający sesję
- `started_at` (TIMESTAMPTZ) - data i czas rozpoczęcia sesji
- `ended_at` (TIMESTAMPTZ, nullable) - data i czas zakończenia sesji (NULL = sesja w trakcie)
- `completed` (BOOLEAN) - czy sesja została ukończona (true) czy przerwana (false)
- `cards_scheduled` (INTEGER) - liczba fiszek zaplanowanych do powtórki w tej sesji
- `cards_reviewed` (INTEGER) - liczba faktycznie powtórzonych fiszek
- `cards_easy` (INTEGER) - liczba fiszek ocenionych jako łatwe (1)
- `cards_medium` (INTEGER) - liczba fiszek ocenionych jako średnie (2)
- `cards_hard` (INTEGER) - liczba fiszek ocenionych jako trudne (3)

**Constraints:**
- `chk_study_sessions_end_after_start` - wymusza że `ended_at` >= `started_at` (gdy nie NULL)
- `chk_study_sessions_reviewed_count` - wymusza że liczba powtórzonych <= zaplanowanych
- `chk_study_sessions_difficulty_sum` - wymusza że suma ocen trudności = liczba powtórzonych
- `chk_study_sessions_counts` - wymusza wartości >= 0 dla wszystkich liczników

---

### 1.5 study_reviews

Tabela przechowująca historię pojedynczych powtórek fiszek (dla algorytmu SM-2 i analityki).

```sql
CREATE TABLE public.study_reviews (
    id BIGSERIAL PRIMARY KEY,
    flashcard_id BIGINT NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    study_session_id BIGINT NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
    difficulty_rating SMALLINT NOT NULL,
    previous_ef DECIMAL(3,2) NOT NULL,
    new_ef DECIMAL(3,2) NOT NULL,
    previous_interval INTEGER NOT NULL,
    new_interval INTEGER NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_study_reviews_difficulty CHECK (difficulty_rating BETWEEN 1 AND 3),
    CONSTRAINT chk_study_reviews_ef CHECK (
        previous_ef >= 1.30 AND previous_ef <= 2.50 AND
        new_ef >= 1.30 AND new_ef <= 2.50
    ),
    CONSTRAINT chk_study_reviews_interval CHECK (
        previous_interval >= 0 AND new_interval >= 0
    )
);
```

**Kolumny:**
- `id` (BIGSERIAL, PK) - unikalny identyfikator powtórki
- `flashcard_id` (BIGINT, FK) - fiszka, która była powtarzana
- `study_session_id` (BIGINT, FK) - sesja nauki, w której miała miejsce powtórka
- `difficulty_rating` (SMALLINT) - ocena trudności: 1 (łatwe), 2 (średnie), 3 (trudne)
- `previous_ef` (DECIMAL(3,2)) - poprzedni współczynnik łatwości SM-2
- `new_ef` (DECIMAL(3,2)) - nowy współczynnik łatwości SM-2 po aktualizacji
- `previous_interval` (INTEGER) - poprzedni interwał w dniach
- `new_interval` (INTEGER) - nowy interwał w dniach po aktualizacji
- `reviewed_at` (TIMESTAMPTZ) - data i czas powtórki

**Constraints:**
- `chk_study_reviews_difficulty` - wymusza wartość 1-3 dla oceny trudności
- `chk_study_reviews_ef` - wymusza zakres 1.30-2.50 dla współczynników EF
- `chk_study_reviews_interval` - wymusza wartości >= 0 dla interwałów

---

## 2. Relacje między tabelami

### 2.1 Diagram relacji

```
auth.users (Supabase Auth)
    ↓ 1:1 ON DELETE CASCADE
profiles
    ↓ 1:N ON DELETE CASCADE
    ├─→ flashcards
    ├─→ ai_generations
    └─→ study_sessions

ai_generations
    ↓ 1:N ON DELETE SET NULL
flashcards
    ↓ 1:N ON DELETE CASCADE
study_reviews
    ↑ N:1 ON DELETE CASCADE
study_sessions
```

### 2.2 Szczegółowy opis relacji

**profiles ↔ auth.users**
- Typ: 1:1 (one-to-one)
- FK: `profiles.id` → `auth.users.id`
- ON DELETE: CASCADE
- Opis: Każdy użytkownik z Supabase Auth ma dokładnie jeden profil w aplikacji. Usunięcie użytkownika z `auth.users` automatycznie usuwa profil.

**profiles ↔ flashcards**
- Typ: 1:N (one-to-many)
- FK: `flashcards.user_id` → `profiles.id`
- ON DELETE: CASCADE
- Opis: Użytkownik może posiadać wiele fiszek. Usunięcie profilu usuwa wszystkie fiszki użytkownika.

**profiles ↔ ai_generations**
- Typ: 1:N (one-to-many)
- FK: `ai_generations.user_id` → `profiles.id`
- ON DELETE: CASCADE
- Opis: Użytkownik może mieć wiele sesji generowania AI. Usunięcie profilu usuwa historię generowań.

**profiles ↔ study_sessions**
- Typ: 1:N (one-to-many)
- FK: `study_sessions.user_id` → `profiles.id`
- ON DELETE: CASCADE
- Opis: Użytkownik może mieć wiele sesji nauki. Usunięcie profilu usuwa historię sesji.

**ai_generations ↔ flashcards**
- Typ: 1:N (one-to-many)
- FK: `flashcards.ai_generation_id` → `ai_generations.id`
- ON DELETE: SET NULL
- Opis: Jedna sesja generowania AI może stworzyć wiele fiszek. Usunięcie rekordu generowania ustawia `ai_generation_id` na NULL w fiszkach (zachowujemy fiszki, ale tracimy informację o ich pochodzeniu).

**flashcards ↔ study_reviews**
- Typ: 1:N (one-to-many)
- FK: `study_reviews.flashcard_id` → `flashcards.id`
- ON DELETE: CASCADE
- Opis: Jedna fiszka może mieć wiele powtórek w historii. Usunięcie fiszki usuwa całą historię jej powtórek.

**study_sessions ↔ study_reviews**
- Typ: 1:N (one-to-many)
- FK: `study_reviews.study_session_id` → `study_sessions.id`
- ON DELETE: CASCADE
- Opis: Jedna sesja nauki zawiera wiele pojedynczych powtórek. Usunięcie sesji usuwa wszystkie jej powtórki.

---

## 3. Indeksy

### 3.1 Indeksy wydajnościowe

```sql
-- Najbardziej krytyczny indeks: zapytania o fiszki do powtórki
CREATE INDEX idx_flashcards_user_next_review 
ON public.flashcards(user_id, next_review_date);

-- Listowanie fiszek użytkownika (sortowanie chronologiczne)
CREATE INDEX idx_flashcards_user_created 
ON public.flashcards(user_id, created_at DESC);

-- Historia sesji nauki użytkownika
CREATE INDEX idx_study_sessions_user 
ON public.study_sessions(user_id, started_at DESC);

-- Analityka generowania AI
CREATE INDEX idx_ai_generations_user 
ON public.ai_generations(user_id, created_at DESC);

-- Historia powtórek pojedynczej fiszki
CREATE INDEX idx_study_reviews_flashcard_history 
ON public.study_reviews(flashcard_id, reviewed_at DESC);

-- Pobieranie powtórek z sesji
CREATE INDEX idx_study_reviews_session 
ON public.study_reviews(study_session_id);
```

### 3.2 Uzasadnienie indeksów

| Indeks | Zapytanie | Znaczenie |
|--------|-----------|-----------|
| `idx_flashcards_user_next_review` | SELECT * FROM flashcards WHERE user_id = ? AND next_review_date <= CURRENT_DATE | **Krytyczny** - główna funkcjonalność aplikacji |
| `idx_flashcards_user_created` | SELECT * FROM flashcards WHERE user_id = ? ORDER BY created_at DESC | Wysoka - wyświetlanie listy fiszek |
| `idx_study_sessions_user` | SELECT * FROM study_sessions WHERE user_id = ? ORDER BY started_at DESC | Średnia - historia sesji |
| `idx_ai_generations_user` | SELECT * FROM ai_generations WHERE user_id = ? ORDER BY created_at DESC | Niska - analityka |
| `idx_study_reviews_flashcard_history` | SELECT * FROM study_reviews WHERE flashcard_id = ? ORDER BY reviewed_at DESC | Średnia - historia pojedynczej fiszki |
| `idx_study_reviews_session` | SELECT * FROM study_reviews WHERE study_session_id = ? | Średnia - szczegóły sesji |

---

## 4. Row Level Security (RLS)

### 4.1 Włączenie RLS

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_reviews ENABLE ROW LEVEL SECURITY;
```

### 4.2 Polityki dla profiles

```sql
-- SELECT: Użytkownik może odczytać tylko swój profil
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- UPDATE: Użytkownik może aktualizować tylko swój profil
CREATE POLICY profiles_update_policy ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE: Użytkownik może usunąć tylko swój profil
CREATE POLICY profiles_delete_policy ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- INSERT: Tylko trigger może tworzyć profile (zabezpieczenie)
CREATE POLICY profiles_insert_policy ON public.profiles
    FOR INSERT
    WITH CHECK (false);
```

### 4.3 Polityki dla flashcards

```sql
-- SELECT: Użytkownik może odczytać tylko swoje fiszki
CREATE POLICY flashcards_select_policy ON public.flashcards
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Użytkownik może tworzyć fiszki tylko dla siebie
CREATE POLICY flashcards_insert_policy ON public.flashcards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje fiszki
CREATE POLICY flashcards_update_policy ON public.flashcards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje fiszki
CREATE POLICY flashcards_delete_policy ON public.flashcards
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.4 Polityki dla ai_generations

```sql
-- SELECT: Użytkownik może odczytać tylko swoje generowania
CREATE POLICY ai_generations_select_policy ON public.ai_generations
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Użytkownik może tworzyć generowania tylko dla siebie
CREATE POLICY ai_generations_insert_policy ON public.ai_generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje generowania
CREATE POLICY ai_generations_update_policy ON public.ai_generations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje generowania
CREATE POLICY ai_generations_delete_policy ON public.ai_generations
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.5 Polityki dla study_sessions

```sql
-- SELECT: Użytkownik może odczytać tylko swoje sesje
CREATE POLICY study_sessions_select_policy ON public.study_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Użytkownik może tworzyć sesje tylko dla siebie
CREATE POLICY study_sessions_insert_policy ON public.study_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje sesje
CREATE POLICY study_sessions_update_policy ON public.study_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje sesje
CREATE POLICY study_sessions_delete_policy ON public.study_sessions
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.6 Polityki dla study_reviews

```sql
-- SELECT: Użytkownik może odczytać tylko powtórki swoich fiszek
CREATE POLICY study_reviews_select_policy ON public.study_reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.flashcards
            WHERE flashcards.id = study_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    );

-- INSERT: Użytkownik może tworzyć powtórki tylko dla swoich fiszek
CREATE POLICY study_reviews_insert_policy ON public.study_reviews
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.flashcards
            WHERE flashcards.id = study_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    );

-- UPDATE: Użytkownik może aktualizować tylko powtórki swoich fiszek
CREATE POLICY study_reviews_update_policy ON public.study_reviews
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.flashcards
            WHERE flashcards.id = study_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.flashcards
            WHERE flashcards.id = study_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    );

-- DELETE: Użytkownik może usuwać tylko powtórki swoich fiszek
CREATE POLICY study_reviews_delete_policy ON public.study_reviews
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.flashcards
            WHERE flashcards.id = study_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    );
```

---

## 5. Funkcje i Triggery

### 5.1 Automatyczne tworzenie profilu dla nowego użytkownika

```sql
-- Funkcja tworząca profil przy rejestracji użytkownika
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, ai_flashcards_used, limit_reset_date)
    VALUES (
        NEW.id,
        0,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
    );
    RETURN NEW;
END;
$$;

-- Trigger uruchamiający funkcję po utworzeniu użytkownika w auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_for_user();
```

**Opis:**
- Trigger automatycznie tworzy profil w `public.profiles` dla każdego nowego użytkownika w `auth.users`
- `SECURITY DEFINER` pozwala funkcji utworzyć profil mimo polityki INSERT blokującej bezpośrednie wstawianie
- Profil inicjalizowany z `ai_flashcards_used = 0` i `limit_reset_date` ustawionym na pierwszy dzień następnego miesiąca

### 5.2 Sprawdzanie i resetowanie limitu fiszek AI

```sql
-- Funkcja sprawdzająca i resetująca limit fiszek AI
CREATE OR REPLACE FUNCTION public.check_and_reset_ai_limit(p_user_id UUID)
RETURNS TABLE(remaining_limit INTEGER)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_used INTEGER;
    v_reset_date DATE;
    v_needs_reset BOOLEAN;
BEGIN
    -- Pobierz aktualne dane użytkownika
    SELECT ai_flashcards_used, limit_reset_date
    INTO v_current_used, v_reset_date
    FROM public.profiles
    WHERE id = p_user_id;

    -- Sprawdź czy potrzebny reset
    v_needs_reset := v_reset_date < CURRENT_DATE;

    -- Jeśli tak, zresetuj limit
    IF v_needs_reset THEN
        UPDATE public.profiles
        SET 
            ai_flashcards_used = 0,
            limit_reset_date = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE,
            updated_at = now()
        WHERE id = p_user_id;
        
        v_current_used := 0;
    END IF;

    -- Zwróć pozostały limit
    RETURN QUERY SELECT (100 - v_current_used)::INTEGER;
END;
$$;
```

**Opis:**
- Funkcja sprawdza czy `limit_reset_date` minęła
- Jeśli tak, resetuje `ai_flashcards_used` do 0 i ustawia nową datę resetu
- Zwraca pozostały limit fiszek AI (100 - aktualnie wykorzystane)
- Wywoływana przez aplikację przed każdą próbą generowania fiszek AI
- `SECURITY DEFINER` pozwala na aktualizację mimo RLS

### 5.3 Usuwanie konta użytkownika (RODO)

```sql
-- Funkcja usuwająca konto użytkownika wraz ze wszystkimi danymi
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Pobierz ID zalogowanego użytkownika
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Usuń użytkownika z auth.users
    -- Kaskadowe usuwanie zajmie się resztą (profile, flashcards, sessions, etc.)
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
```

**Opis:**
- Funkcja usuwa konto zalogowanego użytkownika
- Wykorzystuje `auth.uid()` dla bezpieczeństwa (tylko zalogowany użytkownik może usunąć swoje konto)
- Usunięcie z `auth.users` kaskadowo usuwa wszystkie powiązane dane z tabel publicznych
- Spełnia wymagania RODO (prawo do bycia zapomnianym)
- Wywoływana przez aplikację po potwierdzeniu użytkownika

### 5.4 Inkrementacja licznika fiszek AI

```sql
-- Funkcja inkrementująca licznik wykorzystanych fiszek AI
CREATE OR REPLACE FUNCTION public.increment_ai_flashcards_used(
    p_user_id UUID,
    p_count INTEGER DEFAULT 1
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_used INTEGER;
BEGIN
    -- Aktualizuj licznik
    UPDATE public.profiles
    SET 
        ai_flashcards_used = ai_flashcards_used + p_count,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING ai_flashcards_used INTO v_new_used;

    -- Zwróć nową wartość
    RETURN v_new_used;
END;
$$;
```

**Opis:**
- Funkcja inkrementuje licznik `ai_flashcards_used` o określoną liczbę
- Wywoływana po zaakceptowaniu fiszek wygenerowanych przez AI
- Zwraca nową wartość licznika
- `SECURITY DEFINER` pozwala na aktualizację mimo RLS
- Parametr `p_count` pozwala na dodanie wielu fiszek za jednym razem

---

## 6. Uwagi projektowe i decyzje

### 6.1 Typy kluczy głównych

- **UUID dla `profiles.id`**: Wymóg integracji z Supabase Auth (`auth.users.id` jest UUID)
- **BIGSERIAL dla pozostałych tabel**: Lepsza wydajność, mniejszy rozmiar, brak potrzeby publicznego ID

### 6.2 Strategia dat i czasów

- **DATE dla `next_review_date`**: Algorytm SM-2 operuje na dniach, nie godzinach
- **TIMESTAMPTZ dla wszystkich pozostałych**: Precyzyjne śledzenie czasu z obsługą stref czasowych
- **DEFAULT CURRENT_DATE dla nowych fiszek**: Nowe fiszki są dostępne od razu w sesji nauki

### 6.3 Denormalizacja

**Parametry SM-2 w `flashcards`:**
- Wartości `easiness_factor`, `repetitions`, `interval_days`, `next_review_date` przechowywane bezpośrednio w tabeli fiszek
- **Zalety**: Szybkie zapytania o fiszki do powtórki (bez JOIN), prosty update po powtórce
- **Wady**: Duplikacja danych (historia w `study_reviews` + aktualne w `flashcards`)
- **Uzasadnienie**: Krytyczna wydajność dla głównej funkcjonalności aplikacji

**Liczniki w `study_sessions`:**
- Agregaty `cards_easy`, `cards_medium`, `cards_hard` przechowywane bezpośrednio w sesji
- **Zalety**: Szybkie wyświetlanie podsumowania sesji bez agregacji
- **Wady**: Redundancja (można policzyć z `study_reviews`)
- **Uzasadnienie**: Częste odczyty, rzadkie zapisy, uproszczenie zapytań

### 6.4 Soft-delete vs Hard-delete

**Decyzja: Hard-delete**
- MVP nie wymaga odzyskiwania usuniętych danych
- Zgodność z RODO (prawo do bycia zapomnianym)
- Prostsze zapytania (bez `WHERE deleted_at IS NULL`)
- Mniejszy rozmiar bazy danych
- CASCADE zapewnia spójność przy usuwaniu powiązanych danych

### 6.5 Walidacja na poziomie bazy danych

**Limity znaków fiszek:**
- CHECK constraints wymuszają 1-100 dla `front` i 1-500 dla `back`
- Ostateczna ochrona przed błędami aplikacji
- Redundantna walidacja (aplikacja też waliduje, ale baza jest ostatnim bastionem)

**Zakres wartości SM-2:**
- Easiness factor: 1.30-2.50 (zgodnie ze specyfikacją SM-2)
- Difficulty rating: 1-3 (uproszczona skala dla MVP)
- Interwały i powtórki: >= 0 (logiczne minimum)

**Spójność danych:**
- Constraint `chk_flashcards_source_consistency` wymusza że fiszki AI mają `ai_generation_id`, a manualne mają NULL
- Constraint `chk_study_sessions_difficulty_sum` wymusza że suma ocen = liczba powtórzonych

### 6.6 Strategia indeksowania

**Composite indexes:**
- `(user_id, next_review_date)` - najbardziej krytyczny, dla zapytań o fiszki do powtórki
- `(user_id, created_at DESC)` - dla listowania fiszek użytkownika

**Uzasadnienie kolejności kolumn:**
- `user_id` jako pierwsza kolumna - zawsze filtrujemy po użytkowniku (RLS)
- Druga kolumna to warunek WHERE lub ORDER BY

**Covering indexes:**
- Nie implementowane w MVP - premature optimization
- Potencjalnie do dodania gdy wydajność będzie problemem

### 6.7 Row Level Security

**Podejście:**
- RLS włączone na wszystkich tabelach publicznych
- Osobne polityki dla każdej operacji (SELECT, INSERT, UPDATE, DELETE)
- Użycie `auth.uid()` dla identyfikacji zalogowanego użytkownika

**Bezpieczeństwo `study_reviews`:**
- Polityki sprawdzają własność fiszki przez EXISTS subquery
- Użytkownik nie może tworzyć/odczytywać powtórek dla cudzych fiszek
- Dodatkowe zabezpieczenie mimo że normalne flow aplikacji tego nie wymaga

**SECURITY DEFINER dla funkcji:**
- Funkcje triggerowe i utility działają z prawami właściciela, nie wywołującego
- Pozwala na operacje mimo RLS (np. tworzenie profilu, reset limitu)

### 6.8 Obsługa błędów generowania AI

**Decyzja: Odrzucone fiszki nie są zapisywane**
- Tabela `ai_generations` przechowuje tylko metadane sesji
- Pole `error_message` dla niepowodzeń generowania
- Liczniki `generated_count` vs `accepted_count` dla analityki akceptacji
- Oszczędność miejsca w bazie (odrzucone fiszki = 0 bajtów)

### 6.9 Timestamps

**Konwencja:**
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` - data utworzenia
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` - data ostatniej modyfikacji

**Brak automatycznego triggera dla `updated_at`:**
- Decyzja użytkownika: ręczna aktualizacja przez aplikację
- Uproszczenie schematu, mniej magii
- Aplikacja kontroluje kiedy `updated_at` jest aktualizowane

### 6.10 Wartości domyślne

**Algorytm SM-2:**
- `easiness_factor = 2.50` - wartość początkowa zgodnie z algorytmem
- `repetitions = 0` - nowa fiszka, zero powtórek
- `interval_days = 0` - interwał 0, dostępna natychmiast
- `next_review_date = CURRENT_DATE` - dostępna w sesji nauki od razu

**Limit AI:**
- `ai_flashcards_used = 0` - nowy użytkownik nie wykorzystał limitu
- `limit_reset_date = pierwszy dzień następnego miesiąca` - reset co miesiąc

### 6.11 Normalizacja

**Poziom normalizacji: 3NF (Third Normal Form)**
- Każda tabela ma klucz główny
- Brak częściowych zależności (wszystkie klucze są pojedynczą kolumną)
- Brak zależności przechodnich (z wyjątkami poniżej)

**Świadoma denormalizacja:**
- Parametry SM-2 w `flashcards` (zamiast osobnej tabeli `flashcard_sm2_state`)
- Liczniki trudności w `study_sessions` (zamiast agregacji z `study_reviews`)
- Uzasadnienie: Wydajność zapytań krytycznych dla MVP

### 6.12 Skalowalność

**Założenia MVP:**
- Setki do tysięcy użytkowników
- Dziesiątki do setek fiszek na użytkownika
- Kilka sesji nauki dziennie na użytkownika
- Łącznie: < 1M fiszek, < 10M powtórek

**Bottleneck'i:**
- Zapytania o fiszki do powtórki: O(n) gdzie n = liczba fiszek użytkownika
  - Rozwiązane przez indeks `idx_flashcards_user_next_review`
- Funkcja `check_and_reset_ai_limit`: Wywołana przy każdym sprawdzeniu limitu
  - Potencjalnie: cache po stronie aplikacji (np. Redis)
- Tabela `study_reviews`: Rośnie w nieskończoność
  - Potencjalnie: partycjonowanie po `reviewed_at` lub archiwizacja starych danych

**Przyszłe optymalizacje (post-MVP):**
- Partycjonowanie `study_reviews` po miesiącach
- Materialized views dla analityki (dashboardy, statystyki)
- Read replicas dla oddzielenia analityki od transakcji
- Connection pooling (PgBouncer)

### 6.13 Testowanie

**Seed data:**
- Skrypt inicjalizacyjny dla środowiska development
- Przykładowi użytkownicy z różną ilością fiszek
- Fiszki w różnych stanach SM-2 (nowe, zaplanowane na dziś, przyszłość)
- Sesje nauki w różnych stanach (ukończone, przerwane, w trakcie)

**Migracje:**
- Użycie Supabase CLI migrations
- Wersjonowanie schematu (kolejne pliki SQL z timestampem)
- Rollback plan dla każdej migracji

### 6.14 Monitoring i analityka

**Kluczowe zapytania do monitorowania:**
```sql
-- Współczynnik akceptacji fiszek AI
SELECT 
    AVG(accepted_count::DECIMAL / NULLIF(generated_count, 0)) * 100 AS acceptance_rate
FROM ai_generations
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Wykorzystanie AI vs manualne
SELECT 
    source,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM flashcards
GROUP BY source;

-- Ocena jakości AI
SELECT 
    CASE 
        WHEN ai_quality_rating = 1 THEN 'thumbs_up'
        WHEN ai_quality_rating = -1 THEN 'thumbs_down'
        ELSE 'no_rating'
    END AS rating,
    COUNT(*) AS count
FROM flashcards
WHERE source = 'ai' AND ai_quality_rating IS NOT NULL;

-- DAU (wymaga Supabase Auth logs)
-- Zaimplementowane po stronie aplikacji lub Supabase Analytics

-- Średnia liczba fiszek na użytkownika
SELECT AVG(flashcard_count) AS avg_flashcards_per_user
FROM (
    SELECT user_id, COUNT(*) AS flashcard_count
    FROM flashcards
    GROUP BY user_id
) subquery;

-- Częstotliwość sesji nauki (tygodniowo)
SELECT 
    user_id,
    COUNT(*) AS sessions_per_week
FROM study_sessions
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id;
```

### 6.15 Zgodność z RODO

**Prawo do bycia zapomnianym:**
- Funkcja `delete_user_account()` usuwa wszystkie dane użytkownika
- CASCADE delete propaguje usunięcie do wszystkich powiązanych tabel
- Hard-delete (nie soft-delete) zapewnia faktyczne usunięcie danych

**Minimalizacja danych:**
- Tylko niezbędne dane w `profiles` (brak zbędnych pól osobowych)
- Autentykacja przez Supabase Auth (nie przechowujemy haseł)
- Brak zbierania danych demograficznych w MVP

**Transparentność:**
- Pole `ai_quality_rating` jest opcjonalne (użytkownik decyduje czy ocenia)
- Przechowywanie tekstu źródłowego w `ai_generations` tylko dla analityki (można rozważyć usuwanie po czasie)

---

## 7. Podsumowanie

### 7.1 Liczba tabel: 5

1. `profiles` - dane użytkowników
2. `flashcards` - fiszki (AI + manualne)
3. `ai_generations` - sesje generowania AI
4. `study_sessions` - sesje nauki
5. `study_reviews` - historia powtórek

### 7.2 Klucze obce: 8

1. `profiles.id` → `auth.users.id`
2. `flashcards.user_id` → `profiles.id`
3. `flashcards.ai_generation_id` → `ai_generations.id`
4. `ai_generations.user_id` → `profiles.id`
5. `study_sessions.user_id` → `profiles.id`
6. `study_reviews.flashcard_id` → `flashcards.id`
7. `study_reviews.study_session_id` → `study_sessions.id`

### 7.3 Indeksy: 6

1. `idx_flashcards_user_next_review` (krytyczny)
2. `idx_flashcards_user_created`
3. `idx_study_sessions_user`
4. `idx_ai_generations_user`
5. `idx_study_reviews_flashcard_history`
6. `idx_study_reviews_session`

### 7.4 Polityki RLS: 25 (5 tabel × 4-5 operacji)

### 7.5 Funkcje: 4

1. `create_profile_for_user()` - automatyczne tworzenie profilu
2. `check_and_reset_ai_limit()` - sprawdzanie i reset limitu AI
3. `delete_user_account()` - usuwanie konta (RODO)
4. `increment_ai_flashcards_used()` - inkrementacja licznika AI

### 7.6 Triggery: 1

1. `on_auth_user_created` - tworzenie profilu po rejestracji

---

## 8. Kolejne kroki implementacji

1. **Utworzenie migracji inicjalizującej:**
   - Tabele + constraints
   - Indeksy
   - Funkcje
   - Triggery
   - Polityki RLS

2. **Utworzenie seed data dla development:**
   - Przykładowi użytkownicy
   - Fiszki w różnych stanach
   - Historie sesji

3. **Testy integralności danych:**
   - Sprawdzenie constraints
   - Sprawdzenie CASCADE delete
   - Sprawdzenie RLS policies

4. **Optymalizacja zapytań:**
   - EXPLAIN ANALYZE dla krytycznych zapytań
   - Dodanie brakujących indeksów jeśli potrzeba

5. **Monitoring:**
   - Konfiguracja logowania slow queries
   - Dashboard analityczny dla metryk sukcesu
   - Alerty na przekroczenie limitów wydajnościowych
