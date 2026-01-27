# Dokument wymagań produktu (PRD) - Ryszki Szyszki Fiszki

## 1. Przegląd produktu

### 1.1 Nazwa produktu
Ryszki Szyszki Fiszki

### 1.2 Wizja produktu
Ryszki Szyszki Fiszki to webowa aplikacja edukacyjna, która wykorzystuje sztuczną inteligencję do automatycznego generowania fiszek z notatek studenckich, eliminując czasochłonny proces manualnego tworzenia fiszek. Produkt łączy generowanie fiszek przez AI z algorytmem spaced repetition (SM-2), umożliwiając studentom efektywną naukę i długoterminowe zapamiętywanie materiału.

### 1.3 Grupa docelowa
Studenci szkół wyższych i innych instytucji edukacyjnych, którzy:
- Poszukują efektywnych metod nauki i zapamiętywania materiału
- Mają duże ilości notatek do przerobienia przed egzaminami
- Chcą wykorzystać metodę spaced repetition, ale zniechęca ich czasochłonne tworzenie fiszek
- Są otwarci na wykorzystanie AI w procesie nauki

### 1.4 Stack technologiczny
- Frontend: Astro (SSR/SSG)
- Backend: Astro + Supabase Edge Functions
- Baza danych: Supabase PostgreSQL
- Autentykacja: Supabase Auth
- AI: OpenAI API (GPT-3.5-turbo)
- Algorytm powtórek: SM-2
- Hosting: Chmura webowa (Vercel/Netlify/Cloudflare Pages)
- UI/UX: Minimalistyczny ciemny motyw

### 1.5 Harmonogram realizacji
Projekt MVP: 1 tydzień (realizowany w 100% z wykorzystaniem AI)

## 2. Problem użytkownika

### 2.1 Opis problemu
Studenci znają efektywność metody spaced repetition w długoterminowym zapamiętywaniu materiału, jednak manualne tworzenie wysokiej jakości fiszek edukacyjnych jest niezwykle czasochłonne. Przygotowanie zestawu fiszek może zająć tyle samo lub więcej czasu niż sama nauka, co zniechęca do korzystania z tej skutecznej metody.

### 2.2 Obecne rozwiązania i ich ograniczenia
- Manualne tworzenie fiszek w aplikacjach typu Anki lub Quizlet - bardzo czasochłonne
- Gotowe zestawy fiszek innych użytkowników - nie dostosowane do indywidualnych notatek i potrzeb
- Brak automatyzacji procesu tworzenia fiszek z własnego materiału

### 2.3 Wartość dla użytkownika
- Drastyczne skrócenie czasu potrzebnego na przygotowanie materiałów do nauki
- Możliwość szybkiego przekształcenia notatek w gotowy zestaw fiszek
- Dostęp do sprawdzonego algorytmu spaced repetition bez konieczności manualnego tworzenia wszystkich fiszek
- Skupienie się na nauce zamiast na przygotowaniu materiałów

## 3. Wymagania funkcjonalne

### 3.1 Moduł autentykacji (AUTH)

AUTH-001: Rejestracja użytkownika
- System umożliwia rejestrację przez email i hasło
- Brak wymogu weryfikacji adresu email
- Walidacja poprawności formatu email
- Wymagania dotyczące hasła (minimalna długość, złożoność)
- Utworzenie konta w bazie danych Supabase
- Inicjalizacja licznika fiszek AI (100/miesiąc)

AUTH-002: Logowanie użytkownika
- System umożliwia logowanie przez email i hasło
- Przekierowanie do widoku "Moje fiszki" po udanym logowaniu
- Obsługa błędnych danych logowania z komunikatem dla użytkownika
- Sesja użytkownika zarządzana przez Supabase Auth

AUTH-003: Wylogowanie użytkownika
- System umożliwia wylogowanie z konta
- Przekierowanie do landing page po wylogowaniu
- Zakończenie sesji użytkownika

AUTH-004: Reset hasła
- System umożliwia zresetowanie hasła przez link wysłany na email
- Formularz żądania resetu hasła (podanie adresu email)
- Wysłanie emaila z linkiem do resetu hasła
- Formularz ustawienia nowego hasła po kliknięciu w link
- Potwierdzenie zmiany hasła

AUTH-005: Usuwanie konta
- System umożliwia użytkownikowi usunięcie własnego konta
- Usunięcie wszystkich danych użytkownika (fiszki, sesje nauki, oceny)
- Wymaganie potwierdzenia akcji usunięcia
- Zgodność z wymogami RODO

### 3.2 Moduł generowania fiszek AI (AI-GEN)

AI-GEN-001: Formularz wprowadzania tekstu źródłowego
- Pole tekstowe typu textarea do wklejenia notatek
- Licznik znaków wyświetlający bieżącą liczbę znaków
- Walidacja minimalnej długości: 50 znaków
- Walidacja maksymalnej długości: 2000 znaków
- Komunikat o błędzie przy niewłaściwej długości tekstu

AI-GEN-002: Wybór liczby fiszek do wygenerowania
- Pole wyboru (dropdown lub przyciski) z opcjami od 1 do 10 fiszek
- Domyślna wartość: 5 fiszek
- Wyświetlanie informacji o pozostałym limicie fiszek AI w bieżącym miesiącu

AI-GEN-003: Licznik limitu fiszek AI
- Wyświetlanie liczby pozostałych fiszek AI do wygenerowania w bieżącym miesiącu
- Format: "Pozostało X z 100 fiszek AI w tym miesiącu"
- Aktywne sprawdzanie przed generowaniem
- Blokada generowania przy przekroczeniu limitu z komunikatem

AI-GEN-004: Integracja z GPT-3.5-turbo
- Wysłanie żądania do OpenAI API z tekstem źródłowym
- Prompt zawierający instrukcje dotyczące limitów znaków (100 przód, 500 tył)
- Prompt generujący fiszki w formacie pytanie-odpowiedź
- Obsługa błędów API z komunikatem "Wystąpił błąd. Spróbuj później lub dodaj fiszki manualnie."

AI-GEN-005: Automatyczna walidacja i regeneracja
- Sprawdzanie wygenerowanych fiszek pod kątem limitów znaków
- Automatyczna regeneracja fiszek przekraczających limity
- Maksymalnie 3 próby regeneracji pojedynczej fiszki
- Przy niepowodzeniu - pominięcie fiszki z komunikatem

