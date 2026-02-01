# Plan implementacji widoku Session Boot / Auth Gate

## 1. Przegląd
Widok/stanu **Session Boot / Auth Gate** odpowiada za **ustalenie stanu sesji użytkownika** na starcie aplikacji (lub po odświeżeniu) i podjęcie decyzji, czy renderować **Auth** czy **App Shell**. W trakcie weryfikacji sesji UI pokazuje **krótki loader** (bez migotania), a do momentu potwierdzenia sesji **nie renderuje żadnych treści z danymi użytkownika**.

Kluczowy cel wynikający z PRD/US-011: **bezpieczny dostęp do zapisów** — wejście na listę przepisów bez sesji ma skutkować przekierowaniem do logowania, a po wylogowaniu / wygaśnięciu sesji aplikacja ma wymagać ponownego logowania.

## 2. Routing widoku
To jest **stan globalny**, ale implementacyjnie w Astro warto go ująć jako **wspólny mechanizm** używany w dwóch routach:

- **`/auth`**: strona Auth (logowanie/rejestracja). Jeśli użytkownik ma aktywną sesję → przekieruj do `/`.
- **`/`** (chroniony): strona aplikacji (App Shell z tabami). Jeśli brak sesji → przekieruj do `/auth`.

Rekomendowana implementacja routingu:
- `src/pages/index.astro` renderuje React root dla App, ale jest owinięty w `AuthGate` z trybem “require-auth”.
- `src/pages/auth.astro` renderuje Auth UI, ale jest owinięty w `AuthGate` z trybem “require-unauth”.

Uwaga: w MVP przekierowania będą realizowane **po stronie klienta** (`window.location.assign(...)`), bo API autoryzacji opiera się o nagłówek `Authorization`, a sesja jest przechowywana po stronie klienta.

## 3. Struktura komponentów
Główne elementy do wdrożenia (React):
- `SessionProvider` (Context): źródło prawdy o sesji (`unknown/authenticated/unauthenticated`) + akcje `boot/login/logout`.
- `AuthGate` (komponent): wybiera, co renderować na podstawie stanu sesji i wymagania routa.
- `SessionBootScreen` (UI): krótki loader/skeleton bez danych użytkownika.

## 4. Szczegóły komponentów

### `SessionBootScreen`
- **Opis komponentu**: prosty ekran ładowania używany, gdy status sesji to `unknown` lub gdy trwa weryfikacja/retry.
- **Główne elementy**:
  - kontener (np. `<main>`),
  - loader/spinner lub skeleton (shadcn/ui lub prosty Tailwind),
  - tekst statusowy “Ładuję…” (dla SR).
- **Obsługiwane zdarzenia**: brak.
- **Walidacja**: brak.
- **Typy**: brak (opcjonalnie props: `label?: string`).
- **Props (interfejs)**:
  - `label?: string` — komunikat (domyślnie “Ładuję…”).

### `SessionProvider`
- **Opis komponentu**: przechowuje i udostępnia stan sesji w React Context. Odpowiada za:
  - boot sesji (odczyt tokenów + weryfikacja),
  - zapis/odczyt sesji w storage,
  - jednolitą reakcję na `401` (clear + redirect do Auth).
- **Główne elementy**:
  - `SessionContext.Provider`,
  - logika w `useEffect` (auto-boot) lub jawne `boot()` wywoływane przez `AuthGate`.
- **Obsługiwane zdarzenia**:
  - mount: inicjalizacja (`boot`) jeśli `autoBoot=true`,
  - akcje kontekstowe: `loginSuccess(authResponse)`, `logout()`, `clearSession()`, `handleUnauthorized()`.
- **Walidacja**:
  - sanity-check tokenów w storage (puste stringi → traktuj jak brak sesji),
  - (opcjonalnie) szybka walidacja JWT: jeśli `access_token` jest niepoprawny lub wygasł → clear i `unauthenticated`.
