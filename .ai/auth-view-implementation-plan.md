## Plan implementacji widoku Auth (Logowanie / Rejestracja)

## 1. Przegląd
Widok **Auth** umożliwia użytkownikowi **rejestrację** i **logowanie** (Supabase Auth) w jednym ekranie z zakładkami. Po sukcesie zapisuje tokeny sesji po stronie klienta i przekierowuje do głównego widoku aplikacji, odblokowując funkcje MVP (generowanie i lista “Moje przepisy”).

## 2. Routing widoku
- **Główna ścieżka**: `/auth`
- **Alias (opcjonalnie)**: `/login` → redirect do `/auth` (wymóg UX z `.ai/ui-plan.md`, ale decyzja opcjonalna)
- **Wymagania routingu**:
  - Widok jest publiczny (dostępny bez sesji).
  - Jeśli użytkownik ma aktywną sesję w kliencie (np. zapisany `access_token`), widok może automatycznie przekierować na `/` (client-side guard).

## 3. Struktura komponentów
Proponowane pliki (przykładowe nazwy; zgodne ze strukturą projektu):
- `src/pages/auth.astro` (route)
- `src/pages/login.astro` (opcjonalny alias/redirect)
- `src/components/auth/AuthView.tsx` (React, interaktywny)
- `src/components/auth/AuthTabs.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/AuthErrorAlert.tsx`
- `src/lib/auth/auth.storage.ts` (persistencja tokenów)
- `src/lib/auth/auth.api.ts` (wywołania `/api/auth/*`)
- `src/lib/auth/useAuth.ts` (hook: stan auth + akcje)

Wykorzystanie komponentów UI (shadcn/ui + Tailwind):
- `src/components/ui/button.tsx` (już jest)
- `src/components/ui/card.tsx` (już jest)
- Dodać z shadcn/ui: `tabs`, `input`, `label`, `alert` (i opcjonalnie `sonner`/toast)

Wysokopoziomowe drzewo komponentów (render na `/auth`):
- `auth.astro`
  - `Layout`
    - `main`
      - `AuthView` (React)
        - `Card`
          - `h1` + opis
          - `AuthErrorAlert` (opcjonalnie, gdy `error != null`)
          - `AuthTabs`
            - `TabsList` / `TabsTrigger`
            - `TabsContent("login")`
              - `LoginForm`
            - `TabsContent("signup")`
              - `SignupForm`

## 4. Szczegóły komponentów
### `src/pages/auth.astro`
- **Opis**: Strona routingu, renderuje layout i osadza React-owy widok Auth.
- **Główne elementy**:
  - Layout (np. `src/layouts/Layout.astro`)
  - Kontener (np. `main` z max-width)
  - `<AuthView client:load />` (lub `client:visible` jeśli preferowane)
- **Zdarzenia**: brak (strona osadza React).
- **Walidacja**: brak.
- **Typy**: brak.
- **Propsy**: brak.

### `AuthView` (`src/components/auth/AuthView.tsx`)
- **Opis**: Kontener widoku: nagłówek produktu + opis + zakładki “Logowanie/Rejestracja” + centralne miejsce na błędy globalne.
- **Główne elementy**:
  - `Card` / wrapper
  - `h1` (nazwa produktu) + opis (“Zaloguj się, aby zapisywać i polubić przepisy”)
  - `AuthTabs`
  - `AuthErrorAlert` (dla błędów sieciowych/globalnych; opcjonalnie również toast)
- **Obsługiwane zdarzenia**:
  - `onAuthSuccess(response: AuthResponseDTO)` → zapis tokenów + redirect do `/`
  - `onAuthError(error: AuthErrorVM)` → wyświetlenie komunikatu
- **Walidacja**:
  - brak walidacji pól (to robią formy), ale powinien obsłużyć “już zalogowany”:
    - jeśli `authStorage.hasSession()` → redirect do `/`
- **Typy**:
  - DTO: `AuthResponseDTO`
  - ViewModel: `AuthErrorVM`, `AuthTab`
- **Propsy**: brak (root view).

