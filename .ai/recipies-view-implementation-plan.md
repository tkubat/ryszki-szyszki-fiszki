## Plan implementacji widoku Recipes Tab („Moje przepisy”)

## 1. Przegląd
Widok **„Moje przepisy”** (tab w App Shell) prezentuje listę przepisów zapisanych dla **zalogowanego** użytkownika, posortowanych malejąco po `created_at`, oraz umożliwia **polubienie/odlubienie** przepisu (toggle `liked`) z optymistyczną aktualizacją w UI. Widok musi obsłużyć stany: ładowanie, brak danych, błąd pobrania oraz błąd zapisu polubienia (w tym `401` i `404`).

## 2. Routing widoku
- **Docelowa lokalizacja**: wewnątrz App Shell (tab).
- **Deep-link (opcjonalnie)**: `/?tab=recipes` (zgodnie z `.ai/ui-plan.md`).
- **Wymóg bezpieczeństwa**: widok dostępny tylko dla `authenticated`:
  - brak sesji / `401` z API → przekierowanie do `/auth` (lub ekranu Auth zgodnie z architekturą aplikacji).

## 3. Struktura komponentów
### Proponowany podział plików (React w `src/components`)
- `src/components/recipes/RecipesTab.tsx` – kontener taba „Moje przepisy”
- `src/components/recipes/RecipesList.tsx` – lista + stany (loading/empty/error)
- `src/components/recipes/RecipeCard.tsx` – pojedynczy element listy (karta)
- `src/components/recipes/RecipeDetails.tsx` – sekcja rozwijana (ingredients + steps)
- `src/components/recipes/LikeToggleButton.tsx` – przycisk toggle `liked`
- `src/components/recipes/RecipesListSkeleton.tsx` – skeleton ładowania listy
- `src/components/recipes/RecipesEmptyState.tsx` – empty state + CTA „Przejdź do Generuj”
- `src/lib/api/apiClient.ts` – wrapper na `fetch` (Authorization + obsługa błędów)
- `src/lib/api/recipesApi.ts` – funkcje: `fetchAllRecipes`, `patchRecipeLiked`
- `src/lib/hooks/useRecipes.ts` – hook: pobieranie listy + refetch
- `src/lib/hooks/useToggleRecipeLiked.ts` – hook: optymistyczny toggle + rollback

### Diagram drzewa komponentów (wysoki poziom)
- `AppShell` (poza zakresem tego widoku, ale hostuje tab)
  - `Tabs` (Generuj / Moje przepisy)
    - `RecipesTab`
      - `RecipesList`
        - `RecipesListSkeleton` (gdy `isLoading`)
        - `RecipesEmptyState` (gdy `recipes.length === 0`)
        - `ErrorState` (gdy `error !== null`)
        - `ul` listy
          - `RecipeCard` (xN)
            - `LikeToggleButton`
            - `RecipeDetails` (accordion/collapsible)

## 4. Szczegóły komponentów
### `RecipesTab`
- **Opis komponentu**: kontener taba; inicjuje pobranie listy, obsługuje refetch po akcjach (np. po `404` z PATCH).
- **Główne elementy**:
  - wrapper sekcji (`section`, `header` z tytułem)
  - `RecipesList` jako child
- **Obsługiwane zdarzenia**:
  - `onMount`/`useEffect`: pobranie listy
  - `onRetry`: ponowienie pobrania listy (z `RecipesList`)
  - `onGoToGenerate`: przełączenie taba na „Generuj” (callback do App Shell)
- **Walidacja**:
  - brak walidacji formularzowej; precondition: użytkownik zalogowany
- **Typy**:
  - `RecipesListResponseDTO`, `RecipeDTO`
  - `RecipesTabViewModel` (nowy, patrz sekcja 5)
- **Propsy**:

```ts
export interface RecipesTabProps {
  onNavigateToGenerate: () => void;
  onUnauthorized: () => void; // globalny handler: wyczyść sesję + przejście do /auth
}
```