AI-GEN-006: Ekran przeglądu wygenerowanych fiszek
- Wyświetlanie wszystkich wygenerowanych fiszek w trybie edycji
- Każda fiszka pokazuje przód (pytanie) i tył (odpowiedź)
- Możliwość edycji treści przed akceptacją
- Walidacja limitów znaków podczas edycji (100/500)
- Komunikat o błędzie przy przekroczeniu limitu podczas edycji

AI-GEN-007: Akceptacja i odrzucenie fiszek
- Przyciski "Akceptuj" i "Odrzuć" dla każdej fiszki
- Możliwość akceptacji wszystkich fiszek jednym przyciskiem
- Możliwość odrzucenia wszystkich fiszek jednym przyciskiem
- Zaakceptowane fiszki zapisywane do bazy danych
- Odrzucone fiszki usuwane bez możliwości przywrócenia
- Odliczenie od limitu AI tylko zaakceptowanych fiszek

AI-GEN-008: System oceny jakości AI
- Dla każdej zaakceptowanej fiszki możliwość oceny "kciuk góra" lub "kciuk dół"
- Opcjonalność oceny - użytkownik może pominąć
- Zapisywanie ocen w bazie danych dla przyszłej analizy
- Brak wyświetlania zagregowanych ocen użytkownikowi w MVP

### 3.3 Moduł manualnego tworzenia fiszek (MANUAL)

MANUAL-001: Formularz tworzenia fiszki
- Pole tekstowe dla przodu fiszki (pytanie)
- Pole tekstowe dla tyłu fiszki (odpowiedź)
- Liczniki znaków dla obu pól
- Maksymalnie 100 znaków dla przodu
- Maksymalnie 500 znaków dla tyłu

MANUAL-002: Walidacja i zapis fiszki
- Walidacja wypełnienia obu pól (nie mogą być puste)
- Walidacja limitów znaków przed zapisem
- Komunikaty o błędach przy nieprawidłowych danych
- Bezpośredni zapis do bazy danych po walidacji
- Brak ekranu akceptacji (natychmiastowe zapisanie)
- Brak limitu ilościowego fiszek manualnych

MANUAL-003: Dostępność funkcji
- Przycisk/link do tworzenia nowej fiszki widoczny w widoku "Moje fiszki"
- Możliwość tworzenia nieograniczonej liczby fiszek manualnie

### 3.4 Moduł "Moje fiszki" (CARDS)

CARDS-001: Lista fiszek użytkownika
- Wyświetlanie wszystkich fiszek użytkownika w formie listy
- Każda fiszka pokazuje przód i tył
- Oznaczenie źródła fiszki (AI lub manualna)
- Sortowanie chronologiczne (najnowsze na górze)
- Informacja o następnej dacie powtórki dla każdej fiszki

CARDS-002: Edycja fiszki
- Przycisk/ikona edycji przy każdej fiszce
- Formularz edycji z wypełnionymi aktualnymi wartościami
- Możliwość modyfikacji przodu i tyłu fiszki
- Liczniki znaków podczas edycji
- Walidacja limitów znaków (100/500)
- Przycisk zapisu zmian
- Przycisk anulowania bez zapisywania zmian

CARDS-003: Usuwanie fiszki
- Przycisk/ikona usuwania przy każdej fiszce
- Dialog potwierdzenia usunięcia
- Trwałe usunięcie fiszki z bazy danych
- Odświeżenie listy po usunięciu

CARDS-004: Widok domyślny po logowaniu
- "Moje fiszki" jako domyślny ekran po zalogowaniu
- Licznik wszystkich fiszek użytkownika
- Przycisk do rozpoczęcia sesji nauki
- Przycisk do dodania nowej fiszki (manualnie)
- Przycisk do wygenerowania fiszek (AI)

CARDS-005: Brak zaawansowanej organizacji
- Brak możliwości tworzenia talii/zestawów
- Brak funkcji filtrowania
- Brak funkcji wyszukiwania
- Brak tagowania fiszek

### 3.5 Moduł sesji nauki - Algorytm SM-2 (STUDY)

STUDY-001: Rozpoczęcie sesji nauki
- Przycisk "Rozpocznij naukę" w widoku "Moje fiszki"
- System sprawdza dostępność fiszek do powtórki na dany dzień
- Algorytm SM-2 wybiera fiszki według harmonogramu
- Nowo utworzone fiszki dostępne od razu w sesji
- Komunikat gdy brak fiszek: "Świetnie! Wszystkie fiszki powtórzone na dziś. Wróć jutro lub dodaj nowe fiszki."

STUDY-002: Wyświetlanie pytania
- Pokazanie przodu fiszki (pytanie)
- Przycisk "Pokaż odpowiedź"
- Licznik postępu: "Fiszka X z Y"
- Możliwość przerwania sesji

STUDY-003: Wyświetlanie odpowiedzi
- Po kliknięciu "Pokaż odpowiedź" wyświetlenie tyłu fiszki
- Przód fiszki pozostaje widoczny
- Wyświetlenie opcji oceny trudności

STUDY-004: Ocena trudności fiszki
- Trzy przyciski oceny: "1 - Łatwe", "2 - Średnie", "3 - Trudne"
- System aktualizuje parametry SM-2 dla fiszki
- Algorytm oblicza następną datę powtórki
- Automatyczne przejście do kolejnej fiszki

STUDY-005: Implementacja algorytmu SM-2
- Parametry SM-2: EF (easiness factor), interval, repetitions
- Inicjalizacja nowych fiszek z wartościami domyślnymi
- Aktualizacja parametrów po każdej ocenie:
  - Ocena 1 (łatwe): zwiększenie interwału
  - Ocena 2 (średnie): umiarkowane zwiększenie interwału
  - Ocena 3 (trudne): resetowanie interwału
- Obliczanie następnej daty powtórki na podstawie interwału
- Zapisywanie zaktualizowanych parametrów w bazie danych

STUDY-006: Zakończenie sesji nauki
- Automatyczne zakończenie po powtórzeniu wszystkich fiszek zaplanowanych na dany dzień
- Ekran podsumowania sesji
- Wyświetlenie liczby powtórzonych fiszek
- Przycisk powrotu do "Moje fiszki"

STUDY-007: Przerwanie sesji
- Możliwość przerwania sesji w dowolnym momencie
- Zapisanie postępu dla już ocenionych fiszek
- Nieocenione fiszki pozostają w kolejce na kolejne sesje
- Przycisk "Zakończ sesję"