- **Typy**: patrz sekcja **5. Typy**.
- **Props (interfejs)**:
  - `children: React.ReactNode`,
  - `autoBoot?: boolean` (domyślnie `true`),
  - `onUnauthenticated?: (reason: UnauthReason) => void` (opcjonalnie, np. do przekierowań),
  - `onAuthenticated?: () => void` (opcjonalnie),
  - `bootStrategy?: "validate-with-api" | "token-only"` (domyślnie `"validate-with-api"`).

### `AuthGate`
- **Opis komponentu**: kontroluje renderowanie zależnie od wymagań routa:
  - dla `/` wymaga sesji,
  - dla `/auth` wymaga braku sesji,
  - dla `unknown` pokazuje `SessionBootScreen`.
- **Główne elementy**:
  - `SessionBootScreen` w stanie `unknown`,
  - `children` gdy warunek spełniony,
  - przekierowanie (client-side) gdy warunek niespełniony.
- **Obsługiwane zdarzenia**:
  - mount: wywołanie `boot()` jeśli `status === "unknown"` i `autoBoot` nie jest używany w Providerze,
  - reakcja na zmianę `status` → ewentualne przekierowanie.
- **Walidacja**:
  - nie renderować dzieci dopóki nie ma `authenticated`,
  - po wykryciu `unauthenticated` na routach chronionych → redirect do `/auth`.
- **Typy**:
  - `AuthGateMode` (np. `"require-auth" | "require-unauth"`),
  - `SessionStatus`.
- **Props (interfejs)**:
  - `mode: AuthGateMode`,
  - `children: React.ReactNode`,
  - `bootFallback?: React.ReactNode` (domyślnie `<SessionBootScreen />`),
  - `redirectToOnUnauth?: string` (domyślnie `"/auth"`),
  - `redirectToOnAuth?: string` (domyślnie `"/"`).

### (Integracyjnie) `AppEntry` i `AuthEntry` (rooty stron)
- **Opis komponentu**: cienkie wrappery montowane na odpowiednich stronach Astro.
- **Główne elementy**:
  - `SessionProvider`,
  - `AuthGate`,
  - właściwa treść (`AppShell` lub `AuthView`).
- **Obsługiwane zdarzenia**: brak (delegowane).
- **Walidacja**: brak.
- **Typy**: brak.
- **Props**: brak.

## 5. Typy
Wykorzystujemy istniejące DTO z `src/types.ts` i dokładamy ViewModel/typy UI:

### Istniejące DTO (z repo)
- **`AuthResponseDTO`**: `{ user: AuthUserDTO; session: AuthSessionDTO }` (z API `/api/auth/login` i `/api/auth/signup`).
- **`AuthUserDTO`**: `{ id: UserId; email: string }`.
- **`AuthSessionDTO`**: `{ access_token: string; refresh_token: string }`.
- **`RecipesListResponseDTO`**: `{ data: RecipeDTO[]; next_cursor: RecipeCreatedAt | null }` (użyte do weryfikacji sesji).

### Nowe typy (ViewModel/UI)
Dodaj w UI (np. `src/lib/auth/session.types.ts`):

- **`SessionStatus`**:
  - `"unknown"` — start aplikacji, brak decyzji,
  - `"authenticated"` — mamy potwierdzoną sesję,
  - `"unauthenticated"` — brak/nieprawidłowa sesja.

- **`UnauthReason`**:
  - `"no_tokens"` — storage pusty,
  - `"invalid_tokens"` — np. puste stringi / niespójne dane,
  - `"expired"` — (opcjonalnie) token wygasł,
  - `"unauthorized_401"` — backend zwrócił 401,
  - `"boot_network_error"` — błąd sieci podczas boot.

- **`SessionStateVM`**:
  - `status: SessionStatus`
  - `user: AuthUserDTO | null` (w MVP może być `null`, jeśli nie mamy endpointu “me”)
  - `session: AuthSessionDTO | null`
  - `bootError: { message: string; kind: "network" | "unknown" } | null`