### `RecipesList`
- **Opis komponentu**: renderuje stan listy; nie robi fetchowania samodzielnie (dostaje dane i status z hooka/rodzica).
- **Główne elementy**:
  - `RecipesListSkeleton` dla ładowania
  - `RecipesEmptyState` dla braku danych
  - Alert/komunikat błędu (inline) + przycisk „Spróbuj ponownie”
  - lista `ul` z elementami `RecipeCard`
- **Obsługiwane zdarzenia**:
  - `onRetryClick`
  - `onToggleLiked(recipeId, nextLiked)`
  - `onNavigateToGenerate`
- **Walidacja**:
  - warunki renderowania zależne od `isLoading`, `error`, `recipes.length`
- **Typy**:
  - `RecipeCardViewModel[]`
  - `RecipesListErrorViewModel` (nowy, do mapowania błędów na copy)
- **Propsy**:

```ts
export interface RecipesListProps {
  isLoading: boolean;
  error: RecipesListErrorViewModel | null;
  recipes: RecipeCardViewModel[];
  onRetry: () => void;
  onToggleLiked: (recipeId: string, nextLiked: boolean) => void;
  onNavigateToGenerate: () => void;
}
```

### `RecipeCard`
- **Opis komponentu**: wyświetla tytuł, datę i toggle polubienia; zawiera rozwijalne szczegóły przepisu.
- **Główne elementy** (Shadcn/UI + semantyka):
  - `Card` (kontener)
  - `CardHeader`: `h3` tytuł + data
  - `LikeToggleButton`
  - `CardContent`: `RecipeDetails` w formie accordion/collapsible
- **Obsługiwane zdarzenia**:
  - kliknięcie toggle polubienia
  - rozwinięcie/zwiniecie szczegółów
- **Walidacja**:
  - brak, poza ochroną przed `undefined` w polach (defensive render)
- **Typy**:
  - `RecipeCardViewModel`
- **Propsy**:

```ts
export interface RecipeCardProps {
  recipe: RecipeCardViewModel;
  onToggleLiked: (recipeId: string, nextLiked: boolean) => void;
}
```

### `RecipeDetails`
- **Opis komponentu**: szczegóły przepisu w accordionie: `ingredients` (wejście/łączna lista) i `steps` (wielolinijkowy tekst).
- **Główne elementy**:
  - Accordion/Collapsible (Radix/shadcn): trigger „Pokaż szczegóły”
  - Sekcja „Składniki” – tekst (z łamaniem linii)
  - Sekcja „Kroki” – preferowane formatowanie:
    - jeśli `steps` zawiera nowe linie: podziel na listę numerowaną
    - w przeciwnym razie: render jako akapit z `whitespace-pre-line`
- **Obsługiwane zdarzenia**:
  - `onExpandedChange` (opcjonalnie do analityki/UX)
- **Walidacja**:
  - brak; formatowanie powinno działać dla pustych/niestandardowych danych, ale pola są `NOT NULL` po stronie DB/API
- **Typy**:
  - `RecipeDetailsViewModel` (część `RecipeCardViewModel`)
- **Propsy**:

```ts
export interface RecipeDetailsProps {
  ingredients: string;
  steps: string;
}
```

### `LikeToggleButton`
- **Opis komponentu**: dostępny przycisk do polubienia/odlubienia przepisu, z optymistycznym odzwierciedleniem stanu w UI.
- **Główne elementy**:
  - `Button` (np. `variant="ghost"`) + ikona z `lucide-react` (np. `ThumbsUp`)
  - `aria-pressed={liked}` i `aria-label` zależny od stanu
- **Obsługiwane zdarzenia**:
  - `onClick` → `onToggle(nextLiked)`
- **Walidacja**:
  - guard: gdy `isPending` (trwa request) → blokada kliku lub throttle
- **Typy**:
  - brak nowych DTO; używa `liked: boolean`
- **Propsy**:

```ts
export interface LikeToggleButtonProps {
  liked: boolean;
  isPending?: boolean;
  onToggle: (nextLiked: boolean) => void;
}
```

