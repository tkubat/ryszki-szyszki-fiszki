## Architektura UI dla Ryszki Szyszki Fiszki (Lodówka → Przepis)

## 1. Przegląd struktury UI

### Cel MVP

UI dostarcza dwa główne scenariusze dla **zalogowanego** użytkownika:

- **Generowanie 1 przepisu** z listy składników (min. 3), z czasem odpowiedzi do 60 s, z czytelną obsługą błędów i możliwością ponowienia.
- **Lista “Moje przepisy”** (sort malejąco po `created_at`) z możliwością **polubienia** (toggle) dla każdego przepisu.

### Zasady architektoniczne (wynikające z PRD + decyzji)

- **Authenticated-first**: brak sesji → użytkownik trafia do ekranu logowania/rejestracji, a akcje autoryzowane są blokowane lub przekierowywane (zgodnie z 401 w API).
- **Jeden główny ekran z zakładkami**: zamiast rozbudowanej nawigacji i osobnych stron, użytkownik przełącza się pomiędzy tabami **“Generuj”** i **“Moje przepisy”**.
- **“Podstawy kuchenne” zawsze włączone**: UI nie pokazuje przełącznika; payload generowania wysyła `include_basics: true`.
- **Brak paginacji i filtrów w UI MVP**: mimo że API obsługuje `limit/cursor/liked`, UI w MVP wykonuje pojedyncze pobranie listy.
- **Mobile-first + shadcn/ui**: prosta hierarchia, duże tap-targety, czytelne stany ładowania (loader/skeleton), sensowne komunikaty błędów (inline alert + opcjonalnie toast).

### Stany globalne aplikacji (perspektywa UI)

- **Sesja**: `unknown` (inicjalizacja), `authenticated`, `unauthenticated`.
- **Obsługa 401**: jednolita — wylogowanie lokalne/wyczyszczenie stanu sesji + przekierowanie do Auth.
- **Obsługa błędów sieciowych**: czytelny komunikat i retry dla akcji.

## 2. Lista widoków

Poniżej “widok” oznacza zarówno stronę (route), jak i stan aplikacji będący odrębną powierzchnią UX.

### 2.1 Auth: Logowanie / Rejestracja

- **Nazwa widoku**: Auth
- **Ścieżka widoku**: `/auth` (lub `/login` jako alias; decyzja UX: jeden ekran Auth)
- **Główny cel**: umożliwić **rejestrację** i **logowanie**, aby odblokować funkcje aplikacji.
- **Kluczowe informacje do wyświetlenia**:
  - Nagłówek produktu i krótkie wyjaśnienie (“Zaloguj się, aby zapisywać i polubić przepisy”).
  - Stany błędu (np. błędne dane, email zajęty, błąd walidacji, błąd sieci).
- **Kluczowe komponenty widoku**:
  - **Zakładki Auth**: “Logowanie” / “Rejestracja” (redukcja liczby ekranów i zgodność z decyzją o tabach w MVP).
  - **Formularz logowania**: `email`, `password`, przycisk “Zaloguj”.
  - **Formularz rejestracji**: `email`, `password`, przycisk “Utwórz konto”.
  - **Alert błędu** + (opcjonalnie) **toast** dla błędów sieciowych.
  - Link/akcja “Przejdź do rejestracji/logowania” poprzez przełączenie taba.
- **UX, dostępność i względy bezpieczeństwa**:
  - Etykiety (`label`) i opisy pól; walidacja inline; obsługa klawiatury (tabbing, enter).
  - Nie ujawniać zbyt szczegółowych przyczyn błędów auth w copy (bezpieczeństwo), ale zachować użyteczność (“Nieprawidłowy email lub hasło”).
  - Po sukcesie logowania/rejestracji: przekierowanie do **głównego widoku** oraz inicjalizacja stanu sesji.

### 2.2 App: Główny widok z zakładkami

- **Nazwa widoku**: App Shell
- **Ścieżka widoku**: `/` (chroniony) lub `/app` (chroniony; preferowane jeśli chcesz oddzielić landing od app)
- **Główny cel**: zapewnić stały layout + przełączanie tabów “Generuj” / “Moje przepisy” oraz akcje sesyjne.
- **Kluczowe informacje do wyświetlenia**:
  - Nazwa produktu.
  - Stan sesji (zalogowany email lub skrót).
  - Akcja “Wyloguj”.
- **Kluczowe komponenty widoku**:
  - **Header** (sticky na mobile): tytuł + przycisk “Wyloguj”.
  - **Tabs**: “Generuj”, “Moje przepisy” (domyślnie “Generuj”).
  - **Obszar treści taba** (renderuje widoki 2.3 / 2.4).
