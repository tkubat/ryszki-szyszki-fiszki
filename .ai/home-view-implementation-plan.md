## Plan implementacji widoku Home (App Shell)

## 1. Przegląd
Widok **Home (App Shell)** to główny, chroniony ekran aplikacji dla zalogowanego użytkownika. Zapewnia:
- stały **header** z nazwą produktu, informacją o sesji (email) i akcją **“Wyloguj”**
- nawigację w formie **Tabs** pomiędzy: **“Generuj”** oraz **“Moje przepisy”**
- spójny **guard sesji**: brak sesji lub wykrycie `401` → przekierowanie do `/auth` bez renderowania danych użytkownika

Zakres tego planu skupia się na implementacji shell’a (routing, guard, tabs, logout). Renderowanie zawartości tabów (“Generuj”, “Moje przepisy”) jest ujęte jako integracja komponentów potomnych.

## 2. Routing widoku
### Rekomendowana ścieżka
- **`/app`** jako chroniony route dla App Shell (łatwo odseparować od ewentualnego landing page na `/`).

### Alternatywa (jeśli “Home” ma być rootem)
- **`/`** jako route chroniony, a landing przenieść na np. `/welcome`.

### Pliki routingu (Astro)
- Utworzyć stronę:
  - `src/pages/app.astro` (rekomendowane) **lub** zmodyfikować `src/pages/index.astro` (wariant root).
- Strona powinna renderować interaktywny React komponent App Shell jako island:
  - np. `<AppShell client:load />` (lub `client:visible` jeśli zależy nam na minimalizacji JS; dla guarda zwykle lepiej `client:load`).

## 3. Struktura komponentów
### Główne komponenty
- `AppShellPage` (Astro) – kontener routingu i Layoutu
- `AppShell` (React) – logika sesji, tabs, logout, obsługa 401
- `AppHeader` (React) – tytuł, email, przycisk wylogowania
- `AppTabs` (React) – tablist + kontrola activeTab (a11y)
- `GenerateTab` (React) – zawartość taba “Generuj” (integracja)
- `RecipesTab` (React) – zawartość taba “Moje przepisy” (integracja)

### Diagram drzewa komponentów (wysokopoziomowo)
- `AppShellPage` (Astro)
  - `Layout`
    - `main`
      - `AppShell` (React island)
        - `AppHeader`
        - `AppTabs`
          - `TabsTrigger`: “Generuj”
          - `TabsTrigger`: “Moje przepisy”
          - `TabsContent(generate)` → `GenerateTab`
          - `TabsContent(recipes)` → `RecipesTab`

## 4. Szczegóły komponentów
### `AppShellPage` (`src/pages/app.astro`)
- **Opis komponentu**: Strona Astro będąca wejściem do aplikacji po zalogowaniu. Odpowiada za użycie `Layout.astro` i załadowanie React island.
- **Główne elementy**:
  - `<Layout title="...">`
  - kontener `<main>` (semantyczny landmark)
  - React island `AppShell` (np. `client:load`)
- **Obsługiwane zdarzenia**: brak (strona statycznie osadza React).
- **Walidacja**:
  - brak walidacji – guard sesji realizuje `AppShell` po stronie klienta.
- **Typy (DTO/ViewModel)**: brak.
- **Propsy**:
  - opcjonalnie `title` do `Layout`.

### `AppShell` (`src/components/AppShell.tsx` lub `src/components/app/AppShell.tsx`)
- **Opis komponentu**: Główny orchestrator widoku. Pilnuje sesji, wyświetla header + tabs, obsługuje logout i globalne `401`.
- **Główne elementy**:
  - wrapper layoutu (np. `div` z szerokością i paddingiem)
  - `<AppHeader ... />`
  - `<AppTabs ... />` + obszar treści taba
- **Obsługiwane zdarzenia**:
  - `onMount`: weryfikacja sesji (token w storage) + ustawienie stanu
  - `onTabChange(tab)`: przełączenie taba + (opcjonalnie) synchronizacja z URL `?tab=...`
  - `onLogoutClick`: wywołanie API `/api/auth/logout`, czyszczenie sesji, redirect
  - `onUnauthorized`: centralna obsługa `401` (czyszczenie sesji, redirect)