### 3.6 Landing Page (LANDING)

LANDING-001: Struktura strony
- Nagłówek z nazwą "Ryszki Szyszki Fiszki"
- Sekcja hero z wartością produktu
- Opis głównej korzyści: automatyczne generowanie fiszek przez AI
- Opis algorytmu spaced repetition
- Sekcja z kluczowymi funkcjami

LANDING-002: Call to Action
- Przycisk "Zaloguj się" w nagłówku
- Przycisk "Zarejestruj się" w sekcji hero
- Przekierowanie do odpowiednich formularzy

LANDING-003: Informacje o produkcie
- Limit 100 fiszek AI miesięcznie
- Nieograniczone fiszki manualne
- Brak wymogu instalacji aplikacji (web app)
- Minimalistyczny design

### 3.7 Wymagania niefunkcjonalne (NFR)

NFR-001: Responsywność
- Aplikacja webowa responsywna i użyteczna na urządzeniach mobilnych
- Główne breakpointy: desktop, tablet, mobile
- Optymalizacja UI dla ekranów dotykowych

NFR-002: Wydajność
- Generowanie fiszek AI w czasie do 10 sekund (zależne od API OpenAI)
- Ładowanie widoku "Moje fiszki" poniżej 2 sekund
- Płynne przejścia między fiszkami w sesji nauki

NFR-003: Bezpieczeństwo
- Hashowanie haseł w bazie danych
- HTTPS dla wszystkich połączeń
- Ochrona API endpoints (wymagane uwierzytelnienie)
- Bezpieczne przechowywanie kluczy API
- Polityka CORS

NFR-004: Dostępność
- Kontrast kolorów zgodny z WCAG 2.1 (AA)
- Możliwość nawigacji klawiaturą
- Semantyczny HTML
- Opisowe komunikaty błędów

NFR-005: Zgodność z RODO
- Możliwość usunięcia konta i wszystkich danych
- Informacja o przetwarzaniu danych
- Minimalizacja zbieranych danych

## 4. Granice produktu

### 4.1 Funkcjonalności wyłączone z MVP

Następujące funkcjonalności NIE wchodzą w zakres MVP i nie będą implementowane w pierwszej wersji:

1. Zaawansowany algorytm powtórek
   - Brak własnej implementacji typu SuperMemo lub Anki
   - Wykorzystanie standardowego SM-2 bez modyfikacji

2. Import wielu formatów
   - Brak importu plików PDF
   - Brak importu plików DOCX
   - Brak OCR dla zdjęć/skanów
   - Jedynie kopiuj-wklej tekstu

3. Współdzielenie i społeczność
   - Brak udostępniania zestawów fiszek między użytkownikami
   - Brak publicznej biblioteki fiszek
   - Brak funkcji społecznościowych (komentarze, oceny)

4. Integracje zewnętrzne
   - Brak integracji z platformami edukacyjnymi (Moodle, Canvas)
   - Brak integracji z notatkami (Notion, Evernote, OneNote)
   - Brak synchronizacji z kalendarzem

5. Aplikacje mobilne
   - Brak natywnych aplikacji iOS/Android
   - Tylko aplikacja webowa (responsywna)

6. Organizacja fiszek
   - Brak talii/zestawów fiszek
   - Brak kategorii i tagów
   - Brak filtrowania i wyszukiwania
   - Brak sortowania niestandardowego

7. Gamifikacja i statystyki
   - Brak rozbudowanych statystyk
   - Brak wykresów postępów
   - Brak systemu punktowego
   - Brak osiągnięć/badges
   - Brak streaks (pasma dni nauki)
   - Tylko podstawowe podsumowanie sesji

8. Onboarding
   - Brak tutoriala wprowadzającego
   - Brak interaktywnego przewodnika
   - Brak tooltipów pomocniczych
   - Interfejs zakłada intuicyjność

9. Uwierzytelnianie zaawansowane
   - Brak logowania przez Google/Facebook
   - Brak weryfikacji adresu email
   - Brak uwierzytelniania dwuskładnikowego (2FA)

10. Multimedia
    - Brak obrazków w fiszkach
    - Brak dźwięków w fiszkach
    - Tylko format tekstowy

### 4.2 Ograniczenia techniczne MVP

1. Limity API:
   - 100 fiszek AI na użytkownika miesięcznie
   - 2000 znaków maksimum tekstu źródłowego
   - 10 fiszek maksimum na jedno generowanie

2. Limity fiszek:
   - 100 znaków maksimum przód fiszki
   - 500 znaków maksimum tył fiszki

3. Model AI:
   - GPT-3.5-turbo (nie GPT-4)
   - Brak fine-tuningu modelu
   - Brak custom modelowania

4. Algorytm powtórek:
   - Standardowy SM-2 bez modyfikacji
   - Skala oceny 1-3 (nie 1-5 jak w oryginalnym SM-2)

### 4.3 Założenia projektowe

1. Użytkownicy:
   - Studenci z podstawową znajomością języka polskiego
   - Dostęp do przeglądarki internetowej
   - Podstawowa znajomość obsługi aplikacji webowych

2. Środowisko:
   - Dostęp do internetu wymagany
   - Brak trybu offline
   - Obsługiwane przeglądarki: Chrome, Firefox, Safari, Edge (ostatnie 2 wersje)

3. Dane:
   - Dane przechowywane wyłącznie w chmurze
   - Brak lokalnego backupu
   - Eksport danych poza zakresem MVP

## 5. Historyjki użytkowników

### 5.1 Moduł autentykacji

US-001: Rejestracja nowego konta
Jako nowy użytkownik
Chcę zarejestrować konto używając adresu email i hasła
Aby móc korzystać z aplikacji i przechowywać swoje fiszki

Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła
- System waliduje poprawność formatu adresu email
- System wymaga hasła o minimalnej długości 8 znaków
- System wymaga zgodności hasła z potwierdzeniem hasła
- System wyświetla komunikat błędu przy niepoprawnych danych
- Po udanej rejestracji użytkownik jest automatycznie zalogowany
- Nowe konto otrzymuje limit 100 fiszek AI na miesiąc
- Po rejestracji użytkownik jest przekierowany do widoku "Moje fiszki"
- System nie wymaga weryfikacji adresu email