- **UX, dostępność i względy bezpieczeństwa**:
  - Guard: gdy brak sesji → przekierowanie do `/auth` i brak renderowania danych użytkownika.
  - Komponent Tabs dostępny z klawiatury (strzałki / tab), poprawne aria-role dla tablist.
  - Wylogowanie: po 204 z API lub po wykryciu 401 (sesja wygasła) użytkownik wraca do Auth.

### 2.3 Tab “Generuj”

- **Nazwa widoku**: Generate Tab
- **Ścieżka widoku**: wewnątrz App Shell (tab; opcjonalnie deep-link: `/?tab=generate`)
- **Główny cel**: zebrać listę składników i wygenerować **1 przepis**, pokazać wynik i umożliwić “Generuj kolejny”.
- **Kluczowe informacje do wyświetlenia**:
  - Hint formatu: “Wpisz składniki rozdzielone przecinkami (min. 3)”.
  - Stany: walidacja, generowanie (loader), wynik (tytuł + kroki), błąd/timeout.
  - (Opcjonalnie) informacja o czasie generowania `generation_time_ms` jako dane pomocnicze.
- **Kluczowe komponenty widoku**:
  - **Textarea składników** + przykładowy placeholder.
  - **Walidacja min. 3 składniki**: komunikat inline (przed wysłaniem do API).
  - **CTA “Generuj przepis”**.
  - **Stan generowania**:
    - blokada powtórnych submitów,
    - loader/skeleton w miejscu wyniku.
  - **Karta wyniku przepisu**:
    - `title`,
    - `steps` (czytelne formatowanie: lista numerowana lub podział po nowych liniach).
  - **CTA “Generuj kolejny”**:
    - resetuje wynik i stan błędów,
    - umożliwia wpisanie nowych składników (zgodnie z decyzją).
  - **Komunikat błędu** + “Spróbuj ponownie”:
    - zachowuje wpisane składniki (wymóg PRD).
- **UX, dostępność i względy bezpieczeństwa**:
  - Po błędzie walidacji: fokus na textarea, a komunikat powiązany z polem (`aria-describedby`).
  - W trakcie generowania: informacja statusowa dla czytników ekranu (np. “Generuję przepis…”).
  - Błędy API mapowane na przyjazne copy:
    - `400`: “Podaj co najmniej 3 składniki w formacie oddzielonym przecinkami.”
    - `408`: “Generowanie trwało zbyt długo. Spróbuj ponownie.”
    - `502`: “Usługa generowania jest chwilowo niedostępna. Spróbuj ponownie.”
    - `401`: wyjście do Auth.
  - Payload zgodny z decyzją: zawsze `include_basics: true` (brak przełącznika w UI).

### 2.4 Tab “Moje przepisy”

- **Nazwa widoku**: Recipes Tab
- **Ścieżka widoku**: wewnątrz App Shell (tab; opcjonalnie deep-link: `/?tab=recipes`)
- **Główny cel**: pokazać listę zapisanych przepisów zalogowanego użytkownika oraz umożliwić polubienie (toggle).
- **Kluczowe informacje do wyświetlenia**:
  - Lista przepisów w kolejności od najnowszych.
  - Dla elementu: tytuł, data (czytelnie sformatowana), status polubienia.
  - Stany: ładowanie listy, brak danych (empty state), błąd pobrania.
- **Kluczowe komponenty widoku**:
  - **Loader/Skeleton listy** przy pierwszym wejściu lub odświeżeniu.
  - **Empty state**: “Nie masz jeszcze zapisanych przepisów” + przycisk “Przejdź do Generuj”.
  - **Lista kart/wierszy przepisu**:
    - tytuł,
    - (opcjonalnie) zajawka kroków lub ukryte szczegóły.
  - **Szczegóły przepisu (kroki)**:
    - decyzja UX dla MVP: **accordion** wewnątrz karty (najprościej, bez osobnych ekranów/modali),
    - zawiera: `ingredients` (wejście) i pełne `steps`.
  - **Toggle polubienia**:
    - optymistyczny: natychmiast zmienia stan w UI,
    - przy błędzie: rollback + komunikat (toast/inline).
- **UX, dostępność i względy bezpieczeństwa**:
  - Akcja toggle dostępna z klawiatury i ma czytelny label (“Polub przepis” / “Cofnij polubienie”).
  - Obsługa błędów:
    - `401` na GET/PATCH → powrót do Auth,
    - `404` na PATCH (rekord usunięty) → odśwież listę i pokaż komunikat.
  - UI w MVP **ignoruje** `limit/cursor/liked` — pobiera pełną listę (zgodnie z decyzją), ale architektura pozwala dodać paginację później.

### 2.5 Widoki/stany techniczne (bezpośrednio wpływające na UX)