### `RecipesEmptyState`
- **Opis komponentu**: komunikat „Nie masz jeszcze zapisanych przepisów” oraz CTA do przejścia do „Generuj”.
- **Główne elementy**:
  - tekst + `Button` „Przejdź do Generuj”
- **Obsługiwane zdarzenia**:
  - `onNavigateToGenerate`
- **Walidacja**: brak
- **Typy**: brak
- **Propsy**:

```ts
export interface RecipesEmptyStateProps {
  onNavigateToGenerate: () => void;
}
```

### `RecipesListSkeleton`
- **Opis komponentu**: szkielet listy przy pierwszym wejściu lub refetchu.
- **Główne elementy**:
  - proste placeholdery na tytuł/daty/ikonę w układzie zbliżonym do `RecipeCard`
- **Obsługiwane zdarzenia**: brak
- **Walidacja**: brak
- **Typy**: brak
- **Propsy**:

```ts
export interface RecipesListSkeletonProps {
  items?: number; // domyślnie np. 6
}
```

## 5. Typy
### Typy istniejące (DTO z backendu) – używane bez zmian
- **`RecipeDTO`**: `{ id, title, ingredients, steps, liked, created_at }`
- **`RecipesListResponseDTO`**: `{ data: RecipeDTO[]; next_cursor: RecipeCreatedAt | null }`
- **`UpdateRecipeLikedCommand`**: `{ liked: boolean }`
- **`GetRecipesQuery`**: `{ limit?: number; cursor?: RecipeCreatedAt; liked?: boolean }`

### Nowe typy ViewModel (frontend)
#### `RecipeCardViewModel`
Cel: gotowe do renderu dane dla `RecipeCard`.

```ts
export interface RecipeCardViewModel {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  liked: boolean;
  createdAtISO: string; // z API
  createdAtLabel: string; // sformatowana data do UI
}
```

#### `RecipesTabViewModel`
Cel: stan ekranu i dane dla listy.

```ts
export interface RecipesTabViewModel {
  recipes: RecipeCardViewModel[];
  isLoading: boolean;
  error: RecipesListErrorViewModel | null;
}
```

#### `RecipesListErrorViewModel`
Cel: ujednolicone mapowanie błędów API/sieci na copy.

```ts
export type RecipesListErrorKind =
  | "UNAUTHORIZED"
  | "NETWORK"
  | "SERVER"
  | "BAD_REQUEST"
  | "UNKNOWN";

export interface RecipesListErrorViewModel {
  kind: RecipesListErrorKind;
  message: string; // gotowe copy dla użytkownika
  status?: number;
  code?: string; // np. z payload { error: { code } }
}
```

#### `ToggleLikedErrorViewModel`
Cel: osobny error model dla akcji toggle (toast/inline).

```ts
export type ToggleLikedErrorKind = "UNAUTHORIZED" | "NOT_FOUND" | "NETWORK" | "SERVER" | "UNKNOWN";

export interface ToggleLikedErrorViewModel {
  kind: ToggleLikedErrorKind;
  message: string;
  status?: number;
  code?: string;
  recipeId: string;
}
```

## 6. Zarządzanie stanem
### Stan w komponencie / hookach
Rekomendacja: trzymać logikę w hookach, a komponenty możliwie „głupie”.

- **`useRecipes()`**:
  - `recipes: RecipeDTO[]` lub już `RecipeCardViewModel[]`
  - `isLoading: boolean`
  - `error: RecipesListErrorViewModel | null`
  - `refetch(): Promise<void>`
- **`useToggleRecipeLiked()`**:
  - przyjmuje `setRecipes` lub callback `updateRecipeOptimistic(recipeId, nextLiked)`
  - zwraca `toggle(recipeId, nextLiked): Promise<void>` i `pendingIds: Set<string>`
  - wykonuje rollback przy błędzie i zwraca/broadcastuje `ToggleLikedErrorViewModel` (np. do toast/inline)

### Sugerowany przepływ danych
- `RecipesTab`:
  - wywołuje `useRecipes({ onUnauthorized })`
  - mapuje `RecipeDTO[]` → `RecipeCardViewModel[]` (format daty)
  - przekazuje do `RecipesList`