US-002: Logowanie do istniejącego konta
Jako zarejestrowany użytkownik
Chcę zalogować się do swojego konta
Aby uzyskać dostęp do moich fiszek i kontynuować naukę

Kryteria akceptacji:
- Formularz logowania zawiera pola: email i hasło
- System weryfikuje dane logowania z bazą danych
- Po udanym logowaniu użytkownik jest przekierowany do widoku "Moje fiszki"
- System wyświetla komunikat "Nieprawidłowy email lub hasło" przy błędnych danych
- System nie ujawnia czy problem dotyczy emaila czy hasła (bezpieczeństwo)
- Sesja użytkownika jest zachowana do momentu wylogowania

US-003: Wylogowanie z konta
Jako zalogowany użytkownik
Chcę wylogować się z aplikacji
Aby zabezpieczyć swoje konto na współdzielonym urządzeniu

Kryteria akceptacji:
- Przycisk "Wyloguj" jest widoczny w każdym widoku aplikacji
- Po kliknięciu wylogowania sesja użytkownika jest kończona
- Użytkownik jest przekierowany do landing page
- Po wylogowaniu nie można uzyskać dostępu do chronionych widoków bez ponownego logowania
- Próba dostępu do chronionych widoków po wylogowaniu przekierowuje do strony logowania

US-004: Reset zapomnianego hasła
Jako użytkownik, który zapomniał hasła
Chcę zresetować hasło za pomocą linku wysłanego na email
Aby odzyskać dostęp do mojego konta

Kryteria akceptacji:
- Link "Zapomniałeś hasła?" jest widoczny na stronie logowania
- Formularz resetu hasła zawiera pole na adres email
- System wysyła email z linkiem do resetu hasła na podany adres (jeśli istnieje w bazie)
- System wyświetla ten sam komunikat niezależnie czy email istnieje w bazie (bezpieczeństwo)
- Link w emailu jest ważny przez 24 godziny
- Po kliknięciu w link użytkownik widzi formularz nowego hasła
- Formularz nowego hasła zawiera pola: nowe hasło i potwierdzenie
- System waliduje nowe hasło (minimalna długość 8 znaków)
- Po pomyślnej zmianie hasła użytkownik widzi komunikat potwierdzenia
- Użytkownik może się zalogować nowym hasłem

US-005: Usunięcie konta i wszystkich danych
Jako użytkownik
Chcę móc usunąć swoje konto wraz ze wszystkimi danymi
Aby skorzystać z prawa do bycia zapomnianym (RODO)

Kryteria akceptacji:
- Opcja "Usuń konto" jest dostępna w ustawieniach użytkownika
- System wyświetla dialog potwierdzenia z ostrzeżeniem o nieodwracalności
- Dialog wymaga wpisania frazy potwierdzającej (np. "USUŃ KONTO")
- Po potwierdzeniu system usuwa wszystkie dane użytkownika: konto, fiszki, sesje nauki, oceny
- Użytkownik jest wylogowany i przekierowany do landing page
- System wyświetla komunikat potwierdzenia usunięcia konta
- Po usunięciu próba logowania zwraca błąd nieprawidłowych danych

### 5.2 Moduł generowania fiszek AI

US-006: Wygenerowanie fiszek z tekstu przy użyciu AI
Jako użytkownik
Chcę wkleić tekst z moich notatek i wygenerować z niego fiszki przez AI
Aby zaoszczędzić czas na ręczne tworzenie fiszek

Kryteria akceptacji:
- Przycisk/link "Wygeneruj fiszki AI" jest widoczny w widoku "Moje fiszki"
- Formularz zawiera pole textarea na tekst źródłowy
- System wyświetla licznik znaków w czasie rzeczywistym
- System wymaga minimum 50 znaków tekstu
- System wymaga maksimum 2000 znaków tekstu
- System wyświetla błąd przy próbie wysłania tekstu poza zakresem 50-2000 znaków
- Formularz zawiera dropdown/przyciski wyboru liczby fiszek (1-10)
- Domyślna wartość to 5 fiszek
- System wyświetla licznik pozostałych fiszek AI (np. "Pozostało 95 z 100 fiszek AI")
- Po wysłaniu formularza system wyświetla wskaźnik ładowania
- System wysyła zapytanie do GPT-3.5-turbo z odpowiednim promptem
- Generowanie zajmuje maksymalnie 10 sekund

US-007: Przeglądanie i edycja wygenerowanych fiszek przed zapisem
Jako użytkownik
Chcę przejrzeć i edytować fiszki wygenerowane przez AI przed ich zapisaniem
Aby poprawić ewentualne błędy lub niedokładności

Kryteria akceptacji:
- Po wygenerowaniu system wyświetla ekran przeglądu wszystkich fiszek
- Każda fiszka jest wyświetlona w trybie edycji z polami przód i tył
- Każde pole ma licznik znaków
- System waliduje limity znaków podczas edycji (100 przód, 500 tył)
- System wyświetla komunikat błędu przy przekroczeniu limitu podczas edycji
- Użytkownik może swobodnie modyfikować treść przed akceptacją
- Każda fiszka ma przyciski "Akceptuj" i "Odrzuć"
- Na górze ekranu są przyciski "Akceptuj wszystkie" i "Odrzuć wszystkie"

US-008: Akceptacja i odrzucenie wygenerowanych fiszek
Jako użytkownik
Chcę zaakceptować dobre fiszki i odrzucić złe
Aby zapisać tylko wartościowe fiszki do mojej kolekcji

Kryteria akceptacji:
- Przycisk "Akceptuj" przy fiszce zapisuje ją do bazy danych
- Przycisk "Odrzuć" przy fiszce usuwa ją bez możliwości przywrócenia
- Przycisk "Akceptuj wszystkie" zapisuje wszystkie fiszki jednocześnie
- Przycisk "Odrzuć wszystkie" usuwa wszystkie fiszki i wraca do widoku "Moje fiszki"
- Tylko zaakceptowane fiszki są odliczane od miesięcznego limitu AI
- Po akceptacji/odrzuceniu wszystkich fiszek użytkownik widzi zaktualizowany licznik limitu
- System wyświetla komunikat potwierdzenia liczby zapisanych fiszek
- Po zakończeniu procesu użytkownik jest przekierowany do widoku "Moje fiszki"
- Nowo zaakceptowane fiszki są widoczne na liście