### `AuthTabs` (`src/components/auth/AuthTabs.tsx`)
- **Opis**: Zakładki z dwoma formularzami: Logowanie i Rejestracja.
- **Główne elementy**:
  - `Tabs` (shadcn)
  - `TabsList` + `TabsTrigger` (“Logowanie”, “Rejestracja”)
  - `TabsContent`:
    - `LoginForm`
    - `SignupForm`
  - Link/akcja przełączania (np. tekst “Nie masz konta? Zarejestruj się” / “Masz konto? Zaloguj się”)
- **Obsługiwane zdarzenia**:
  - `onTabChange(next: AuthTab)`
  - `onLoginSuccess`, `onSignupSuccess`
- **Walidacja**: brak.
- **Typy**:
  - `AuthTab = "login" | "signup"`
- **Propsy**:
  - `activeTab?: AuthTab`
  - `onAuthSuccess: (dto: AuthResponseDTO) => void`
  - `onAuthError: (err: AuthErrorVM) => void`

### `LoginForm` (`src/components/auth/LoginForm.tsx`)
- **Opis**: Formularz logowania zgodny z API `POST /api/auth/login`.
- **Główne elementy**:
  - `form`
  - `Label` + `Input` dla email
  - `Label` + `Input` dla hasła (type `password`)
  - Inline komunikaty walidacji pod polami
  - `Button` submit (“Zaloguj”)
  - `Alert` na błąd z API (bez zdradzania szczegółów: “Nieprawidłowy email lub hasło”)
- **Obsługiwane zdarzenia**:
  - `onChangeEmail`, `onChangePassword`
  - `onSubmit`
  - (A11y) submit przez Enter
- **Warunki walidacji (zgodnie z endpointem)**:
  - `email`: string, trim, poprawny format email
  - `password`: min. 8 znaków
  - Blokada wysyłki, gdy walidacja nie przechodzi
  - Blokada podwójnych submitów w trakcie `isSubmitting=true`
- **Typy**:
  - DTO: `LoginCommand`, `AuthResponseDTO`
  - ViewModel: `AuthFormState`, `FieldErrorsVM`, `AuthErrorVM`
- **Propsy**:
  - `onSuccess: (dto: AuthResponseDTO) => void`
  - `onError: (err: AuthErrorVM) => void`

### `SignupForm` (`src/components/auth/SignupForm.tsx`)
- **Opis**: Formularz rejestracji zgodny z API `POST /api/auth/signup`.
- **Główne elementy**: analogicznie do `LoginForm`, z CTA “Utwórz konto”.
- **Obsługiwane zdarzenia**: analogicznie do `LoginForm`.
- **Warunki walidacji (zgodnie z endpointem)**:
  - `email`: string, trim, poprawny format email
  - `password`: min. 8 znaków
  - Obsługa `409 Conflict` (email istnieje): przyjazny komunikat “Konto z tym adresem email już istnieje”
- **Typy**:
  - DTO: `SignupCommand`, `AuthResponseDTO`
  - ViewModel: `AuthFormState`, `FieldErrorsVM`, `AuthErrorVM`
- **Propsy**:
  - `onSuccess: (dto: AuthResponseDTO) => void`
  - `onError: (err: AuthErrorVM) => void`

### `AuthErrorAlert` (`src/components/auth/AuthErrorAlert.tsx`)
- **Opis**: Wspólny komponent komunikatu o błędzie (network/API/unknown) w obrębie widoku.
- **Główne elementy**:
  - `Alert` (shadcn) lub prosty blok Tailwind
  - Tekst błędu (bezpieczny, user-friendly)
- **Obsługiwane zdarzenia**:
  - (opcjonalnie) “Spróbuj ponownie” – jeśli błąd powstał po submit i da się powtórzyć
  - (opcjonalnie) “Wyczyść” – zamknięcie alertu
- **Walidacja**: brak.
- **Typy**:
  - `AuthErrorVM`
- **Propsy**:
  - `error: AuthErrorVM | null`
  - `onDismiss?: () => void`

## 5. Typy
Wykorzystać istniejące typy DTO z `src/types.ts`:
- **`LoginCommand`**: `{ email: string; password: string }`
- **`SignupCommand`**: `{ email: string; password: string }`
- **`AuthResponseDTO`**:
  - `user`: `{ id: UserId; email: string }`
  - `session`: `{ access_token: string; refresh_token: string }`

