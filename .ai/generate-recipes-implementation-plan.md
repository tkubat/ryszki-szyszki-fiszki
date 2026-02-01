# API Endpoint Implementation Plan: POST /api/recipes/generate

## 1. Przegląd punktu końcowego
Endpoint generuje przepis na podstawie listy składników, opcjonalnie dodaje “podstawy kuchenne”, zapisuje przepis w bazie i zwraca zapisany rekord wraz z czasem generacji.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Struktura URL: `/api/recipes/generate`
- Parametry:
  - Wymagane: brak parametrów w URL
  - Opcjonalne: brak parametrów w URL
- Request Body:
  - `ingredients` (string, wymagane) — lista składników jako tekst
  - `include_basics` (boolean, wymagane) — czy dodać “podstawy kuchenne”

## 3. Wykorzystywane typy
- `GenerateRecipeCommand` — payload wejściowy
- `GenerateRecipeResponseDTO` — odpowiedź
- `RecipeDTO`, `RecipeEntity`, `UserId` — mapowanie na encję i DTO

## 4. Szczegóły odpowiedzi
- Sukces `201 Created`:
  ```json
  {
    "recipe": {
      "id": "uuid",
      "title": "string",
      "ingredients": "string",
      "steps": "string",
      "liked": false,
      "created_at": "2026-02-01T12:00:00Z"
    },
    "generation_time_ms": 15342
  }
  ```
- Błędy:
  - `400 Bad Request` — nieprawidłowe dane wejściowe
  - `401 Unauthorized` — brak sesji
  - `500 Internal Server Error` — błąd serwera lub usług zewnętrznych

## 5. Przepływ danych
1. Router Astro `POST` odbiera żądanie.
2. Walidacja `GenerateRecipeCommand` (Zod).
3. Pobranie użytkownika z `context.locals.supabase` (wymagana sesja).
4. Wywołanie serwisu generowania przepisu (Openrouter).
5. Normalizacja i przygotowanie danych do zapisu (w tym `user_id`, `liked=false`).
6. Zapis do tabeli `recipes`.
7. Mapowanie do `RecipeDTO`, dodanie `generation_time_ms`.
8. Zwrot `201 Created`.

## 6. Względy bezpieczeństwa
- Uwierzytelnienie: wymagane aktywne `auth` (Supabase), zwrot `401` w razie braku sesji.
- Autoryzacja: zapis tylko z `user_id = auth.uid()`, polegać na RLS.
- Walidacja wejścia: Zod, brak zaufania do treści `ingredients`.
- Ochrona przed nadużyciami: limit rozmiaru inputu i minimalna liczba składników; opcjonalnie rate limiting per user.
- Brak wrażliwych danych w logach.

## 7. Obsługa błędów
- `400`:
  - `ingredients` pusty, zbyt krótki lub nie spełnia reguł formatu.
  - `include_basics` nie jest booleanem.
- `401`:
  - brak sesji w `context.locals.supabase`.
- `500`:
  - błąd Openrouter (timeout, 5xx).
  - błąd zapisu do Supabase.
- Logowanie:
  - Jeżeli istnieje tabela błędów, zapisywać podstawowe informacje (request id, user id, error code).
  - W przeciwnym razie log do server logs z korelacją.

## 8. Wydajność
- Utrzymuj timeout dla wywołania AI i krótkie retry (1 raz).
- Buforowanie nie ma sensu dla dynamicznej generacji, ale warto logować metryki czasu.
- Ogranicz rozmiar `ingredients` (np. 1–2 KB).

## 9. Kroki implementacji
1. Dodaj/upewnij się, że istnieje schema Zod dla `GenerateRecipeCommand` w `src/lib/services` (lub lokalnie w route) z regułami:
   - `ingredients`: string, trim, min długość, opcjonalnie min liczba składników po split (np. przecinki).
   - `include_basics`: boolean.
2. Utwórz service w `src/lib/services/recipes.generate.ts`:
   - Funkcja `generateRecipe(command, userId)` zwraca `{ recipe, generation_time_ms }`.
   - Wewnątrz: wywołanie Openrouter + przygotowanie danych do zapisu.
3. Zaimplementuj endpoint `src/pages/api/recipes/generate.ts`:
   - `export const prerender = false`.
   - `export async function POST({ request, locals })`.
   - Guard clauses: brak sesji -> `401`, brak/invalid body -> `400`.
4. Zapisz przepis do `recipes` przez `locals.supabase`:
   - `user_id` z sesji, `liked=false`.
   - Zwróć zapisany rekord jako `RecipeDTO`.
5. Zwróć `201` i payload `GenerateRecipeResponseDTO`.
6. Dodaj obsługę błędów i logowanie:
   - Mapuj błędy walidacji na `400`.
   - Openrouter/Supabase -> `500`.
7. Dodaj testy (jeśli repo ma testy):
   - Walidacja inputu, brak auth, poprawna odpowiedź.
