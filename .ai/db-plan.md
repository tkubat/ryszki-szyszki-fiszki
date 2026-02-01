1. Lista tabel (kolumny, typy, ograniczenia)
- `recipes`
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `user_id` uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
  - `title` text NOT NULL
  - `ingredients` text NOT NULL   -- lista składników w jednym polu (np. ciąg rozdzielony przecinkami, może zawierać „podstawy kuchenne”)
  - `steps` text NOT NULL         -- wielolinijkowy opis kroków przepisu
  - `liked` boolean NOT NULL DEFAULT false
  - `created_at` timestamptz NOT NULL DEFAULT now()

2. Relacje między tabelami
- `auth.users (id)` 1:N `recipes.user_id`

3. Indeksy
- PK: `recipes_pkey` na `id`
- (Opcjonalnie, pod listę „Moje przepisy” sortowaną po czasie) indeks `idx_recipes_user_created_at` na `(user_id, created_at DESC)`

4. Zasady PostgreSQL / RLS
- `ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;`
- Polityki właścicielskie (dostęp tylko do własnych wierszy):
  - SELECT: `CREATE POLICY select_own_recipes ON recipes FOR SELECT USING (user_id = auth.uid());`
  - INSERT: `CREATE POLICY insert_own_recipes ON recipes FOR INSERT WITH CHECK (user_id = auth.uid());`
  - UPDATE: `CREATE POLICY update_own_recipes ON recipes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`
  - DELETE: `CREATE POLICY delete_own_recipes ON recipes FOR DELETE USING (user_id = auth.uid());`

5. Uwagi projektowe
- Model celowo minimalistyczny zgodnie z MVP: brak tabel profili, brak logów metryk, brak soft delete.
- Duplikaty przepisów z tym samym wejściem są dozwolone.
- `ingredients` i `steps` trzymane jako prosty TEXT dla szybkości wdrożenia; walidacja min. 3 składników i format listy po stronie aplikacji.