- **Nazwa widoku**: Session Boot / Auth Gate
- **Ścieżka widoku**: stan globalny (przed renderem Auth lub App)
- **Główny cel**: rozstrzygnąć, czy istnieje aktywna sesja i gdzie użytkownik ma trafić.
- **Kluczowe informacje do wyświetlenia**: krótki loader (“Ładuję…”), bez migotania UI.
- **Kluczowe komponenty widoku**: ekran ładowania lub skeleton dla App Shell.
- **UX, dostępność i względy bezpieczeństwa**:
  - Brak wycieku danych: dopóki sesja niepotwierdzona, nie renderować treści z danymi użytkownika.

## 3. Mapa podróży użytkownika

### 3.1 Główny przypadek użycia: “Wygeneruj przepis i zapisz go”

1. Użytkownik wchodzi na `/`.
2. **Brak sesji** → przekierowanie do `/auth`.
3. Użytkownik wybiera tab:
   - “Logowanie” (ma konto) lub
   - “Rejestracja” (tworzy konto).
4. Po sukcesie: przejście do App Shell (`/`), domyślnie tab **“Generuj”**.
5. Użytkownik wpisuje składniki w textarea (comma-separated).
6. UI waliduje min. 3 składniki:
   - jeśli < 3 → inline błąd i brak calla do API,
   - jeśli OK → przejście do generowania.
7. UI wywołuje `POST /api/recipes/generate` z `include_basics=true`.
8. W trakcie: loader + blokada submitu.
9. Po sukcesie:
   - UI pokazuje wynik (tytuł + kroki),
   - użytkownik może kliknąć **“Generuj kolejny”** (reset wyniku i błędów).
10. (Opcjonalnie) użytkownik przełącza tab na **“Moje przepisy”** i widzi nowy wpis na górze listy.

### 3.2 Przypadek użycia: “Polub/odlub przepis”

1. Użytkownik przechodzi do taba “Moje przepisy”.
2. UI ładuje listę `GET /api/recipes` (bez query params w MVP).
3. Użytkownik klika toggle polubienia na wybranej pozycji.
4. UI **optymistycznie** zmienia stan `liked` lokalnie.
5. UI wysyła `PATCH /api/recipes/{id}` z docelową wartością `liked`.
6. Jeśli sukces → UI utrzymuje stan.
7. Jeśli błąd → rollback + komunikat, a w razie 401 → powrót do Auth.

### 3.3 Przypadek użycia: “Błąd/timeout generowania”

1. Użytkownik wysyła generowanie.
2. API zwraca `408` lub `502` (albo błąd sieci).
3. UI pokazuje komunikat “Spróbuj ponownie” i **nie czyści** wpisanych składników.
4. Użytkownik ponawia akcję bez ponownego wpisywania.

## 4. Układ i struktura nawigacji

### 4.1 Struktura routingu (proponowana)

- `/auth`:
  - ekran logowania/rejestracji (taby Auth).
- `/` (lub `/app`):
  - App Shell z tabami “Generuj” i “Moje przepisy”,
  - dostęp wyłącznie dla zalogowanych (guard w middleware/UI).

### 4.2 Nawigacja wewnątrz App Shell

- Główna nawigacja: **Tabs** (2 zakładki).
- Z taba “Moje przepisy” w empty state: przycisk “Przejdź do Generuj” przełącza tab na “Generuj”.
- Globalny przycisk “Wyloguj” w headerze.

### 4.3 Zasady przekierowań (bezpieczeństwo i spójność UX)

- Brak sesji na wejściu do `/` → przekierowanie do `/auth`.
- `401` z endpointów autoryzowanych:
  - UI czyści stan użytkownika,
  - przekierowuje do `/auth`,
  - pokazuje krótki komunikat (“Sesja wygasła. Zaloguj się ponownie.”).

## 5. Kluczowe komponenty

- **`AuthGate` / `SessionProvider`**: globalne źródło prawdy o stanie sesji (unknown/authenticated/unauthenticated) + spójna reakcja na 401.
- **`AppShell`**: layout (header + tabs + content), wspólny dla obu funkcji MVP.
- **`AuthTabs` + `LoginForm` + `SignupForm`**: spójny UX dla logowania/rejestracji, wspólne komunikaty błędów i walidacja.
- **`GenerateRecipeForm`**: textarea, walidacja min. 3 składniki, submit, blokady, zachowanie inputu przy błędach.
- **`RecipeResultCard`**: prezentacja `title` + `steps`, CTA “Generuj kolejny”.
- **`RecipesList`**: loader/empty/error + render listy w kolejności z API.
- **`RecipeListItem / RecipeCard`**: tytuł + data + rozwijane szczegóły (accordion) + `LikeToggle`.
- **`LikeToggle` (optymistyczny)**: szybka reakcja UI + obsługa rollbacku i komunikatu błędu.
- **`InlineAlert` + `Toast`**: jednolite wzorce komunikowania błędów (inline dla błędów formularza/akcji, toast dla zdarzeń globalnych).
- **`LoadingState` / `Skeletons`**: stany ładowania dla Auth Gate, Generuj i Moje przepisy (mobile-first).

