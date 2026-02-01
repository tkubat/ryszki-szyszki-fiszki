## Plan implementacji widoku Generate Tab (“Generuj”)

### 1. Przegląd
Widok “Generuj” umożliwia zalogowanemu użytkownikowi wpisanie listy składników (min. 3), wywołanie generowania przepisu przez API, prezentację wyniku (tytuł + kroki) oraz szybkie rozpoczęcie kolejnego generowania bez utraty wpisanych danych przy błędach.

### 2. Routing widoku
- Widok działa **wewnątrz chronionego App Shell** (tabs) na stronie:
  - preferowane: `/app?tab=generate` (jeśli App Shell jest na `/app`)
  - alternatywnie: `/?tab=generate` (jeśli App Shell jest na `/`)
- Warunek dostępu: **wymagana sesja**. Brak sesji lub `401` z API → przekierowanie do `/auth` (zgodnie z zasadą Authenticated-first).

### 3. Struktura komponentów
Zakładamy implementację w React (Astro island) w ramach App Shell.

- `AppShell` (istniejący / równoległy plan)
  - `Tabs`
    - `GenerateTab` (nowy, ten plan)
      - `GenerateRecipeForm`
        - `IngredientsTextareaField`
        - `GenerateSubmitButton`
        - `InlineFieldError` (dla walidacji)
      - `GenerateStatusArea`
        - `GeneratingSkeleton` (lub loader)
        - `GenerateErrorAlert` + `RetryButton`
        - `RecipeResultCard`
          - `RecipeStepsRenderer`
          - `GenerateAnotherButton`
          - `GenerationMeta` (opcjonalnie: `generation_time_ms`)

### 4. Szczegóły komponentów

#### GenerateTab
- **Opis komponentu**: Kontener taba “Generuj”, trzyma stan formularza, uruchamia wywołanie API, renderuje stany (idle/loading/success/error) oraz przekazuje callbacki do dzieci.
- **Główne elementy**:
  - wrapper (np. `div` z max-width i spacingiem Tailwind),
  - sekcja formularza,
  - sekcja statusu/wyniku.
- **Obsługiwane zdarzenia**:
  - `onSubmit` z formularza (generowanie),
  - `onRetry` (ponowienie),
  - `onGenerateAnother` (reset wyniku i błędów).
- **Warunki walidacji (UI)**:
  - min. 3 składniki po splitowaniu (patrz sekcja 9),
  - max długość wejścia 2000 znaków (zgodne z API),
  - trimming (nie pozwalaj wysłać pustego/whitespace-only),
  - blokada wielokrotnego submitu podczas requestu.
- **Typy**:
  - używa DTO: `GenerateRecipeCommand`, `GenerateRecipeResponseDTO`, `RecipeDTO`,
  - ViewModel: `GenerateRecipeViewState`, `GenerateRecipeErrorVM`, `RecipeStepsVM`.
- **Propsy**:
  - (opcjonalnie) `onUnauthorized?: () => void` jeśli App Shell deleguje obsługę 401,
  - (opcjonalnie) `defaultIngredients?: string` gdybyś wspierał deep-link lub prefill.

#### GenerateRecipeForm
- **Opis komponentu**: Formularz zbierający `ingredients` i uruchamiający generowanie. Nie renderuje wyniku (tylko input + CTA + ewentualny błąd walidacji pola).
- **Główne elementy**:
  - `form`,
  - `label` + `textarea` (shadcn: `Textarea` lub natywny `textarea` ze стилami),
  - tekst pomocniczy: “Wpisz składniki rozdzielone przecinkami (min. 3)”,
  - CTA “Generuj przepis”.
- **Obsługiwane zdarzenia**:
  - `onChangeIngredients(value: string)` – aktualizacja stanu inputu,
  - `onSubmit()` – próba generowania,
  - obsługa Enter: nie wysyłać przypadkiem (textarea), chyba że użytkownik kliknie CTA.
- **Warunki walidacji**:
  - w momencie submitu (oraz opcjonalnie “na blur”): min 3 składniki,
  - w momencie submitu: długość ≤ 2000,
  - komunikat inline powiązany z polem przez `aria-describedby`,
  - po błędzie walidacji: fokus na textarea.
- **Typy**:
  - ViewModel: `GenerateRecipeFormVM` (wartość + błąd pola),
  - DTO: `GenerateRecipeCommand` (na wyjściu z hooka/handlera).
- **Propsy (interfejs)**:
  - `ingredients: string`
  - `isSubmitting: boolean`
  - `fieldError?: string | null`
  - `onIngredientsChange: (value: string) => void`
  - `onSubmit: () => void`