US-009: Ocena jakości wygenerowanych fiszek
Jako użytkownik
Chcę ocenić jakość wygenerowanych fiszek
Aby pomóc w ulepszaniu systemu AI

Kryteria akceptacji:
- Przy każdej zaakceptowanej fiszce widoczne są ikony "kciuk góra" i "kciuk dół"
- Użytkownik może kliknąć jedną z ikon aby ocenić jakość
- Ocena jest opcjonalna - użytkownik może pominąć
- Po kliknięciu ikona zmienia kolor/styl wskazując wybór
- Ocena jest zapisywana w bazie danych
- Użytkownik może zmienić ocenę przed finalnym zapisem fiszek
- Oceny nie wpływają na dostępność fiszek - służą tylko do analizy

US-010: Sprawdzenie pozostałego limitu fiszek AI
Jako użytkownik
Chcę wiedzieć ile fiszek AI mogę jeszcze wygenerować w bieżącym miesiącu
Aby planować wykorzystanie limitu

Kryteria akceptacji:
- Licznik limitu jest widoczny w formularzu generowania fiszek
- Format: "Pozostało X z 100 fiszek AI w tym miesiącu"
- Licznik aktualizuje się po każdym wygenerowaniu i akceptacji fiszek
- Przy limicie 0 przycisk generowania jest nieaktywny
- System wyświetla komunikat "Wykorzystałeś miesięczny limit fiszek AI. Wróć za X dni lub twórz fiszki ręcznie"
- Licznik resetuje się pierwszego dnia kolejnego miesiąca kalendarzowego

US-011: Obsługa błędów generowania AI
Jako użytkownik
Chcę otrzymać jasny komunikat gdy generowanie fiszek się nie powiedzie
Aby wiedzieć co dalej zrobić

Kryteria akceptacji:
- Przy błędzie API OpenAI system wyświetla komunikat: "Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie później lub dodaj fiszki ręcznie."
- Przy błędzie użytkownik pozostaje w formularzu z zachowanym tekstem
- Nieudane generowanie nie odlicza od limitu fiszek AI
- System loguje błędy dla celów debugowania

US-012: Automatyczna regeneracja fiszek przekraczających limity
Jako użytkownik
Chcę aby AI automatycznie regenerowało fiszki przekraczające limity znaków
Aby otrzymać tylko prawidłowe fiszki

Kryteria akceptacji:
- Po otrzymaniu odpowiedzi z API system sprawdza długość każdej fiszki
- Fiszki przekraczające 100 znaków (przód) lub 500 znaków (tył) są automatycznie regenerowane
- System wykonuje maksymalnie 3 próby regeneracji dla każdej nieprawidłowej fiszki
- Regeneracja jest niewidoczna dla użytkownika (dzieje się w tle)
- Jeśli po 3 próbach fiszka nadal przekracza limity, jest pomijana
- System wyświetla komunikat: "Wygenerowano X z Y żądanych fiszek"
- Użytkownik widzi tylko fiszki spełniające wymagania

### 5.3 Moduł manualnego tworzenia fiszek

US-013: Ręczne utworzenie nowej fiszki
Jako użytkownik
Chcę ręcznie utworzyć fiszkę z konkretnym pytaniem i odpowiedzią
Aby dodać własną wiedzę, której nie ma w notatkach

Kryteria akceptacji:
- Przycisk/link "Dodaj fiszkę ręcznie" jest widoczny w widoku "Moje fiszki"
- Formularz zawiera pole na przód fiszki (pytanie)
- Formularz zawiera pole na tył fiszki (odpowiedź)
- Każde pole ma licznik znaków w czasie rzeczywistym
- Limit przodu: 100 znaków
- Limit tyłu: 500 znaków
- System wyświetla błąd przy próbie przekroczenia limitu
- Formularz ma przycisk "Zapisz" i "Anuluj"
- Oba pola są wymagane (nie mogą być puste)
- Po kliknięciu "Zapisz" fiszka jest natychmiast zapisana do bazy
- Po zapisie użytkownik jest przekierowany do widoku "Moje fiszki"
- Nowa fiszka jest widoczna na liście
- Brak limitu liczby ręcznie tworzonych fiszek

US-014: Anulowanie tworzenia ręcznej fiszki
Jako użytkownik
Chcę móc anulować proces tworzenia fiszki
Aby wrócić do listy bez zapisywania zmian

Kryteria akceptacji:
- Przycisk "Anuluj" jest widoczny w formularzu
- Po kliknięciu "Anuluj" żadne dane nie są zapisywane
- Użytkownik jest przekierowany do widoku "Moje fiszki"
- Wprowadzone dane są tracone

### 5.4 Moduł "Moje fiszki"

US-015: Przeglądanie wszystkich swoich fiszek
Jako użytkownik
Chcę widzieć listę wszystkich moich fiszek
Aby mieć przegląd mojej kolekcji

Kryteria akceptacji:
- Widok "Moje fiszki" wyświetla listę wszystkich fiszek użytkownika
- Każda fiszka pokazuje przód (pytanie) i tył (odpowiedź)
- Każda fiszka ma oznaczenie źródła: "AI" lub "Ręczna"
- Każda fiszka wyświetla następną datę powtórki
- Fiszki są sortowane chronologicznie (najnowsze na górze)
- Na górze widoku jest licznik wszystkich fiszek: "Masz X fiszek"
- Widok jest domyślnym ekranem po zalogowaniu
- Każda fiszka ma ikony/przyciski "Edytuj" i "Usuń"

US-016: Edycja istniejącej fiszki
Jako użytkownik
Chcę edytować treść mojej fiszki
Aby poprawić błędy lub zaktualizować informacje

Kryteria akceptacji:
- Po kliknięciu "Edytuj" wyświetla się formularz edycji
- Formularz jest wypełniony aktualnymi wartościami fiszki
- Użytkownik może modyfikować przód i tył fiszki
- Każde pole ma licznik znaków
- System waliduje limity znaków (100/500)
- System wyświetla błąd przy próbie przekroczenia limitu
- Formularz ma przyciski "Zapisz zmiany" i "Anuluj"
- Po kliknięciu "Zapisz zmiany" zaktualizowana fiszka jest zapisana
- Po zapisie użytkownik wraca do widoku listy fiszek
- Zmieniona fiszka pokazuje zaktualizowane dane
- Po kliknięciu "Anuluj" żadne zmiany nie są zapisywane

