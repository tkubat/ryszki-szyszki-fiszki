# API Endpoint Implementation Plan: PATCH /api/recipes/{id}

## 1. Przegląd punktu końcowego
Endpoint aktualizuje pole `liked` wybranego przepisu należącego do zalogowanego użytkownika. Operuje na zasobie `recipes` i zwraca zaktualizowany obiekt przepisu.

## 2. Szczegóły żądania
- Metoda HTTP: `PATCH`
- Struktura URL: `/api/recipes/{id}`
- Parametry:
  - Wymagane:
    - `id` (path) — identyfikator przepisu (`RecipeId`)
  - Opcjonalne: brak
- Request Body:
  - JSON:
    ```json
    {
      "liked": true
    }
    ```

## 3. Wykorzystywane typy
- `RecipeIdParams` — parametry ścieżki (`id`)
- `UpdateRecipeLikedCommand` — payload aktualizacji (`liked`)
- `RecipeDTO` — odpowiedź
- (pośrednio) `RecipeEntity`, `RecipeId`

## 4. Szczegóły odpowiedzi
- Success:
  - `200 OK`
  - Body: `RecipeDTO`
- Errors:
  - `400 Bad Request` — niepoprawny `id` lub brak/wadliwy `liked`
  - `401 Unauthorized` — brak sesji użytkownika
  - `404 Not Found` — przepis nie istnieje lub nie należy do użytkownika
  - `500 Internal Server Error` — błąd serwera / Supabase

## 5. Przepływ danych
1. Warstwa API (`src/pages/api/recipes/[id].ts` lub nowy endpoint zgodny ze strukturą) odbiera `PATCH`.
2. Middleware / handler pobiera `supabase` z `context.locals`.
3. Walidacja:
   - `id` z parametru ścieżki (UUID).
   - Body z `liked` jako boolean.
4. Pobranie `user_id` z sesji Supabase.
5. Serwis `src/lib/services/recipes.service.ts`:
   - Metoda `updateRecipeLiked(userId, recipeId, liked)` wykonuje `update` na tabeli `recipes` z filtrem `id` i `user_id`.
   - Zwraca zaktualizowany rekord jako `RecipeDTO`.
6. Handler mapuje wynik do odpowiedzi HTTP.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: wymagane. Odrzucenie przy braku sesji (`401`).
- Autoryzacja: egzekwowana przez RLS (`recipes.user_id = auth.uid()`) i dodatkowy filtr `user_id` w zapytaniu.
- Walidacja wejścia: Zod w handlerze (UUID + boolean).
- Brak bezpośredniego importu klienta Supabase — używać `context.locals.supabase`.
- Ograniczenie ekspozycji danych: zwracać tylko pola z `RecipeDTO`.

## 7. Obsługa błędów
- `400`:
  - Niepoprawny `id` (nie-UUID)
  - Brak pola `liked` lub `liked` nie-boolean
- `401`: brak sesji użytkownika
- `404`: brak rekordu po aktualizacji (nie znaleziono lub brak dostępu)
- `500`: błąd Supabase / nieoczekiwany wyjątek
- Logowanie błędów:
  - Jeśli brak tabeli błędów w DB, logować do `console.error` z kontekstem (endpoint, userId, recipeId).

## 8. Wydajność
- Operacja pojedynczego `update` z selekcją zwrotu danych; koszt stały.
- RLS może dodać minimalny narzut; akceptowalne dla MVP.
- Unikać dodatkowych zapytań (brak osobnego `select` przed `update`).

## 9. Kroki implementacji
1. Utworzyć/rozszerzyć endpoint `PATCH` w `src/pages/api/recipes/[id].ts` (lub odpowiednim pliku Astro).
2. Dodać Zod schema:
   - `paramsSchema`: `id` jako UUID
   - `bodySchema`: `{ liked: z.boolean() }`
3. Pobrać `supabase` z `context.locals` i zweryfikować sesję użytkownika.
4. Dodać metodę w `src/lib/services/recipes.service.ts`:
   - `updateRecipeLiked(userId, recipeId, liked)`
   - Wykonać `update` + `select` i mapowanie do `RecipeDTO`.
5. Obsłużyć przypadek braku rekordów (`404`).
6. Zmapować odpowiedzi na kody statusu (`200/400/401/404/500`).
7. Dodać testy (jeśli istnieje infrastruktura):
   - Walidacja wejścia
   - `401` bez sesji
   - `404` dla obcego/nieistniejącego `id`
   - Pomyślna aktualizacja `liked`
