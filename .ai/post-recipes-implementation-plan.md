# API Endpoint Implementation Plan: POST /api/recipes

## 1. Przegląd punktu końcowego
Endpoint służy do ręcznego tworzenia przepisu (fallback/administracyjnie). W MVP używany głównie przez backend po wygenerowaniu przepisu. Zwraca nowo utworzony przepis w tym samym formacie jak inne odpowiedzi z zasobu `recipes`.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Struktura URL: `/api/recipes`
- Parametry:
  - Wymagane: brak w query/path
  - Opcjonalne: brak
- Request Body (JSON):
  - `title` (string, wymagane)
  - `ingredients` (string, wymagane)
  - `steps` (string, wymagane)

## 3. Wykorzystywane typy
- DTO:
  - `RecipeDTO` (odpowiedź)
- Command modele:
  - `CreateRecipeCommand` (wejście)

## 4. Szczegóły odpowiedzi
- Sukces:
  - `201 Created`
  - Body: obiekt przepisu w formacie `RecipeDTO`
- Błędy:
  - `400 Bad Request` – niepoprawne lub brakujące pola
  - `401 Unauthorized` – brak sesji użytkownika
  - `500 Internal Server Error` – nieoczekiwany błąd serwera

## 5. Przepływ danych
1. Handler w `src/pages/api/recipes` odbiera żądanie `POST`.
2. Z `context.locals` pobierany jest klient Supabase oraz sesja użytkownika.
3. Walidacja `CreateRecipeCommand` (Zod).
4. Wywołanie serwisu `recipes` w `src/lib/services`:
   - serwis tworzy rekord w tabeli `recipes` (`user_id`, `title`, `ingredients`, `steps`).
5. Zwrócenie utworzonego rekordu jako `RecipeDTO`.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: wymagany zalogowany użytkownik (401, gdy brak sesji).
- Autoryzacja: oparta o RLS (polityka insert tylko dla `user_id = auth.uid()`).
- Walidacja wejścia: Zod + guard clauses (wczesne odrzucenie błędnych danych).
- Minimalizacja wycieku danych: zwracane tylko pola z `RecipeDTO`.

## 7. Obsługa błędów
- `400`:
  - Brak pól `title`, `ingredients`, `steps`
  - Puste stringi lub nieprawidłowy typ
- `401`:
  - Brak aktywnej sesji w `context.locals`
- `500`:
  - Błąd Supabase przy insercie
  - Nieoczekiwany wyjątek w serwisie/handlerze
- Logowanie:
  - Jeśli istnieje tabela błędów, zapisuj: `user_id`, endpoint, payload (bez wrażliwych danych), error message.
  - W przeciwnym razie: `console.error` z kontekstem (endpoint, user_id, error).

## 8. Wydajność
- Operacja pojedynczego insertu; brak istotnych wąskich gardeł.
- W przyszłości: można dodać batch insert lub rate limiting, jeśli endpoint będzie używany masowo przez backend.

## 9. Kroki implementacji
1. Utwórz/rozszerz endpoint `POST` w `src/pages/api/recipes` z `export const prerender = false`.
2. Dodaj walidację Zod dla `CreateRecipeCommand`.
3. Pobierz użytkownika z `context.locals` i zastosuj guard clauses:
   - brak sesji → `401`
   - błędne dane → `400`
4. Utwórz/rozszerz serwis `src/lib/services/recipes`:
   - funkcja `createRecipe` przyjmująca `userId` i `CreateRecipeCommand`
   - wykonaj insert do `recipes`
   - zwróć `RecipeDTO`
5. Obsłuż błędy Supabase:
   - mapuj na `500` z przyjaznym komunikatem
   - loguj błąd zgodnie z polityką projektu
6. Zwróć `201 Created` z obiektem `RecipeDTO`.
7. Dodaj testy (jeśli repozytorium ma harness):
   - brak sesji → 401
   - brak pola → 400
   - poprawne dane → 201 i zgodny payload
