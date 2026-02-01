# Ryszki Szyszki Fiszki

Prosty webowy generator przepisów z listy składników. Użytkownik wpisuje min. 3 składniki, opcjonalnie dodaje „podstawy kuchenne”, dostaje jeden przepis od AI, a wynik zapisuje się na jego koncie i może zostać polubiony.

## Zakres MVP

- Generowanie 1 przepisu w czasie do 60 s
- Automatyczny zapis przepisu i lista „Moje przepisy” (sort: `created_at DESC`)
- Polubienie przepisu (toggle)
- Rejestracja i logowanie (Supabase Auth)

Poza MVP: edycja/udział/filtry diet, reset hasła, mobile app.

## API (skrót)

- `GET /api/recipes` — lista użytkownika, opcjonalnie `limit`, `cursor`, `liked`
- `POST /api/recipes` — zapis przepisu (manual/admin)
- `PATCH /api/recipes/{id}` — update `liked`
- `POST /api/recipes/generate` — generowanie + zapis
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`

Pełny opis: `.ai/api-plan.md`.

## Baza danych

- Tabela `recipes` powiązana z `auth.users`
- RLS: dostęp tylko do własnych rekordów
- Pola: `title`, `ingredients`, `steps`, `liked`, `created_at`

Szczegóły: `.ai/db-plan.md`.

## Tech Stack

- Astro 5 + React 19 + TypeScript 5
- Tailwind 4 + Shadcn/ui
- Supabase (Postgres + Auth)
- Openrouter.ai (modele AI)
- Testy jednostkowe: Vitest
- Testy E2E: Playwright

Szczegóły: `.ai/tech-stack.md`.

## Konfiguracja środowiska

Utwórz lokalny plik `.env` w katalogu głównym i ustaw zmienne:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (opcjonalnie, domyślnie `openai/gpt-3.5-turbo`)