- `RecipesList`:
  - renderuje listę, przekazuje `onToggleLiked` do `RecipeCard`
- `LikeToggleButton`:
  - lokalnie tylko UI state (pressed/pending) sterowany propsami

## 7. Integracja API
### Wymagania dot. autoryzacji (krytyczne)
Middleware backendu oczekuje nagłówka:
- `Authorization: Bearer <access_token>`

Frontend musi:
- przechowywać `access_token` po login/signup (np. w pamięci + localStorage),
- dołączać go do każdego requestu do `/api/recipes` i `/api/recipes/:id`,
- na `401` wykonać globalny flow: wyczyść sesję i przejdź do `/auth`.

### `GET /api/recipes`
- **Cel (MVP)**: pobrać wszystkie przepisy (UI ignoruje filtry).
- **Kontrakt**:
  - Query: `GetRecipesQuery` (opcjonalnie)
  - Response: `RecipesListResponseDTO`
- **Rekomendowana implementacja pobrania „całości”**:
  - użyć `limit=100` (MAX_LIMIT z API) i wykonywać kolejne requesty z `cursor=next_cursor` aż `next_cursor === null`.
  - złożyć `data` w jedną tablicę w pamięci, zachowując kolejność.
- **Błędy**:
  - `401` → `onUnauthorized()`
  - `400` → błąd logiczny po stronie FE (złe query); pokaż komunikat i loguj szczegóły
  - inne → komunikat „Nie udało się pobrać przepisów. Spróbuj ponownie.”

### `PATCH /api/recipes/:id`
- **Cel**: zapisać `liked` (toggle).
- **Request**: `UpdateRecipeLikedCommand` (`{ liked: boolean }`)
- **Response**: `RecipeDTO`
- **Błędy (wg API i UI planu)**:
  - `401` → `onUnauthorized()`
  - `404` → rekord usunięty/nie istnieje:
    - rollback optymistycznej zmiany,
    - `refetch()` listy,
    - komunikat „Ten przepis nie jest już dostępny. Lista została odświeżona.”
  - `400` → błąd payloadu (nie powinno wystąpić przy poprawnym typowaniu)
  - `500` → komunikat „Nie udało się zapisać polubienia. Spróbuj ponownie.”

## 8. Interakcje użytkownika
- **Wejście w tab „Moje przepisy”**:
  - UI pokazuje skeleton listy
  - UI pobiera listę; po sukcesie renderuje karty
- **Kliknięcie w „Pokaż szczegóły”**:
  - rozwija sekcję z `ingredients` i `steps`
- **Kliknięcie „Polub” / „Cofnij polubienie”**:
  - natychmiastowa zmiana stanu ikony (optimistic)
  - request `PATCH`
  - przy błędzie: rollback + komunikat (toast lub inline przy danej karcie)
- **Kliknięcie „Spróbuj ponownie” w stanie błędu listy**:
  - `refetch()` i ponowne stany ładowania
- **Kliknięcie „Przejdź do Generuj” w empty state**:
  - przełączenie taba na „Generuj” (bez przeładowania strony)

## 9. Warunki i walidacja
### Warunki wynikające z API (i ich weryfikacja w UI)
- **Autoryzacja**:
  - warunek: requesty do `/api/recipes*` muszą mieć `Authorization: Bearer <token>`
  - weryfikacja: jeśli brak tokenu w kliencie → nie wykonuj requestu, od razu `onUnauthorized()`
- **GET query params** (jeśli używane):
  - `limit`:
    - int, `1..100` (UI powinien trzymać stałą `const RECIPES_PAGE_LIMIT = 100`)
  - `cursor`:
    - ISO8601 z offsetem (z API przychodzi `created_at`, więc używaj wartości `next_cursor` bez modyfikacji)
  - `liked`:
    - w MVP nie wysyłamy (brak filtrów)
- **PATCH payload**:
  - `liked` musi być boolean (w TS zapewnić typem)
  - `id` musi być UUID (w TS zapewnić przez `RecipeDTO['id']`; w runtime nie walidować, ale defensywnie obsłużyć `400`)