- **Walidacja (warunki wymagane przez API i UI)**:
  - jeśli **brak `access_token`** w storage → natychmiastowy redirect do `/auth` i brak renderowania danych użytkownika
  - jeśli token istnieje, ale API zwróci `401` (sesja wygasła/nieprawidłowa) → wylogowanie lokalne + redirect
- **Typy (DTO/ViewModel)**:
  - korzysta z `AuthResponseDTO` / `AuthUserDTO` / `AuthSessionDTO` (z `src/types.ts`)
  - własne ViewModel’e: `AppShellVM`, `HeaderUserVM`, `TabKey` (szczegóły w sekcji “Typy”)
- **Propsy** (interfejs komponentu):
  - opcjonalnie:
    - `defaultTab?: TabKey` (np. `"generate"`)
    - `authRedirectPath?: string` (domyślnie `"/auth"`)

### `AppHeader`
- **Opis komponentu**: Sticky header na mobile. Pokazuje nazwę produktu, (opcjonalnie) email użytkownika i przycisk “Wyloguj”.
- **Główne elementy**:
  - `<header>` + container
  - tytuł (np. `<h1>` lub `<div>` w zależności od hierarchy)
  - sekcja po prawej: email (skrót) + `Button` “Wyloguj”
- **Obsługiwane zdarzenia**:
  - `onLogout`: kliknięcie w “Wyloguj”
- **Walidacja**:
  - przycisk “Wyloguj” disabled gdy `logoutState === "loading"`
- **Typy**:
  - `HeaderUserVM` (email pełny + skrót), `LogoutState`
- **Propsy**:
  - `user: HeaderUserVM`
  - `logoutState: LogoutState`
  - `onLogout: () => void`

### `AppTabs`
- **Opis komponentu**: Kontroluje nawigację między “Generuj” i “Moje przepisy” w ramach App Shell.
- **Główne elementy**:
  - Tablist (rekomendacja: shadcn/ui `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`)
  - Dwa triggery: “Generuj”, “Moje przepisy”
  - Treść tabów renderowana przez rodzica (żeby zachować kontrolę nad fetchami/stanem)
- **Obsługiwane zdarzenia**:
  - `onValueChange(value: TabKey)`
- **Walidacja**:
  - `value` musi być jedną z dozwolonych wartości (`"generate" | "recipes"`)
  - (opcjonalnie) jeśli URL ma `?tab=...` spoza listy → fallback do `"generate"`
- **Typy**:
  - `TabKey`, `TabsVM`
- **Propsy**:
  - `activeTab: TabKey`
  - `onTabChange: (tab: TabKey) => void`

### `GenerateTab` (integracja)
- **Opis komponentu**: Widok generowania przepisu (wymagany do realizacji US-010 jako drugi “ekran”).
- **Interakcje w kontekście App Shell**:
  - App Shell powinien umożliwić powrót do tego taba jednym kliknięciem (Tab Trigger).
- **Propsy** (minimalny kontrakt integracyjny):
  - `api: ApiClient` (albo funkcje: `generateRecipe(...)`)
  - `onUnauthorized: () => void` (jeśli nie centralizujemy w `ApiClient`)

### `RecipesTab` (integracja)
- **Opis komponentu**: Lista “Moje przepisy” (wymagany do realizacji US-010/US-011).
- **Interakcje w kontekście App Shell**:
  - Tab Trigger prowadzi do listy.
  - Empty state powinien zawierać CTA “Przejdź do Generuj” → `onNavigateToGenerate()`.
- **Propsy** (minimalny kontrakt integracyjny):
  - `api: ApiClient` (albo funkcje: `getRecipes(...)`, `toggleLiked(...)`)
  - `onNavigateToGenerate: () => void`
  - `onUnauthorized: () => void` (jeśli nie centralizujemy w `ApiClient`)

## 5. Typy
### Istniejące DTO (z `src/types.ts`)
- **`AuthResponseDTO`**:
  - `user: AuthUserDTO` (`id`, `email`)
  - `session: AuthSessionDTO` (`access_token`, `refresh_token`)