#### IngredientsTextareaField
- **Opis komponentu**: Samo pole textarea z labelką, hintem i powiązaniem błędu.
- **Główne elementy**:
  - `label`,
  - `textarea` (autofocus opcjonalny),
  - `p` hint,
  - `p` error.
- **Obsługiwane zdarzenia**:
  - `onChange`,
  - `onBlur` (opcjonalnie walidacja).
- **Warunki walidacji**:
  - brak własnej logiki biznesowej; wyświetla `fieldError`.
- **Typy**:
  - bez DTO; tylko props.
- **Propsy**:
  - `value: string`
  - `onChange: (value: string) => void`
  - `error?: string | null`
  - `disabled?: boolean`
  - `describedById: string` (dla a11y)

#### GenerateStatusArea
- **Opis komponentu**: Wspólny obszar renderujący: loader/skeleton, błąd API, wynik przepisu.
- **Główne elementy**:
  - warunkowe renderowanie w zależności od `GenerateRecipeViewState.status`.
- **Obsługiwane zdarzenia**:
  - `onRetry`,
  - `onGenerateAnother`.
- **Warunki walidacji**:
  - brak (sterowany stanem rodzica).
- **Typy**:
  - ViewModel: `GenerateRecipeViewState`.
- **Propsy**:
  - `state: GenerateRecipeViewState`
  - `onRetry: () => void`
  - `onGenerateAnother: () => void`

#### GeneratingSkeleton
- **Opis komponentu**: Wizualny stan generowania; blokuje powtórne wysłanie i informuje użytkownika, że operacja może potrwać do 60 s.
- **Główne elementy**:
  - shadcn `Card` + skeletony lub spinner,
  - tekst statusowy + aria-live region.
- **Obsługiwane zdarzenia**: brak.
- **Warunki walidacji**: brak.
- **Typy**: brak.
- **Propsy**:
  - `label?: string` (np. “Generuję przepis…”)

#### GenerateErrorAlert
- **Opis komponentu**: Pokazuje przyjazny komunikat błędu i CTA “Spróbuj ponownie”. Nie czyści wpisanych składników.
- **Główne elementy**:
  - shadcn `Card`/`Alert`,
  - tekst błędu,
  - `RetryButton`.
- **Obsługiwane zdarzenia**:
  - `onRetry`.
- **Warunki walidacji**: brak.
- **Typy**:
  - ViewModel: `GenerateRecipeErrorVM`.
- **Propsy**:
  - `error: GenerateRecipeErrorVM`
  - `onRetry: () => void`

#### RecipeResultCard
- **Opis komponentu**: Prezentuje wygenerowany przepis (tytuł i kroki) oraz akcję “Generuj kolejny”. Opcjonalnie pokazuje `generation_time_ms`.
- **Główne elementy**:
  - shadcn `Card`,
  - nagłówek z `recipe.title`,
  - `RecipeStepsRenderer`,
  - przyciski: “Generuj kolejny”.
- **Obsługiwane zdarzenia**:
  - `onGenerateAnother`.
- **Warunki walidacji**: brak.
- **Typy**:
  - DTO: `RecipeDTO`,
  - ViewModel: `RecipeStepsVM`.
- **Propsy**:
  - `recipe: RecipeDTO`
  - `generationTimeMs?: number`
  - `onGenerateAnother: () => void`

#### RecipeStepsRenderer
- **Opis komponentu**: Renderuje `steps` w czytelnej formie (preferowane: lista numerowana). Powinien być odporny na różny format tekstu z AI.
- **Główne elementy**:
  - `ol` + `li` dla kroków (gdy da się sensownie podzielić),
  - fallback: `div` z paragrafami.
- **Obsługiwane zdarzenia**: brak.
- **Warunki walidacji**:
  - jeśli `steps` puste (nie powinno w MVP, ale defensywnie): pokaż fallback “Brak kroków”.
- **Typy**:
  - ViewModel: `RecipeStepsVM`.
- **Propsy**:
  - `steps: string`

### 5. Typy
Poniższe typy już istnieją w `src/types.ts` i powinny być użyte bez duplikowania:
- **`GenerateRecipeCommand`**
  - `ingredients: string`
  - `include_basics: boolean` (w UI zawsze `true`)
- **`GenerateRecipeResponseDTO`**
  - `recipe: RecipeDTO`
  - `generation_time_ms: number`
- **`RecipeDTO`**
  - `id, title, ingredients, steps, liked, created_at`

Nowe typy ViewModel (rekomendowane do rozdzielenia logiki UI od DTO):
- **`GenerateRecipeStatus`**
  - `"idle" | "submitting" | "success" | "error"`
