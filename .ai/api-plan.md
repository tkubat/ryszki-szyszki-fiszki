# REST API Plan

## 1. Zasoby
- `Recipe` → tabela `recipes`
- `AuthSession` → sesja użytkownika w Supabase Auth (brak tabeli aplikacyjnej; zarządzane przez Supabase)
- `RecipeGeneration` → logika biznesowa generowania przepisu (brak tabeli; operacja)

## 2. Punkty końcowe

### Recipes
- **GET** `/api/recipes`
  - Opis: Lista przepisów zalogowanego użytkownika, posortowana malejąco po `created_at`.
  - Query params:
    - `limit` (opcjonalne, int, domyślnie 20, max 100)
    - `cursor` (opcjonalne, ISO8601; pobiera rekordy starsze niż `cursor`)
    - `liked` (opcjonalne, boolean; filtruje po polubieniu)
  - Response JSON:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "title": "string",
          "ingredients": "string",
          "steps": "string",
          "liked": false,
          "created_at": "2026-02-01T12:00:00Z"
        }
      ],
      "next_cursor": "2026-01-31T09:00:00Z"
    }
    ```
  - Success: `200 OK`
  - Errors:
    - `401 Unauthorized` – brak sesji
    - `400 Bad Request` – niepoprawne query params

- **GET** `/api/recipes/{id}`
  - Opis: Pobiera pojedynczy przepis należący do użytkownika.
  - Response JSON:
    ```json
    {
      "id": "uuid",
      "title": "string",
      "ingredients": "string",
      "steps": "string",
      "liked": false,
      "created_at": "2026-02-01T12:00:00Z"
    }
    ```
  - Success: `200 OK`
  - Errors:
    - `401 Unauthorized`
    - `404 Not Found` – brak dostępu lub nie istnieje

- **POST** `/api/recipes`
  - Opis: Tworzy przepis ręcznie (fallback/administracyjnie). W MVP może być używane tylko przez backend po generowaniu.
  - Request JSON:
    ```json
    {
      "title": "string",
      "ingredients": "string",
      "steps": "string"
    }
    ```
  - Response JSON: jak w `GET /api/recipes/{id}`
  - Success: `201 Created`
  - Errors:
    - `401 Unauthorized`
    - `400 Bad Request` – brak pól lub niepoprawny format

- **PATCH** `/api/recipes/{id}`
  - Opis: Aktualizuje `liked` (toggle polubienia).
  - Request JSON:
    ```json
    {
      "liked": true
    }
    ```
  - Response JSON: jak w `GET /api/recipes/{id}`
  - Success: `200 OK`
  - Errors:
    - `401 Unauthorized`
    - `400 Bad Request`
    - `404 Not Found`

- **DELETE** `/api/recipes/{id}`
  - Opis: Usuwa przepis użytkownika (opcjonalne; poza zakresem UI MVP, ale zgodne z RLS).
  - Success: `204 No Content`
  - Errors:
    - `401 Unauthorized`
    - `404 Not Found`

### Recipe Generation (AI)
- **POST** `/api/recipes/generate`
  - Opis: Generuje przepis z listy składników, dodaje “podstawy kuchenne”, zapisuje wynik i zwraca zapisany przepis.
  - Request JSON:
    ```json
    {
      "ingredients": "string",
      "include_basics": true
    }
    ```
  - Response JSON:
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
  - Success: `201 Created`
  - Errors:
    - `401 Unauthorized`
    - `400 Bad Request` – mniej niż 3 składniki lub zły format
    - `408 Request Timeout` – przekroczono 60 s
    - `502 Bad Gateway` – błąd dostawcy AI

### Auth (Supabase)
- **POST** `/api/auth/signup`
  - Opis: Rejestracja użytkownika w Supabase Auth.
  - Request JSON:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
  - Response JSON:
    ```json
    {
      "user": { "id": "uuid", "email": "string" },
      "session": { "access_token": "string", "refresh_token": "string" }
    }
    ```
  - Success: `201 Created`
  - Errors:
    - `400 Bad Request`
    - `409 Conflict` – email już istnieje

- **POST** `/api/auth/login`
  - Opis: Logowanie użytkownika.
  - Request JSON:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
  - Response JSON: jak `signup`
  - Success: `200 OK`
  - Errors:
    - `400 Bad Request`
    - `401 Unauthorized` – błędne dane

- **POST** `/api/auth/logout`
  - Opis: Wylogowanie i unieważnienie sesji.
  - Success: `204 No Content`
  - Errors:
    - `401 Unauthorized`

## 3. Uwierzytelnianie i autoryzacja
- Mechanizm: Supabase Auth (JWT w nagłówku `Authorization: Bearer <token>`).
- Autoryzacja: RLS na `recipes` wymusza dostęp tylko do własnych rekordów (`user_id = auth.uid()`).
- Endpoints `recipes` i `recipes/generate` wymagają aktywnej sesji.

## 4. Walidacja i logika biznesowa
- `recipes.title`: wymagane, niepuste.
- `recipes.ingredients`: wymagane; min. 3 składniki po stronie API.
- `recipes.steps`: wymagane; wielolinijkowy tekst.
- `recipes.liked`: boolean, domyślnie `false`.
- `recipes.user_id`: ustawiane z sesji, nigdy z klienta.
- Logika biznesowa:
  - Generowanie przepisu: łączy składniki użytkownika z “podstawami kuchennymi”, wywołuje AI, zapisuje rekord i zwraca zapis.
  - Limit czasu generowania: 60 s; timeout skutkuje `408`.
  - Polubienie: `PATCH /api/recipes/{id}` aktualizuje `liked`.
  - Lista “Moje przepisy”: `GET /api/recipes` z sortowaniem po `created_at DESC` i opcjonalnym filtrem `liked`.