### Nowe typy (rekomendowane do dodania w `src/types.ts` lub lokalnie w widoku)
- **`ApiErrorDTO`** (odzwierciedla ustandaryzowane błędy endpointów):
  - `error: { code: string; message: string; details?: Record<string, unknown> }`
- **`TabKey`**:
  - `"generate" | "recipes"`
- **`HeaderUserVM`** (ViewModel do headera):
  - `email: string`
  - `emailShort: string` (np. `tomas@…` albo `tomas`)
- **`LogoutState`**:
  - `"idle" | "loading" | "error"`
- **`AppShellVM`**:
  - `user: HeaderUserVM`
  - `activeTab: TabKey`
  - `logoutState: LogoutState`
  - `errorMessage?: string` (na potrzeby wyświetlenia błędu w shellu, jeśli logout się nie uda)
- **`AuthStorageModel`** (model zapisu w storage; minimalny pod App Shell):
  - `access_token: string`
  - `refresh_token: string` (na przyszłość; w MVP może nie być używany, ale warto przechować)
  - `email: string`
  - `user_id: string`

## 6. Zarządzanie stanem
### Zmienne stanu w `AppShell`
- **`authStatus`**: `"unknown" | "authenticated" | "unauthenticated"`
  - cel: uniknięcie “flash” UI zanim sprawdzimy storage
- **`activeTab: TabKey`**
  - cel: kontrola, który tab jest aktywny
- **`logoutState: LogoutState`**
  - cel: disabled na przycisku + ewentualny komunikat błędu
- **`errorMessage?: string`**
  - cel: komunikat w UI (np. alert/toast) gdy logout zwróci `500` lub wystąpi błąd sieci

### Custom hooki (rekomendowane, aby utrzymać czysty kod)
- `useAuthStorage()`
  - **odczyt/zapis/clear** auth z `localStorage`
  - zwraca `get(): AuthStorageModel | null`, `set(dto: AuthResponseDTO)`, `clear()`
- `useActiveTab()`
  - mapuje `TabKey` ↔ URL `?tab=...` (opcjonalnie)
  - zapewnia kompatybilność z back/forward + deep-link
- `useLogout()`
  - enkapsuluje wywołanie `/api/auth/logout` + stany `loading/error`
  - przyjmuje `accessToken` oraz `onSuccess/onUnauthorized`

## 7. Integracja API
### Wymagane wywołania (dla tego widoku)
#### `POST /api/auth/logout`
- **Request**:
  - metoda: `POST`
  - nagłówki:
    - `Authorization: Bearer <access_token>` (wymagane przez middleware i Supabase Auth)
- **Response**:
  - `204 No Content` → sukces wylogowania
  - `401 Unauthorized` → brak sesji / token nieprawidłowy (frontend traktuje jak “już wylogowany”)
  - `500` + `ApiErrorDTO` → błąd serwera (pokazać komunikat i dać retry)

### Rekomendowany klient API (żeby spiąć 401 globalnie)
W `src/lib` dodać lekki wrapper (np. `src/lib/api/client.ts`):
- funkcja `apiFetch(input, init)`:
  - automatycznie dołącza `Authorization` jeśli token istnieje
  - dla `401`:
    - czyści storage
    - robi redirect do `/auth`
    - (opcjonalnie) rzuca kontrolowany błąd, aby komponent mógł zakończyć flow bez dodatkowych side-effectów
- `logout(): Promise<void>` używa `apiFetch("/api/auth/logout", { method: "POST" })`

## 8. Interakcje użytkownika
- **Klik “Moje przepisy”**:
  - aktywny tab zmienia się na `"recipes"`
  - renderuje się zawartość listy (komponent `RecipesTab`)
  - (opcjonalnie) URL aktualizuje się do `?tab=recipes`
- **Klik “Generuj”**:
  - aktywny tab zmienia się na `"generate"`
  - renderuje się zawartość generowania (komponent `GenerateTab`)
  - (opcjonalnie) URL aktualizuje się do `?tab=generate`
- **Klik “Wyloguj”**:
  - stan `logoutState` → `"loading"`; przycisk disabled
  - request do `/api/auth/logout`
  - po `204` lub `401`: czyszczenie sesji lokalnie + redirect do `/auth`
  - po błędzie sieci/`500`: `logoutState` → `"error"`, pokazanie komunikatu + możliwość ponowienia
