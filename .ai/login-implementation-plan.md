# API Endpoint Implementation Plan: POST /api/auth/login

## 1. Przegląd punktu końcowego
Endpoint służy do logowania użytkownika przez Supabase Auth. Przyjmuje email i hasło, a w odpowiedzi zwraca obiekt użytkownika oraz tokeny sesji zgodne z `AuthResponseDTO`.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Struktura URL: `/api/auth/login`
- Parametry:
  - Wymagane: brak parametrów w URL
  - Opcjonalne: brak
- Request Body:
  - `email: string`
  - `password: string`

## 3. Wykorzystywane typy
- `LoginCommand` – payload wejściowy (`email`, `password`)
- `AuthResponseDTO` – odpowiedź sukcesu (`user`, `session`)
- `AuthUserDTO`, `AuthSessionDTO` – składowe odpowiedzi

## 4. Szczegóły odpowiedzi
- `200 OK` – poprawne logowanie
  - Body: `AuthResponseDTO`
- `400 Bad Request` – nieprawidłowe dane wejściowe (np. brak email/hasła, zły format)
- `401 Unauthorized` – błędne dane logowania
- `500 Internal Server Error` – błąd po stronie serwera

## 5. Przepływ danych
1. Klient wysyła JSON z `email` i `password`.
2. Endpoint waliduje payload Zod (format email, długość hasła).
3. Z endpointu używany jest klient Supabase z `context.locals`.
4. Wywołanie `supabase.auth.signInWithPassword`.
5. Mapowanie danych Supabase do `AuthResponseDTO` i zwrot 200.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie realizowane przez Supabase Auth.
- Zwracaj ogólny komunikat przy `401`, bez ujawniania czy email istnieje.
- Ograniczenie liczby prób (rate limiting) na poziomie middleware lub reverse proxy.
- Walidacja danych wejściowych Zod zapobiega błędom i atakom na payload.

## 7. Obsługa błędów
- `400` – brak pól, niepoprawny format email, zbyt krótkie hasło.
- `401` – `signInWithPassword` zwraca błąd autoryzacji.
- `500` – inne błędy (np. problem z SDK, brak konfiguracji).
- Brak dedykowanej tabeli błędów – logowanie do standardowego loggera (np. `console.error`) z identyfikatorem żądania, bez wrażliwych danych.

## 8. Rozważania dotyczące wydajności
- Operacja lekka – jedno wywołanie Supabase.
- Cache nie ma zastosowania (operacja mutująca sesję).
- Ewentualne opóźnienia wynikają z sieci do Supabase – dodać krótki timeout i obsługę błędów.

## 9. Etapy wdrożenia
1. Utworzyć plik endpointu `src/pages/api/auth/login.ts`.
2. Dodać `export const prerender = false`.
3. Zdefiniować schemat Zod dla `LoginCommand`:
   - `email` jako `z.string().email()`
   - `password` jako `z.string().min(8)` (dopasować do wymagań produktu, jeśli inne).
4. Sparsować `request.json()` i zwalidować `safeParse`.
5. Pobrać `supabase` z `context.locals` zgodnie z zasadami.
6. Wywołać `supabase.auth.signInWithPassword`.
7. Mapować wynik do `AuthResponseDTO`.
8. Zwrócić:
   - `200` z body przy sukcesie
   - `401` przy błędnych danych logowania
   - `400` przy błędnej walidacji
   - `500` przy pozostałych błędach
9. Dodać testy lub ręczne sprawdzenie:
   - poprawne dane → 200
   - błędne hasło → 401
   - brak pól → 400