Dodać typy ViewModel (nowe, po stronie frontendu), np. w `src/lib/auth/auth.types.ts`:
- **`AuthTab`**: `"login" | "signup"`
- **`AuthFieldName`**: `"email" | "password"`
- **`FieldErrorsVM`**:
  - `email?: string`
  - `password?: string`
  - `form?: string` (błąd ogólny formularza)
- **`AuthFormState`**:
  - `values`: `{ email: string; password: string }`
  - `errors`: `FieldErrorsVM`
  - `isSubmitting`: `boolean`
  - `canSubmit`: `boolean` (wynik walidacji po stronie klienta)
- **`ApiErrorResponse`** (zgodny z implementacją endpointów):
  - `error`: `{ code: string; message: string; details?: Record<string, unknown> }`
- **`AuthErrorVM`** (do wyświetlania):
  - `kind`: `"validation" | "unauthorized" | "conflict" | "network" | "server" | "unknown"`
  - `message`: `string` (copy dla użytkownika)
  - `status?: number`
  - `details?: unknown` (np. `issues` z Zod z API)
- **`AuthSessionVM`** (minimalny model sesji po stronie UI):
  - `user`: `AuthResponseDTO["user"]`
  - `access_token`: `AuthResponseDTO["session"]["access_token"]`
  - `refresh_token`: `AuthResponseDTO["session"]["refresh_token"]`

## 6. Zarządzanie stanem
Zakres stanu dla widoku Auth:
- **Stan lokalny formularzy**: w `LoginForm`/`SignupForm` (values, errors, isSubmitting).
- **Stan globalny auth (min.)**: tokeny i user po zalogowaniu; dla samego widoku wystarczy:
  - zapisać `AuthResponseDTO` w storage i przekierować,
  - opcjonalnie wystawić `useAuth()` dla reszty aplikacji.

Rekomendowany hook:
- **`useAuth()`** (np. `src/lib/auth/useAuth.ts`):
  - `getSession(): AuthSessionVM | null` (z pamięci/storage)
  - `login(command: LoginCommand): Promise<AuthResponseDTO>`
  - `signup(command: SignupCommand): Promise<AuthResponseDTO>`
  - `logout(): Promise<void>` (woła `/api/auth/logout` i czyści storage)
  - `setSession(dto: AuthResponseDTO)` / `clearSession()`

Persistencja (ważne z perspektywy middleware):
- API jest autoryzowane przez nagłówek `Authorization` przekazywany do Supabase w `src/middleware/index.ts`, więc frontend musi:
  - przechowywać `access_token`,
  - dodawać `Authorization: Bearer <access_token>` do kolejnych requestów do `/api/*`.

## 7. Integracja API
### Endpointy
- **`POST /api/auth/login`**
  - Request: `LoginCommand`
  - Response 200: `AuthResponseDTO`
  - Error 400: `ApiErrorResponse` (np. invalid email/password format)
  - Error 401: `ApiErrorResponse` (“Invalid email or password”)

- **`POST /api/auth/signup`**
  - Request: `SignupCommand`
  - Response 201: `AuthResponseDTO`
  - Error 400: `ApiErrorResponse`
  - Error 409: `ApiErrorResponse` (“Email already exists”)

### Klient API (frontend)
Zaimplementować w `src/lib/auth/auth.api.ts` funkcje:
- `login(command: LoginCommand): Promise<AuthResponseDTO>`
- `signup(command: SignupCommand): Promise<AuthResponseDTO>`

Wymagania implementacyjne:
- Ustawić `Content-Type: application/json`
- Parsować JSON odpowiedzi
- Dla błędów parsować `ApiErrorResponse` i mapować na `AuthErrorVM`
- Dla kolejnych wywołań do API (poza samym Auth) przewidzieć wspólny wrapper `apiFetch()` doklejający `Authorization` z `authStorage`.

## 8. Interakcje użytkownika
- **Przełączenie taba**:
  - Użytkownik klika “Logowanie” / “Rejestracja” → render odpowiedniego formularza.
  - Link “Przejdź do rejestracji/logowania” zmienia aktywny tab (bez zmiany route).
- **Wpisywanie danych**:
  - Walidacja inline po blur lub po submit (do decyzji); ważne by nie “karać” użytkownika za każdy znak.
- **Submit**:
  - Kliknięcie CTA lub Enter → walidacja → request do API.
  - W trakcie requestu: disabled na polach + przycisku, widoczny stan ładowania na buttonie.