- **Wygasła sesja (401 z dowolnego API w trakcie używania app)**:
  - natychmiast: czyszczenie sesji lokalnie + redirect do `/auth`

## 9. Warunki i walidacja
### Warunki wymagane przez API (i weryfikowane w UI)
- **`Authorization` header wymagany** dla endpointów chronionych:
  - UI musi posiadać `access_token` w storage i dołączać go do requestów.
- **Logout**:
  - jeśli brak tokena → nie wywoływać API; od razu zrobić “local logout” + redirect do `/auth`
  - jeśli API zwróci `401` → traktować jak poprawne zakończenie sesji (spełnia US-011)

### Warunki wpływające na stan interfejsu
- `authStatus === "unknown"`:
  - renderować skeleton/placeholder (albo nic) – bez wrażliwych danych
- `authStatus === "unauthenticated"`:
  - wykonać redirect do `/auth` i nie renderować widoku
- `logoutState === "loading"`:
  - disabled na przycisku “Wyloguj”
  - opcjonalnie spinner w przycisku

## 10. Obsługa błędów
### Scenariusze błędów i obsługa
- **Brak sesji przy wejściu na `/app`**:
  - `access_token` nie istnieje w storage → redirect do `/auth`
- **`POST /api/auth/logout` → `401`**:
  - wyczyścić storage, redirect do `/auth` (bez pokazywania błędu)
- **`POST /api/auth/logout` → `500` / błąd sieci**:
  - pokazać komunikat “Nie udało się wylogować. Spróbuj ponownie.”
  - przycisk “Wyloguj” ponownie aktywny, użytkownik może retry
- **Inne API w tabach zwraca `401`**:
  - centralnie: czyszczenie storage + redirect do `/auth`
- **Niepoprawny `?tab=` w URL**:
  - fallback do `"generate"` i (opcjonalnie) `history.replaceState` na poprawny URL

## 11. Kroki implementacji
1. **Ustal routing**: wybierz wariant `/app` (rekomendowany) albo `/` i przygotuj odpowiednią stronę Astro (`src/pages/app.astro` lub modyfikacja `src/pages/index.astro`).
2. **Dodaj komponent `AppShell` (React)**: podstawowy layout, header, tabs, bez logiki API na start.
3. **Dodaj warstwę storage dla auth** (`useAuthStorage`):
   - klucz(e) w `localStorage` dla `AuthStorageModel`
   - funkcje `get/set/clear`
4. **Zaimplementuj guard sesji** w `AppShell`:
   - `authStatus: unknown → authenticated/unauthenticated`
   - redirect do `/auth` przy braku tokena
5. **Dodaj Tabs**:
   - doinstaluj/utwórz shadcn `Tabs` (`src/components/ui/tabs.tsx`) lub zaimplementuj własny a11y tablist
   - w `AppShell`: `activeTab`, `onTabChange`, domyślnie `"generate"`
   - (opcjonalnie) synchronizacja z URL `?tab=...` przez `useActiveTab`
6. **Zaimplementuj logout**:
   - klient API (np. `apiFetch`) dołączający `Authorization: Bearer ...`
   - handler kliknięcia: `POST /api/auth/logout`
   - obsługa `204` i `401`: `clear()` + redirect `/auth`
   - obsługa błędów: komunikat + retry
7. **Podłącz dzieci tabów**:
   - osadź `GenerateTab` i `RecipesTab` jako treści dla `TabsContent`
   - zapewnij, że ich requesty API używają tego samego mechanizmu `Authorization` i globalnego `401`
8. **Dopnij wymagania US-010/US-011**:
   - stały element nawigacji: Tabs zawsze widoczne
   - bezpieczny dostęp: brak sesji lub 401 → `/auth`, bez wycieku danych w UI
9. **Testy manualne (checklista)**:
   - wejście na `/app` bez tokena → redirect do `/auth`
   - przełączanie tabów myszką i klawiaturą (strzałki/tab)
   - logout z poprawnym tokenem → `204` + redirect
   - logout bez tokena / `401` → redirect bez błędu
   - symulacja `500` na logout → komunikat + retry działa