US-017: Usunięcie fiszki
Jako użytkownik
Chcę usunąć fiszkę z mojej kolekcji
Aby pozbyć się niepotrzebnych lub błędnych fiszek

Kryteria akceptacji:
- Po kliknięciu "Usuń" wyświetla się dialog potwierdzenia
- Dialog zawiera pytanie: "Czy na pewno chcesz usunąć tę fiszkę?"
- Dialog zawiera podgląd fiszki (przód i tył)
- Dialog ma przyciski "Usuń" i "Anuluj"
- Po potwierdzeniu fiszka jest trwale usuwana z bazy danych
- Usunięcie jest nieodwracalne (brak możliwości przywrócenia)
- Lista fiszek odświeża się automatycznie po usunięciu
- Licznik fiszek aktualizuje się
- Po anulowaniu dialog zamyka się bez usuwania

US-018: Rozpoczęcie sesji nauki z widoku fiszek
Jako użytkownik
Chcę rozpocząć sesję nauki z widoku moich fiszek
Aby łatwo przejść do trybu powtórek

Kryteria akceptacji:
- Przycisk "Rozpocznij naukę" jest widoczny na górze widoku "Moje fiszki"
- Przycisk jest aktywny gdy są fiszki do powtórki
- Po kliknięciu użytkownik jest przekierowany do widoku sesji nauki
- System automatycznie ładuje fiszki według algorytmu SM-2

US-019: Obsługa sytuacji braku fiszek
Jako nowy użytkownik bez fiszek
Chcę widzieć pomocne komunikaty i sugestie
Aby wiedzieć co dalej zrobić

Kryteria akceptacji:
- Gdy użytkownik nie ma żadnych fiszek, wyświetla się komunikat: "Nie masz jeszcze żadnych fiszek. Zacznij od wygenerowania fiszek przez AI lub stwórz pierwszą fiszkę ręcznie."
- Widoczne są wyraźne przyciski "Wygeneruj fiszki AI" i "Dodaj fiszkę ręcznie"
- Przycisk "Rozpocznij naukę" jest nieaktywny

### 5.5 Moduł sesji nauki (Algorytm SM-2)

US-020: Rozpoczęcie sesji nauki
Jako użytkownik
Chcę rozpocząć sesję nauki algorytmem spaced repetition
Aby efektywnie powtarzać moje fiszki

Kryteria akceptacji:
- Po kliknięciu "Rozpocznij naukę" system sprawdza dostępność fiszek
- Algorytm SM-2 wybiera fiszki zaplanowane na bieżący dzień
- Nowo utworzone fiszki (nigdy nie powtarzane) są automatycznie włączone
- Jeśli są fiszki do powtórki, wyświetla się pierwsza fiszka (pytanie)
- System pokazuje licznik postępu: "Fiszka 1 z X"
- Wyświetlony jest tylko przód fiszki (pytanie)
- Widoczny jest przycisk "Pokaż odpowiedź"

US-021: Wyświetlenie odpowiedzi na pytanie
Jako użytkownik podczas sesji nauki
Chcę zobaczyć odpowiedź po zastanowieniu się nad pytaniem
Aby sprawdzić czy znam poprawną odpowiedź

Kryteria akceptacji:
- Po kliknięciu "Pokaż odpowiedź" wyświetla się tył fiszki (odpowiedź)
- Przód fiszki (pytanie) pozostaje widoczny
- Przycisk "Pokaż odpowiedź" znika
- Pojawiają się trzy przyciski oceny: "1 - Łatwe", "2 - Średnie", "3 - Trudne"
- Każdy przycisk ma wyraźny kolor/styl

US-022: Ocena trudności fiszki
Jako użytkownik podczas sesji nauki
Chcę ocenić jak trudna była dla mnie fiszka
Aby algorytm dostosował harmonogram powtórek

Kryteria akceptacji:
- Użytkownik może wybrać jedną z trzech opcji: 1 (łatwe), 2 (średnie), 3 (trudne)
- Po wyborze system natychmiast aktualizuje parametry SM-2 dla fiszki
- Algorytm oblicza i zapisuje następną datę powtórki
- Dla oceny 1 (łatwe): interwał znacznie zwiększony
- Dla oceny 2 (średnie): interwał umiarkowanie zwiększony
- Dla oceny 3 (trudne): interwał zresetowany lub minimalny
- System automatycznie przechodzi do następnej fiszki
- Licznik postępu aktualizuje się (np. "Fiszka 2 z X")

US-023: Przerwanie sesji nauki
Jako użytkownik podczas sesji nauki
Chcę móc przerwać sesję w dowolnym momencie
Aby wrócić później lub zakończyć naukę przedwcześnie

Kryteria akceptacji:
- Przycisk "Zakończ sesję" jest widoczny podczas całej sesji
- Po kliknięciu wyświetla się dialog potwierdzenia: "Czy na pewno chcesz zakończyć sesję?"
- Dialog ma przyciski "Tak, zakończ" i "Nie, kontynuuj"
- Po potwierdzeniu postęp dla ocenionych fiszek jest zapisany
- Fiszki nieocenione pozostają w kolejce na kolejne sesje
- Użytkownik jest przekierowany do widoku "Moje fiszki"
- System wyświetla komunikat o liczbie powtórzonych fiszek w przerwanej sesji

US-024: Zakończenie sesji nauki
Jako użytkownik po powtórzeniu wszystkich fiszek
Chcę zobaczyć podsumowanie mojej sesji
Aby wiedzieć ile fiszek powtórzyłem

Kryteria akceptacji:
- Po powtórzeniu ostatniej fiszki wyświetla się ekran podsumowania
- Podsumowanie pokazuje liczbę powtórzonych fiszek: "Powtórzyłeś X fiszek"
- Podsumowanie pokazuje rozkład ocen (ile łatwych, średnich, trudnych)
- Widoczny jest przycisk "Powrót do fiszek"
- Po kliknięciu użytkownik wraca do widoku "Moje fiszki"
- System wyświetla zachęcający komunikat (np. "Świetna robota!")

US-025: Obsługa sytuacji braku fiszek do powtórki
Jako użytkownik, który powtórzył wszystkie fiszki na dziś
Chcę wiedzieć że nie mam więcej do nauki dzisiaj
Aby wiedzieć kiedy wrócić