- **`GenerateRecipeErrorKind`**
  - `"validation" | "unauthorized" | "timeout" | "provider" | "network" | "server" | "unknown"`
- **`GenerateRecipeErrorVM`**
  - `kind: GenerateRecipeErrorKind`
  - `title: string` (krótki nagłówek do UI)
  - `message: string` (przyjazne copy)
  - `retryable: boolean`
  - `httpStatus?: number`
  - `apiCode?: string` (np. `BAD_REQUEST`, `UNAUTHORIZED`, `DATABASE_ERROR`, itd.)
- **`GenerateRecipeViewState`**
  - `status: GenerateRecipeStatus`
  - `ingredients: string`
  - `fieldError: string | null` (błąd walidacji pola)
  - `result: { recipe: RecipeDTO; generation_time_ms: number } | null`
  - `error: GenerateRecipeErrorVM | null`
- **`RecipeStepsVM`** (opcjonalnie)
  - `stepsRaw: string`
  - `stepsList: string[]` (wynik splitowania; może być pusty jeśli niepewne)

### 6. Zarządzanie stanem
Rekomendacja: lokalny stan w `GenerateTab` + custom hook do requestu.

- **Zmienne stanu w `GenerateTab`**:
  - `ingredients: string`
  - `fieldError: string | null`
  - `status: "idle" | "submitting" | "success" | "error"`
  - `result: GenerateRecipeResponseDTO | null`
  - `error: GenerateRecipeErrorVM | null`
- **Custom hook `useGenerateRecipe()`** (rekomendowany):
  - Cel: enkapsulować `fetch`, mapowanie błędów (`401/400/408/502/...`), abort/timeout po stronie klienta (opcjonalnie), oraz zwracać prostą funkcję `mutate`.
  - API hooka:
    - `generate: (cmd: GenerateRecipeCommand) => Promise<GenerateRecipeResponseDTO>`
    - `isLoading: boolean` (opcjonalnie)
  - Obsługa `401`: hook nie powinien sam nawigować (to odpowiedzialność App Shell / routera); zamiast tego zwrócić błąd `kind: "unauthorized"`, a rodzic wykona redirect.

### 7. Integracja API
Endpoint: **`POST /api/recipes/generate`**

- **Request (JSON)**: `GenerateRecipeCommand`
  - `ingredients: string` (wartość z textarea)
  - `include_basics: true` (hard-coded w UI, brak przełącznika)
- **Response (JSON)**: `GenerateRecipeResponseDTO`
  - `recipe`: rekord zapisany w bazie
  - `generation_time_ms`: liczba ms
- **Auth**:
  - API wymaga sesji; brak sesji → `401` z payloadem błędu.
- **Format błędów (z implementacji endpointu)**:
  - response body:
    - `{ "error": { "code": string, "message": string, "details"?: Record<string, unknown> } }`
- **Mapowanie błędów na copy UI** (zgodne z UI planem):
  - `400` → “Podaj co najmniej 3 składniki w formacie oddzielonym przecinkami.”
  - `401` → redirect do `/auth` (+ opcjonalnie toast “Sesja wygasła. Zaloguj się ponownie.”)
  - `408` → “Generowanie trwało zbyt długo. Spróbuj ponownie.”
  - `502` → “Usługa generowania jest chwilowo niedostępna. Spróbuj ponownie.”
  - `500`/`DATABASE_ERROR` → “Nie udało się zapisać przepisu. Spróbuj ponownie.”
  - błąd sieci / aborted → “Brak połączenia lub przerwano żądanie. Spróbuj ponownie.”

### 8. Interakcje użytkownika
- **Wpisywanie składników**:
  - aktualizuje `ingredients` w stanie,
  - nie czyści wyniku automatycznie (chyba że UX zdecyduje inaczej); w MVP bezpieczniej: przy zmianie inputu nie kasować wyniku, dopóki użytkownik nie kliknie “Generuj kolejny” albo ponownie “Generuj przepis”.
- **Klik “Generuj przepis”**:
  - walidacja inputu,
  - jeśli OK: wysłanie requestu i przejście w loading,
  - blokada CTA w trakcie,
  - pokazanie skeleton/loader.
- **Sukces**:
  - render karty wyniku,
  - (opcjonalnie) pokazanie `generation_time_ms`.
- **Klik “Generuj kolejny”**:
  - czyści `result` i `error`, resetuje `status` do idle,
  - nie musi czyścić `ingredients` (zgodnie z “umożliwia wpisanie nowych składników” — decyzja UX: zostaw albo wyczyść; w MVP sugerowane: zostaw, żeby użytkownik mógł szybko edytować).