- **Sukces**:
  - Zapis `access_token` i `refresh_token`
  - Redirect do `/` (lub docelowego “App Shell”)
- **Błąd**:
  - Czytelny komunikat inline (Alert) + zachowanie wartości w polach.

## 9. Warunki i walidacja
Warunki wymagane przez API i sposób weryfikacji w UI:
- **Email**:
  - UI: `trim()` + walidacja formatu (np. regex/Zod: `z.string().trim().email()`).
  - Komunikat: “Podaj poprawny adres email”.
- **Hasło**:
  - UI: minimum 8 znaków.
  - Komunikat: “Hasło musi mieć co najmniej 8 znaków”.
- **Blokada wielokrotnego submitu**:
  - `isSubmitting === true` → disable + brak kolejnych requestów.
- **Bezpieczeństwo komunikatów** (zgodnie z `.ai/ui-plan.md`):
  - Dla 401: zawsze ogólne “Nieprawidłowy email lub hasło”.
  - Dla 409: “Konto z tym adresem email już istnieje”.
  - Dla 400: komunikat z walidacji (zwykle bezpieczny) + ewentualne szczegóły tylko w DEV (np. `console.debug`).

## 10. Obsługa błędów
Scenariusze i rekomendowane zachowania UI:
- **400 BAD_REQUEST** (walidacja z API):
  - Mapować na błąd pól (jeśli `details.issues` istnieje) lub błąd formularza.
- **401 UNAUTHORIZED** (login):
  - Pokazać copy: “Nieprawidłowy email lub hasło”.
- **409 CONFLICT** (signup):
  - Pokazać copy: “Konto z tym adresem email już istnieje”.
- **Błąd sieci / CORS / brak internetu**:
  - Copy: “Nie udało się połączyć z serwerem. Spróbuj ponownie.”
- **500 INTERNAL_SERVER_ERROR** lub nieoczekiwany format odpowiedzi:
  - Copy: “Wystąpił nieoczekiwany błąd. Spróbuj ponownie.”
  - Logowanie do konsoli (bez danych wrażliwych).

## 11. Kroki implementacji
1. **Routing**: utwórz `src/pages/auth.astro` i osadź React `AuthView` (np. `client:load`).
2. **UI bazowe**: dodaj wymagane komponenty shadcn/ui (`tabs`, `input`, `label`, `alert`) do `src/components/ui/` i dostosuj styl do Tailwind 4.
3. **Warstwa API**: dodaj `src/lib/auth/auth.api.ts` z `login()` i `signup()` (typy z `src/types.ts`), plus wspólne parsowanie `ApiErrorResponse`.
4. **Storage sesji**: dodaj `src/lib/auth/auth.storage.ts`:
   - `getAccessToken()`, `setSession(dto)`, `clearSession()`, `hasSession()`
   - decyzja: `localStorage` (MVP) + pamięć procesu (opcjonalnie) dla szybszego dostępu.
5. **Hook auth**: dodaj `src/lib/auth/useAuth.ts` spinający `auth.api` + `auth.storage` i wystawiający akcje `login/signup/logout`.
6. **Formularze**: zaimplementuj `LoginForm` i `SignupForm`:
   - walidacja inline (email + min 8)
   - stan `isSubmitting`
   - mapowanie błędów HTTP (400/401/409/500/network) na `AuthErrorVM`
7. **Tabs**: zaimplementuj `AuthTabs` i podłącz formularze.
8. **Sukces i redirect**: w `AuthView` po `onSuccess`:
   - zapisz sesję (`auth.storage.setSession(dto)`)
   - przekieruj do `/` (np. `window.location.assign("/")`)
9. **A11y i UX**:
   - `label` powiązany z `input` (`htmlFor/id`)
   - `aria-describedby` na błędy pól
   - fokus na pierwsze błędne pole po submit
10. **Alias route (opcjonalnie)**: dodaj `src/pages/login.astro` jako redirect do `/auth`.
11. **Manual QA**:
   - rejestracja poprawna (201) → redirect
   - rejestracja na istniejący email (409) → komunikat
   - logowanie błędne (401) → komunikat
   - logowanie poprawne (200) → redirect
   - walidacja po stronie UI blokuje request przy złych danych