### Warunki renderowania UI
- `isLoading === true` → `RecipesListSkeleton`
- `error !== null` → error state + retry
- `recipes.length === 0` → `RecipesEmptyState`
- w przeciwnym razie → render listy

## 10. Obsługa błędów
### Scenariusze błędów i rekomendowane reakcje
- **`401 UNAUTHORIZED` (GET/PATCH)**:
  - wyczyść lokalny stan sesji (tokeny)
  - przekieruj do `/auth`
  - (opcjonalnie) pokaż komunikat: „Sesja wygasła. Zaloguj się ponownie.”
- **Błąd sieci (`TypeError` z fetch / offline)**:
  - dla listy: inline alert „Brak połączenia. Spróbuj ponownie.”
  - dla toggle: toast/inline przy karcie + rollback
- **`404 NOT_FOUND` na PATCH**:
  - rollback
  - refetch listy
  - komunikat: „Ten przepis nie jest już dostępny.”
- **`500+`**:
  - list: „Nie udało się pobrać przepisów.”
  - toggle: „Nie udało się zapisać polubienia.”
- **`400`**:
  - traktować jako błąd programistyczny (złe parametry/payload); pokazać ogólny komunikat, a szczegóły logować w `console.error`

## 11. Kroki implementacji
1. **Utwórz client API** w `src/lib/api/apiClient.ts`:
   - funkcja `apiFetch(input, init, { accessToken, onUnauthorized })`
   - zawsze ustawia `Content-Type: application/json` dla JSON
   - dokleja `Authorization` jeśli token jest dostępny
   - parsuje odpowiedź `{ error: { code, message, details } }` i mapuje na VM error
2. **Dodaj warstwę recipes API** w `src/lib/api/recipesApi.ts`:
   - `fetchRecipesPage({ limit, cursor }, ctx): Promise<RecipesListResponseDTO>`
   - `fetchAllRecipes(ctx): Promise<RecipeDTO[]>` (pętla po `next_cursor`)
   - `patchRecipeLiked(recipeId, liked, ctx): Promise<RecipeDTO>`
3. **Zaimplementuj hook `useRecipes`**:
   - obsługa `isLoading/error/data`
   - `refetch()` z abortowaniem poprzedniego requestu (opcjonalnie)
4. **Zaimplementuj hook `useToggleRecipeLiked`**:
   - optymistyczna zmiana `liked` dla danego `recipeId`
   - wysyłka `PATCH`
   - rollback + error handling (w tym `404` → `refetch`)
5. **Zbuduj komponenty UI**:
   - `RecipesTab` – spina hooki i przekazuje propsy
   - `RecipesList` – render stanów + lista
   - `RecipeCard` – tytuł, data, toggle + `RecipeDetails`
   - `RecipeDetails` – accordion/collapsible i czytelne formatowanie `steps`
   - `RecipesEmptyState` i `RecipesListSkeleton`
6. **Dodaj brakujące komponenty shadcn/ui (jeśli potrzebne)** w `src/components/ui/`:
   - `accordion` lub `collapsible`, `alert`, `skeleton`, ewentualnie `tabs`
   - dopilnuj a11y: role/aria zgodnie z Radix
7. **Integracja z App Shell**:
   - App Shell przekazuje do `RecipesTab`:
     - `onNavigateToGenerate` (switch taba)
     - `onUnauthorized` (globalny redirect do `/auth`)
   - (opcjonalnie) obsłuż query param `tab=recipes` do ustawienia taba przy wejściu
8. **Testy manualne (checklista)**:
   - użytkownik bez tokenu → wejście na tab kończy się przejściem do `/auth`
   - użytkownik z tokenem i pustą listą → empty state + CTA
   - lista z danymi → render kart w kolejności od najnowszych
   - toggle liked działa optymistycznie i utrzymuje się po refreshu
   - wymuś `404` na PATCH → rollback + refetch + komunikat
   - symuluj offline → poprawne komunikaty i retry