- **Błąd generowania**:
  - pokazanie `GenerateErrorAlert`,
  - zachowanie `ingredients`,
  - klik “Spróbuj ponownie” ponawia request z bieżącym inputem.

### 9. Warunki i walidacja
Walidacja UI powinna możliwie odzwierciedlać backend:

- **Split składników**:
  - separator: przecinek, średnik lub nowa linia,
  - rekomendowany regex (taki jak w API): `[,;\n]+`,
  - kroki:
    - `ingredients.split(/[,;\n]+/)`
    - `trim()`
    - `filter(Boolean)`
- **Warunki**:
  - min. liczba składników: **≥ 3** (po splitowaniu i odfiltrowaniu pustych),
  - maksymalna długość całego tekstu: **≤ 2000** znaków,
  - tekst niepusty po trimie (UI i tak sprawdza min. 3, ale to zabezpiecza komunikaty).
- **Wpływ na stan UI**:
  - jeśli walidacja nie przejdzie:
    - ustaw `fieldError`,
    - ustaw fokus na textarea,
    - nie wysyłaj requestu,
    - `status` pozostaje `"idle"`.
  - jeśli walidacja przejdzie:
    - wyczyść `fieldError`,
    - przejdź do `"submitting"`.

### 10. Obsługa błędów
- **Błędy walidacji (frontend)**:
  - inline pod polem, bez toastów,
  - fokus + `aria-describedby`.
- **Błędy API (backend)**:
  - mapuj po `status` (i opcjonalnie `error.code`) do `GenerateRecipeErrorVM`,
  - pokaż `GenerateErrorAlert` + CTA retry,
  - nie resetuj inputu.
- **401 Unauthorized**:
  - natychmiast przerwij bieżący flow UI,
  - wykonaj redirect do `/auth`,
  - opcjonalnie: globalny toast “Sesja wygasła…”.
- **Timeout po stronie klienta (opcjonalnie)**:
  - jeśli chcesz dodatkowo chronić UX: użyj `AbortController` z timeoutem ~65 s,
  - mapuj na `kind: "timeout"` i pokaż komunikat jak dla `408`.
- **Edge cases**:
  - API zwróci `400` mimo walidacji UI (np. różnica splitowania): pokaż komunikat 400 z UI planu,
  - API zwróci nie-JSON: fallback “Wystąpił błąd. Spróbuj ponownie.” i zaloguj szczegóły do `console.error` w trybie dev.

### 11. Kroki implementacji
1. **Utwórz pliki komponentów React** dla taba “Generuj” w `src/components/` (np. `src/components/generate/GenerateTab.tsx` + komponenty pomocnicze).
2. **Dodaj brakujące komponenty shadcn/ui** jeśli potrzebne (np. `textarea`, `alert`, `skeleton`) do `src/components/ui/` zgodnie z obecnym wzorcem.
3. **Zaimplementuj walidację inputu** (min. 3, max 2000, split `/[,;\n]+/`) oraz a11y (label, `aria-describedby`, fokus po błędzie).
4. **Zaimplementuj `useGenerateRecipe()`** w `src/lib/` (np. `src/lib/hooks/useGenerateRecipe.ts`) z:
   - `fetch("/api/recipes/generate")`,
   - request/response typowane `GenerateRecipeCommand` / `GenerateRecipeResponseDTO`,
   - mapowaniem błędów do `GenerateRecipeErrorVM`.
5. **Zaimplementuj stany UI** w `GenerateTab`:
   - `idle` (brak wyniku),
   - `submitting` (loader/skeleton + blokada CTA),
   - `success` (karta wyniku),
   - `error` (alert + retry).
6. **Zaimplementuj render kroków** w `RecipeStepsRenderer`:
   - próba splitowania po nowych liniach / numeracji,
   - fallback do paragrafów.
7. **Podłącz `GenerateTab` do App Shell tabs** i upewnij się, że domyślny tab to “Generuj” oraz że deep-link `?tab=generate` działa (jeśli wspieracie).
8. **Obsłuż 401 globalnie** (preferowane w App Shell / session layer): każdy `unauthorized` z hooka skutkuje przekierowaniem do `/auth`.
9. **Zweryfikuj zgodność z kryteriami akceptacji US-003..US-007**:
   - min 3 składniki,
   - generowanie ≤ 60 s (loader + obsługa timeout),
   - brak utraty inputu przy błędzie,
   - automatyczny zapis jest potwierdzalny przez pojawienie się w “Moje przepisy” (manualny test E2E).