Kryteria akceptacji:
- Gdy brak fiszek do powtórki, wyświetla się komunikat: "Świetnie! Wszystkie fiszki powtórzone na dziś. Wróć jutro lub dodaj nowe fiszki."
- Widoczne są przyciski: "Wygeneruj nowe fiszki AI" i "Dodaj fiszkę ręcznie"
- Przycisk "Rozpocznij naukę" jest nieaktywny lub pokazuje komunikat o braku fiszek
- System może opcjonalnie pokazać datę następnej zaplanowanej powtórki

US-026: Włączenie nowo utworzonych fiszek do sesji
Jako użytkownik, który właśnie dodał nowe fiszki
Chcę móc je powtarzać od razu w sesji nauki
Aby rozpocząć ich naukę bez czekania

Kryteria akceptacji:
- Fiszki utworzone (AI lub ręcznie) są natychmiast dostępne w sesji nauki
- Nowe fiszki mają inicjalizowane parametry SM-2 (domyślne wartości)
- Algorytm traktuje je jako "nowe" (nigdy nie powtarzane)
- W sesji nauki nowe fiszki pojawiają się jako pierwsze lub w losowej kolejności z innymi nowymi
- Po pierwszej ocenie fiszka otrzymuje pierwszy interwał powtórek

### 5.6 Landing Page i nawigacja

US-027: Przeglądanie landing page przez niezalogowanego użytkownika
Jako osoba odwiedzająca stronę po raz pierwszy
Chcę zrozumieć co oferuje aplikacja
Aby zdecydować czy chcę się zarejestrować

Kryteria akceptacji:
- Landing page wyświetla nazwę "Ryszki Szyszki Fiszki"
- Sekcja hero zawiera główną wartość: "Twórz fiszki 10x szybciej z pomocą AI"
- Strona opisuje kluczowe funkcje: generowanie AI, algorytm powtórek, limit 100 fiszek AI
- Strona informuje o nieograniczonych fiszkach ręcznych
- Widoczne są przyciski "Zaloguj się" i "Zarejestruj się"
- Przyciski prowadzą do odpowiednich formularzy
- Design jest minimalistyczny i ciemny

US-028: Dostęp do chronionej części aplikacji
Jako niezalogowany użytkownik
Nie mogę uzyskać dostępu do części aplikacji wymagającej logowania
Aby chronić dane użytkowników

Kryteria akceptacji:
- Próba dostępu do widoku "Moje fiszki" bez logowania przekierowuje do strony logowania
- Próba dostępu do sesji nauki bez logowania przekierowuje do strony logowania
- Próba dostępu do formularzy generowania/tworzenia fiszek przekierowuje do logowania
- System wyświetla komunikat: "Zaloguj się, aby uzyskać dostęp"
- Po zalogowaniu użytkownik jest przekierowany do pierwotnie żądanej strony (lub domyślnie do "Moje fiszki")

US-029: Nawigacja między widokami
Jako zalogowany użytkownik
Chcę łatwo przemieszczać się między głównymi widokami aplikacji
Aby efektywnie korzystać z funkcji

Kryteria akceptacji:
- Menu nawigacji jest widoczne we wszystkich widokach aplikacji
- Menu zawiera linki: "Moje fiszki", "Rozpocznij naukę", "Wyloguj"
- Aktywny widok jest wyraźnie oznaczony w menu
- Kliknięcie w logo/nazwę aplikacji przekierowuje do "Moje fiszki"
- Nawigacja działa płynnie bez pełnego przeładowania strony (SPA-like)

### 5.7 Zarządzanie limitami i resetowanie

US-030: Automatyczne resetowanie miesięcznego limitu AI
Jako użytkownik pierwszego dnia miesiąca
Chcę aby mój limit fiszek AI automatycznie się zresetował
Aby móc wygenerować kolejne 100 fiszek

Kryteria akceptacji:
- Pierwszego dnia każdego miesiąca kalendarzowego limit jest resetowany do 100
- Resetowanie dzieje się automatycznie o północy (czas serwera)
- Użytkownik widzi zaktualizowany licznik przy następnej wizycie
- Nieużyty limit z poprzedniego miesiąca nie przenosi się (use-it-or-lose-it)

US-031: Blokada generowania przy przekroczonym limicie
Jako użytkownik, który wykorzystał miesięczny limit AI
Nie mogę wygenerować więcej fiszek AI do końca miesiąca
Ale mogę tworzyć fiszki ręcznie bez ograniczeń

Kryteria akceptacji:
- Gdy limit wynosi 0, przycisk "Wygeneruj fiszki AI" jest nieaktywny (szary)
- System wyświetla komunikat: "Wykorzystałeś miesięczny limit 100 fiszek AI. Limit odnowi się 1. dnia następnego miesiąca."
- System pokazuje datę odnowienia limitu
- Przycisk "Dodaj fiszkę ręcznie" pozostaje w pełni aktywny
- Użytkownik może nadal edytować i usuwać istniejące fiszki
- Użytkownik może nadal korzystać z sesji nauki

## 6. Metryki sukcesu

### 6.1 Główne wskaźniki KPI

Metryka 1: Współczynnik akceptacji fiszek AI
- Cel: 75% wygenerowanych fiszek jest akceptowanych przez użytkowników
- Sposób pomiaru: (liczba zaakceptowanych fiszek AI / liczba wszystkich wygenerowanych fiszek AI) × 100%
- Źródło danych: Baza danych - tabela z wygenerowanymi fiszkami i ich statusem (zaakceptowane/odrzucone)
- Częstotliwość pomiaru: Tygodniowo
- Interpretacja:
  - Poniżej 50%: Jakość generowania AI wymaga pilnej poprawy (problem z promptem lub modelem)
  - 50-74%: Jakość do akceptacji, ale wymaga optymalizacji
  - 75%+: Cel osiągnięty, AI generuje wartościowe fiszki
  - Powyżej 90%: Doskonałe rezultaty

Metryka 2: Wykorzystanie generowania AI
- Cel: 75% wszystkich fiszek użytkowników jest tworzonych przez AI
- Sposób pomiaru: (liczba fiszek utworzonych przez AI / liczba wszystkich fiszek) × 100%
- Źródło danych: Baza danych - pole source w tabeli flashcards ('ai' lub 'manual')
- Częstotliwość pomiaru: Tygodniowo
- Interpretacja:
  - Poniżej 50%: Użytkownicy preferują ręczne tworzenie - problem z wartością/jakością AI
  - 50-74%: Dobre wykorzystanie, ale można poprawić
  - 75%+: Cel osiągnięty, AI jest głównym źródłem fiszek
  - Powyżej 90%: Bardzo silna preferencja dla AI

