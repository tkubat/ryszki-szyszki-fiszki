# API Endpoint Implementation Plan: POST /api/auth/signup

## 1. Przegląd punktu końcowego
Endpoint służy do rejestracji użytkownika w Supabase Auth. Przyjmuje adres e-mail i hasło, tworzy konto w Supabase i zwraca dane użytkownika oraz tokeny sesji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/api/auth/signup`
- Parametry:
  - Wymagane: `email`, `password`
  - Opcjonalne: brak
- Request Body (JSON):
  - `email`: string
  - `password`: string

## 3. Wykorzystywane typy
- `SignupCommand` (request body)
- `AuthUserDTO`
- `AuthSessionDTO`
- `AuthResponseDTO`

## 4. Szczegóły odpowiedzi
- Success `201 Created`:
  - Body:
    - `user`: `{ id: "uuid", email: "string" }`
    - `session`: `{ access_token: "string", refresh_token: "string" }`
- Errors:
  - `400 Bad Request` – niepoprawne dane wejściowe
  - `409 Conflict` – email już istnieje
  - `500 Internal Server Error` – błąd po stronie serwera

## 5. Przepływ danych
1. Handler API odbiera JSON i waliduje dane wejściowe.
2. Warstwa service wywołuje `supabase.auth.signUp`.
3. Supabase tworzy użytkownika oraz sesję.
4. Handler mapuje odpowiedź do `AuthResponseDTO` i zwraca `201 Created`.

## 6. Względy bezpieczeństwa
- Walidacja wejścia z użyciem Zod (format email, minimalna długość hasła).
- Brak potrzeby autoryzacji (publiczny endpoint), ale rate limiting i monitoring.
- Nie logować hasła; w logach maskować dane wrażliwe.
- Używać `supabase` z `context.locals` zgodnie z regułami backendu.
- Zabezpieczenie przed enumeracją użytkowników: spójne komunikaty błędów.

## 7. Obsługa błędów
- `400`: brakujące/nieprawidłowe pola (Zod).
- `409`: Supabase zwraca informację o istniejącym emailu.
- `500`: nieoczekiwane błędy (np. brak połączenia z Supabase).
- Mapować błędy Supabase do kodów HTTP i zwracać przyjazne komunikaty.

## 8. Wydajność
- Operacja zależna od Supabase Auth; zwykle lekka.
- Unikać dodatkowych zapytań do DB.
- Rozważyć globalny limiter (np. middleware) dla ochrony przed nadużyciami.

## 9. Kroki implementacji
1. Utworzyć endpoint `src/pages/api/auth/signup.ts` z `export const prerender = false`.
2. Zdefiniować Zod schema dla `SignupCommand`.
3. Dodać/wyodrębnić service w `src/lib/services/auth.service.ts`:
   - funkcja `signup(command, supabase)` zwracająca `AuthResponseDTO`.
4. W handlerze:
   - sparsować JSON,
   - zwalidować z Zod,
   - użyć `context.locals.supabase`,
   - wywołać service i zwrócić `201`.
5. Obsłużyć błędy Supabase:
   - mapowanie istniejącego emaila na `409`,
   - błędy walidacji na `400`,
   - pozostałe na `500`.
6. Dodać testy API (jeśli repo ma testy) dla: success, 400, 409.
7. Zweryfikować linter i formatowanie.
