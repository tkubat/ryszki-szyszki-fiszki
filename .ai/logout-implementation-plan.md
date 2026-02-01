# API Endpoint Implementation Plan: POST /api/auth/logout

## 1. Przegląd punktu końcowego
Endpoint służy do wylogowania użytkownika i unieważnienia sesji Supabase. Wymaga aktywnej sesji użytkownika; po poprawnym wykonaniu usuwa/invaliduje tokeny sesji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/api/auth/logout`
- Parametry:
  - Wymagane: brak (sesja identyfikowana na podstawie tokenów z cookies/Authorization)
  - Opcjonalne: brak
- Request Body: brak
- Nagłówki:
  - `Authorization: Bearer <access_token>` jeśli brak sesji w cookies

## 3. Wykorzystywane typy
- Brak dedykowanych DTO/Command w `src/types.ts` dla logoutu.
- Wewnętrznie: Supabase `signOut()` zwraca obiekt z ewentualnym błędem (bez danych domenowych).

## 3. Szczegóły odpowiedzi
- Success: `204 No Content` (bez body)
- Errors:
  - `401 Unauthorized` gdy brak ważnej sesji
  - `500 Internal Server Error` gdy błąd Supabase/serwera

## 4. Przepływ danych
1. Middleware lub endpoint pobiera Supabase client z `context.locals`.
2. Walidacja: sprawdzenie istnienia aktywnej sesji (np. `supabase.auth.getSession()`).
3. Jeśli brak sesji -> 401.
4. Wywołanie `supabase.auth.signOut()` w celu unieważnienia sesji.
5. Sukces -> zwrot `204 No Content`.

## 5. Względy bezpieczeństwa
- Wymagaj autoryzacji: sprawdzenie sesji przed wylogowaniem.
- Nie ujawniaj szczegółów błędów w odpowiedzi; loguj po stronie serwera.
- Korzystaj z `Astro.cookies` do odczytu/zapisu tokenów, jeśli sesja oparta o cookies.
- Nie akceptuj danych w body — minimalny zakres wejścia.

## 6. Obsługa błędów
- `401 Unauthorized`: brak/nieprawidłowa sesja.
- `500 Internal Server Error`: błąd Supabase lub nieoczekiwany wyjątek.
- Logowanie błędów: `console.error` z kontekstem request id/użytkownika (jeśli dostępne).
- Brak tabeli błędów w specyfikacji — pomijamy zapis do DB.

## 7. Wydajność
- Operacja O(1), jedno wywołanie Supabase.
- Brak ryzyka dużych obciążeń; nie wymaga cache.

## 8. Kroki implementacji
1. Utwórz plik endpointu `src/pages/api/auth/logout.ts`.
2. Dodaj `export const prerender = false`.
3. Zaimplementuj handler `export async function POST({ locals, cookies, request })`.
4. Pobierz Supabase client z `locals.supabase`.
5. Sprawdź sesję:
   - `const { data: { session } } = await supabase.auth.getSession();`
   - jeśli brak `session`, zwróć `401`.
6. Wywołaj `const { error } = await supabase.auth.signOut();`
7. Jeśli `error`, zaloguj i zwróć `500`.
8. Wyczyść cookies sesji (jeśli używane) przez `Astro.cookies.delete(...)`.
9. Zwróć `204 No Content`.
10. Dodaj testy (jeśli istnieje infrastruktura):
    - brak sesji -> 401
    - poprawna sesja -> 204
    - błąd Supabase -> 500