### 6.2 Metryki jakości AI

Metryka 3: Ocena jakości fiszek AI (kciuk góra/dół)
- Cel: Trend wzrostowy w ocenach pozytywnych
- Sposób pomiaru: (liczba kciuk góra / (kciuk góra + kciuk dół)) × 100%
- Źródło danych: Baza danych - tabela z ocenami jakości fiszek AI
- Częstotliwość pomiaru: Tygodniowo
- Interpretacja:
  - Poniżej 60% pozytywnych: Słaba jakość generowania
  - 60-79% pozytywnych: Akceptowalna jakość
  - 80%+ pozytywnych: Wysoka jakość generowania
  - Obserwacja trendu w czasie pozwoli na ocenę ulepszeń promptu

### 6.3 Metryki zaangażowania

Metryka 4: Daily Active Users (DAU)
- Cel: Obserwacja trendu wzrostowego
- Sposób pomiaru: Liczba unikalnych użytkowników logujących się każdego dnia
- Źródło danych: Supabase Auth - logi logowania
- Częstotliwość pomiaru: Dziennie
- Interpretacja: Wzrost DAU świadczy o wartości produktu i retencji użytkowników

Metryka 5: Średnia liczba fiszek na użytkownika
- Cel: Minimum 20 fiszek na aktywnego użytkownika
- Sposób pomiaru: Suma wszystkich fiszek / liczba użytkowników z co najmniej 1 fiszką
- Źródło danych: Baza danych - agregacja tabeli flashcards
- Częstotliwość pomiaru: Tygodniowo
- Interpretacja:
  - Poniżej 10: Użytkownicy nie budują znaczących kolekcji
  - 10-20: Umiarkowane wykorzystanie
  - 20+: Użytkownicy aktywnie budują kolekcje

Metryka 6: Częstotliwość sesji nauki
- Cel: Średnio 4+ sesje na użytkownika tygodniowo
- Sposób pomiaru: Liczba sesji nauki / liczba aktywnych użytkowników / tydzień
- Źródło danych: Baza danych - tabela study_sessions
- Częstotliwość pomiaru: Tygodniowo
- Interpretacja:
  - Poniżej 2: Niska retencja, użytkownicy nie wracają regularnie
  - 2-3: Umiarkowana retencja
  - 4+: Wysoka retencja, użytkownicy aktywnie się uczą

### 6.4 Metryki wydajności technicznej

Metryka 7: Czas generowania fiszek AI
- Cel: Średnio poniżej 8 sekund
- Sposób pomiaru: Czas między wysłaniem żądania a otrzymaniem odpowiedzi z OpenAI API
- Źródło danych: Logi serwera
- Częstotliwość pomiaru: Dziennie (średnia)
- Interpretacja:
  - Powyżej 15 sekund: Zła user experience, możliwe problemy z API
  - 8-15 sekund: Akceptowalne, ale można poprawić
  - Poniżej 8 sekund: Dobra wydajność

Metryka 8: Współczynnik błędów generowania
- Cel: Poniżej 2% niepowodzeń
- Sposób pomiaru: (liczba błędnych żądań do API / liczba wszystkich żądań) × 100%
- Źródło danych: Logi serwera - błędy OpenAI API
- Częstotliwość pomiaru: Dziennie
- Interpretacja:
  - Powyżej 5%: Poważne problemy techniczne
  - 2-5%: Umiarkowane problemy
  - Poniżej 2%: Stabilny system

### 6.5 Metryki biznesowe

Metryka 9: Wykorzystanie limitu fiszek AI
- Cel: Średnio 60%+ limitu wykorzystane przez aktywnych użytkowników
- Sposób pomiaru: Średnia (wykorzystane fiszki AI / 100) × 100% per użytkownik miesięcznie
- Źródło danych: Baza danych - licznik fiszek AI per użytkownik
- Częstotliwość pomiaru: Miesięcznie
- Interpretacja:
  - Poniżej 30%: Użytkownicy nie widzą wartości w AI lub limit jest zbyt wysoki
  - 30-60%: Umiarkowane wykorzystanie
  - 60%+: Wysokie wykorzystanie, limit może być ograniczeniem
  - Blisko 100%: Użytkownicy chcą więcej - możliwość monetyzacji

Metryka 10: Retention Rate (30-dniowa)
- Cel: 40%+ użytkowników wraca po 30 dniach
- Sposób pomiaru: (użytkownicy aktywni w dniu 30 / użytkownicy zarejestrowani w dniu 0) × 100%
- Źródło danych: Supabase Auth - logi logowania i daty rejestracji
- Częstotliwość pomiaru: Miesięcznie dla kolejnych kohort
- Interpretacja:
  - Poniżej 20%: Bardzo słaba retencja, problem z product-market fit
  - 20-40%: Typowa retencja dla aplikacji edukacyjnych
  - 40%+: Dobra retencja, wartościowy produkt

### 6.6 Metodologia zbierania danych

Struktura bazy danych dla analityki:
- Tabela users: id, created_at, last_login, ai_flashcards_limit, ai_flashcards_used
- Tabela flashcards: id, user_id, front, back, source (ai/manual), created_at, ai_rating (thumbs up/down)
- Tabela study_sessions: id, user_id, started_at, ended_at, cards_reviewed
- Tabela study_reviews: id, session_id, card_id, difficulty_rating, reviewed_at
- Tabela ai_generations: id, user_id, created_at, cards_generated, cards_accepted, generation_time, error

Dashboard analityczny:
- Cotygodniowy przegląd kluczowych metryk KPI
- Alerty przy spadku poniżej celów
- Wykresy trendów dla wszystkich metryk
- Analiza kohortowa użytkowników

### 6.7 Kryteria powodzenia MVP

MVP zostanie uznane za sukces jeśli po 4 tygodniach od wdrożenia:
1. Współczynnik akceptacji fiszek AI wynosi minimum 75%
2. Wykorzystanie AI w tworzeniu fiszek wynosi minimum 75%
3. 30-dniowa retencja wynosi minimum 30%
4. DAU wykazuje trend wzrostowy
5. Współczynnik błędów technicznych poniżej 2%

Przy osiągnięciu tych celów produkt będzie gotowy do dalszego rozwoju i ewentualnej monetyzacji.