- **`SessionActionsVM`**:
  - `boot(): Promise<void>`
  - `setSession(auth: AuthResponseDTO): void` (po login/signup)
  - `clearSession(reason?: UnauthReason): void`
  - `logout(): Promise<void>` (wywołuje `/api/auth/logout` + `clearSession`)
  - `handleUnauthorized(): void` (standard: `clearSession("unauthorized_401")` + redirect)

- **`AuthGateMode`**:
  - `"require-auth"` — rout chroniony (np. `/`)
  - `"require-unauth"` — rout publiczny (np. `/auth`)

### Format błędów API (do mapowania w UI)
API zwraca błędy w formacie:
- `{ error: { code: string; message: string; details?: Record<string, unknown> } }`

Warto mieć typ pomocniczy:
- **`ApiErrorDTO`**: odpowiadający powyższemu kształtowi.

## 6. Zarządzanie stanem
Stan powinien być globalny i jednolity:
- **Context**: `SessionContext` + hook `useSession()`.
- **Źródło danych**: `localStorage` (MVP) jako storage sesji.

Rekomendowany zestaw stanów:
- `status: SessionStatus` (start: `"unknown"`)
- `session: AuthSessionDTO | null`
- `user: AuthUserDTO | null` (opcjonalny w MVP)
- `bootError: SessionStateVM["bootError"]`
- `isBooting: boolean` (opcjonalnie, jeśli rozdzielasz od `status`)

Custom hooki:
- **`useSession()`**: zwraca `{ state, actions }`.
- **`useAuthHeaders()`** (opcjonalnie): buduje nagłówki `Authorization` na podstawie `session.access_token`.
- **`useUnauthorizedRedirect()`** (opcjonalnie): efekt uboczny do spójnego redirectu po `unauthenticated` na stronach chronionych.

## 7. Integracja API
AuthGate do weryfikacji sesji używa istniejących endpointów:

### Boot/weryfikacja sesji (rekomendowane: “validate-with-api”)
- **Wywołanie**: `GET /api/recipes?limit=1`
- **Nagłówki**: `Authorization: Bearer <access_token>`
- **Sukces**: `200` (`RecipesListResponseDTO`) → sesja uznana za ważną → `status="authenticated"`.
- **Błąd**:
  - `401` → `clearSession("unauthorized_401")`, redirect do `/auth`,
  - inne (np. 500 / network) → pokaż `SessionBootScreen` + komunikat i przycisk “Spróbuj ponownie” (bez renderowania App).

### Logout
- **Wywołanie**: `POST /api/auth/logout`
- **Nagłówki**: `Authorization: Bearer <access_token>`
- **Sukces**: `204` → `clearSession()` + redirect do `/auth`
- **Błąd**:
  - `401` → i tak `clearSession()` + redirect do `/auth` (sesja już nieważna),
  - `500` → pokaż toast/alert “Nie udało się wylogować, spróbuj ponownie” + możliwość wymuszenia lokalnego logout (w MVP dopuszczalne).

### Konsekwencja dla reszty frontendu (ważne dla AuthGate)
Wszystkie wywołania do endpointów chronionych (`/api/recipes*`) muszą dodawać:
- `Authorization: Bearer <access_token>`
i centralnie obsługiwać:
- `401` → `handleUnauthorized()` (czyli czyszczenie sesji + redirect do `/auth`).

## 8. Interakcje użytkownika
W samym “tech view” interakcje są minimalne:
- **Start aplikacji / wejście na route**:
  - widzi “Ładuję…”,
  - po rozstrzygnięciu: trafia do App albo Auth.
- **Błąd sieci podczas boot**:
  - widzi komunikat (np. “Nie można połączyć się z serwerem. Spróbuj ponownie.”),
  - klik “Spróbuj ponownie” → ponawia `boot()`.

## 9. Warunki i walidacja
Warunki wymagane przez API i weryfikowane w UI:

- **Wymagany `Authorization`** na endpointach:
  - `GET /api/recipes` (używane także do boot),
  - `POST /api/auth/logout`.
  - **Weryfikacja w UI**: jeśli `session?.access_token` brak → nie wysyłaj requestów wymagających auth, ustaw `status="unauthenticated"` i redirect do `/auth`.

- **Brak renderowania danych przed potwierdzeniem sesji**:
  - **Warunek UI**: dopóki `status === "unknown"`, renderuj wyłącznie `SessionBootScreen` (lub skeleton App Shell bez danych).

- **Obsługa 401 jako “sesja wygasła”**:
  - **Warunek UI**: każdy `401` z API → `clearSession("unauthorized_401")` + redirect do `/auth` + opcjonalny komunikat “Sesja wygasła. Zaloguj się ponownie.”.

## 10. Obsługa błędów
Scenariusze i sugerowana obsługa:

- **Brak tokenów w storage**:
  - `/` → redirect do `/auth`,
  - `/auth` → render Auth normalnie.

- **Token w storage, ale backend zwraca 401** (wygaśnięcie/niepoprawny token):
  - natychmiast: `clearSession("unauthorized_401")`,
  - redirect do `/auth`,
  - (opcjonalnie) toast/info “Sesja wygasła…”.

- **Błąd sieci / offline podczas boot**:
  - nie renderuj App ani Auth w sposób, który “wycieka” dane,
  - pokaż ekran boot z komunikatem i retry.

- **Błąd 500 podczas boot**:
  - pokaż retry,
  - loguj do `console.error` (MVP).

## 11. Kroki implementacji
1. **Dodaj warstwę storage sesji**:
   - plik np. `src/lib/auth/session.storage.ts` z funkcjami `getSession()`, `setSession()`, `clearSession()`.
   - klucze w storage (np. `auth.access_token`, `auth.refresh_token`, opcjonalnie `auth.user_email`, `auth.user_id`).
2. **Dodaj typy ViewModel** (np. `src/lib/auth/session.types.ts`) zgodnie z sekcją 5.
3. **Zaimplementuj `SessionProvider`**:
   - trzyma `SessionStateVM`,
   - implementuje `boot()` w strategii `"validate-with-api"`:
     - jeśli brak tokenów → `unauthenticated`,
     - jeśli są → wywołaj `GET /api/recipes?limit=1` z `Authorization`,
     - mapuj `200/401/other`.
4. **Zaimplementuj `SessionBootScreen`**:
   - szybki loader + dostępny tekst statusowy (`role="status"` / `aria-live="polite"`),
   - brak danych użytkownika.
5. **Zaimplementuj `AuthGate`**:
   - przy `unknown` renderuj boot,
   - przy `authenticated`/`unauthenticated` w zależności od `mode`:
     - render `children` albo redirect.
6. **Podepnij gate do routów Astro**:
   - utwórz `src/pages/auth.astro` z rootem React (Auth UI) owiniętym w `SessionProvider` + `AuthGate(mode="require-unauth")`,
   - zaktualizuj `src/pages/index.astro`, żeby zamiast placeholdera renderował root App owinięty w `SessionProvider` + `AuthGate(mode="require-auth")`.
7. **Ujednolić wywołania API pod 401**:
   - dodaj helper `fetchJson`/`apiClient` (np. `src/lib/api/client.ts`) który:
     - automatycznie dodaje `Authorization`,
     - na `401` wywołuje `handleUnauthorized()`.
8. **Doprecyzuj UX komunikatów**:
   - “Ładuję…” dla boot,
   - “Sesja wygasła…” dla 401,
   - “Brak połączenia…” dla błędów sieci.
9. **Checklist bezpieczeństwa i jakości (MVP)**:
   - brak renderowania danych przed `authenticated`,
   - zawsze czyść storage na 401,
   - minimalne logowanie do konsoli dla błędów 5xx.