## 6. Zgodność z API (mapowanie endpointów → powierzchnie UI)

- **`POST /api/auth/signup`** → `SignupForm` w `/auth`:
  - sukces: przejście do App Shell,
  - błędy: inline alert (np. 409 “Email już istnieje”).
- **`POST /api/auth/login`** → `LoginForm` w `/auth`:
  - sukces: przejście do App Shell,
  - błędy: inline alert (401 “Błędne dane”).
- **`POST /api/auth/logout`** → przycisk “Wyloguj” w `AppShell`:
  - sukces: powrót do `/auth`.
- **`POST /api/recipes/generate`** → tab “Generuj”:
  - request: `{ ingredients, include_basics: true }`,
  - success: render `RecipeResultCard`,
  - errors: 400/408/502/401 → komunikaty + retry.
- **`GET /api/recipes`** → tab “Moje przepisy”:
  - w MVP bez `limit/cursor/liked`,
  - success: render listy,
  - errors: 401 → Auth, inne → retry.
- **`PATCH /api/recipes/{id}`** → `LikeToggle` w “Moje przepisy”:
  - request: `{ liked: boolean }`,
  - success: utrzymanie stanu,
  - errors: rollback + komunikat; 401 → Auth.

## 7. Mapowanie historyjek użytkownika (PRD) → UI

- **US-001 Rejestracja konta** → `/auth` → tab “Rejestracja” → `SignupForm` + komunikaty błędów.
- **US-002 Logowanie** → `/auth` → tab “Logowanie” → `LoginForm` + przekierowanie do App Shell.
- **US-003 Minimalna liczba składników** → tab “Generuj” → walidacja inline min. 3 (przed wywołaniem API).
- **US-004 Dodanie listy składników i generowanie** → tab “Generuj” → textarea + CTA + loader + wynik.
- **US-005 Uwzględnienie podstaw kuchennych** → tab “Generuj” → brak przełącznika; stałe `include_basics=true`.
- **US-006 Obsługa błędu/timeoutu** → tab “Generuj” → inline alert “spróbuj ponownie” + zachowanie inputu + retry.
- **US-007 Automatyczne zapisanie przepisu** → konsekwencja `POST /api/recipes/generate` (UI nie wymaga dodatkowej akcji); potwierdzenie pośrednie: przepis pojawia się w “Moje przepisy”.
- **US-008 Przegląd zapisanych przepisów** → tab “Moje przepisy” → lista sortowana malejąco + stany loading/empty/error.
- **US-009 Polubienie przepisu** → tab “Moje przepisy” → `LikeToggle` optymistyczny + zapis przez PATCH.
- **US-010 Nawigacja między generowaniem a listą zapisów** → Tabs “Generuj” / “Moje przepisy” + przycisk w empty state.
- **US-011 Bezpieczny dostęp do zapisów** → `AuthGate` + przekierowania + obsługa 401 + brak renderu danych bez sesji.

## 8. Wymagania → elementy UI (jawne mapowanie)

- **Min. 3 składniki** → walidacja w `GenerateRecipeForm` + komunikat inline.
- **Czas do 60 s** → loader + copy “To może potrwać do minuty…” + obsługa 408.
- **Brak utraty inputu przy błędzie** → stan textarea niezależny od wyniku; nie resetować przy błędach.
- **Automatyczny zapis** → brak “Zapisz” w UI; informacja pośrednia przez listę “Moje przepisy”.
- **Lista sortowana po `created_at DESC`** → UI zakłada sort dostarczony przez API; nie miesza kolejności lokalnie (poza optymistycznymi aktualizacjami).
- **Polubienie (toggle)** → `LikeToggle` optymistyczny z rollbackiem.
- **Dostęp tylko po zalogowaniu** → `AuthGate` + jednolita obsługa 401.

## 9. Przypadki brzegowe i stany błędów (UI)

- **Sesja wygasa w trakcie** (dowolne `401`):
  - natychmiastowy powrót do `/auth`,
  - komunikat “Sesja wygasła…”.
- **Podwójny klik “Generuj”**:
  - blokada submitu podczas `isGenerating=true`.
- **Błąd sieci / offline**:
  - komunikat i retry; brak “wiszących” loaderów.
- **Timeout generowania (408)**:
  - zachowanie inputu; prosty retry.
- **Błąd dostawcy AI (502)**:
  - neutralny komunikat; retry; bez “technicznych” szczegółów.
- **Pusta lista przepisów**:
  - empty state + CTA do taba “Generuj”.
- **PATCH liked niepowodzenie**:
  - rollback optymistyczny + toast/alert.
- **Rekord zniknął (404)**:
  - odśwież listę i pokaż komunikat (przepis niedostępny).

