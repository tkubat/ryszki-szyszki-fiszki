# API Endpoint Implementation Plan: GET /api/recipes

## 1. Przegląd punktu końcowego
Endpoint zwraca listę przepisów zalogowanego użytkownika, posortowaną malejąco po `created_at`, z opcjonalnym filtrem `liked` oraz paginacją opartą o kursor czasu.

## 2. Szczegóły żądania
- Metoda HTTP: `GET`
- Struktura URL: `/api/recipes`
- Parametry:
  - Wymagane: brak
  - Opcjonalne:
    - `limit` (int, domyślnie 20, max 100)
    - `cursor` (ISO8601, zwraca rekordy starsze niż `cursor`)
    - `liked` (boolean, filtruje po polubieniu)
- Request Body: brak
- Uwierzytelnianie: wymagany aktywny token Supabase (`Authorization: Bearer <token>`)

## 3. Wykorzystywane typy
- `RecipeDTO`
- `RecipesListResponseDTO`
- `GetRecipesQuery`
- Po stronie serwisu: `RecipeEntity` (do mapowania rekordów DB na DTO)

## 4. Szczegóły odpowiedzi
- Sukces: `200 OK`
  - Body:
    - `data`: lista `RecipeDTO`
    - `next_cursor`: `RecipeCreatedAt | null` (najstarsze `created_at` z aktualnej strony lub `null` gdy brak kolejnej strony)
- Błędy:
  - `400 Bad Request` – błędne query params (np. `limit` poza zakresem, zły format `cursor`, `liked` nie-boolean)
  - `401 Unauthorized` – brak aktywnej sesji
  - `500 Internal Server Error` – nieoczekiwany błąd po stronie serwera

## 5. Przepływ danych
1. Middleware lub handler sprawdza sesję Supabase z `context.locals`.
2. Handler waliduje query params przez Zod i mapuje je na `GetRecipesQuery`.
3. Handler deleguje pobranie danych do serwisu w `src/lib/services/recipes.service.ts`.
4. Serwis buduje zapytanie do Supabase:
   - `from("recipes")`
   - `select("id,title,ingredients,steps,liked,created_at")`
   - `eq("user_id", auth.uid())` (RLS dodatkowo wymusi własne rekordy)
   - `order("created_at", { ascending: false })`
   - `lt("created_at", cursor)` jeśli `cursor` podany
   - `eq("liked", liked)` jeśli `liked` podane
   - `limit(limit)`
5. Serwis mapuje wynik do `RecipeDTO[]` i wylicza `next_cursor`.
6. Handler zwraca `RecipesListResponseDTO`.

## 6. Względy bezpieczeństwa
- Wymuszenie autoryzacji (Supabase Auth). Brak sesji -> `401`.
- RLS na tabeli `recipes` zapewnia dostęp tylko do własnych rekordów.
- Parametry wejściowe walidowane Zod, bezpośrednio przed użyciem w zapytaniach.
- Brak możliwości ustawiania `user_id` z klienta (tylko przez sesję).

## 7. Obsługa błędów
- `400 Bad Request`:
  - `limit` poza zakresem 1–100 lub nieint.
  - `cursor` nie jest poprawnym ISO8601.
  - `liked` nie jest booleanem (`true`/`false`).
- `401 Unauthorized`:
  - Brak tokenu lub nieprawidłowa sesja.
- `500 Internal Server Error`:
  - Błąd Supabase (np. połączenie lub nieoczekiwany błąd zapytania).

## 8. Wydajność
- Indeks `(user_id, created_at DESC)` zalecany dla paginacji i sortowania.
- Ograniczenie `limit` do max 100.
- Selekcja tylko wymaganych kolumn w `select`.

## 9. Kroki implementacji
1. Utworzyć schemat Zod dla query params (np. `limit`, `cursor`, `liked`) w pliku endpointa lub w `src/lib/validation/recipes.ts`.
2. Utworzyć lub zaktualizować serwis w `src/lib/services/recipes.service.ts` z metodą `getRecipes(query, userId)`.
3. Utworzyć endpoint Astro w `src/pages/api/recipes.ts`:
   - `export const prerender = false`
   - `export async function GET({ locals, request })`
4. W handlerze:
   - pobrać sesję z `locals.supabase`
   - zwrócić `401`, jeśli brak sesji
   - parsować `URLSearchParams` i walidować Zod
   - wywołać serwis
   - zwrócić `200` z `RecipesListResponseDTO`
5. Dodać testy integracyjne (jeśli repo ma setup):
   - walidacja parametrów
   - paginacja `cursor`
   - filtr `liked`
   - brak sesji -> `401`
6. Sprawdzić lint i poprawić ewentualne błędy.
