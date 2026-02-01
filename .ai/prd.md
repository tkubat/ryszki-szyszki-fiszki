# Dokument wymagań produktu (PRD) - Lodówka → Przepis
## 1. Przegląd produktu
- Cel: webowa aplikacja, która generuje prosty przepis (tytuł + lista kroków) na podstawie składników w lodówce, zapisuje go dla zalogowanego użytkownika i pozwala oznaczyć, czy przepis był pomocny (kciuk w górę).
- Grupa docelowa: osoby gotujące w domu, które chcą szybko wykorzystać dostępne składniki bez przeszukiwania internetu.
- Zakres MVP: wejście listy składników (min. 3), ewentualne uzupełnienie o stałą listę podstaw kuchennych, pojedyncze wywołanie AI zwracające 1 przepis, automatyczne zapisanie, przegląd zapisów, polubienie, proste konta (rejestracja, logowanie). Brak diet/filtrów, brak edycji, brak współdzielenia, tylko web.
- Ograniczenia: generowanie do 1 minuty; jedna osoba + kilka godzin pracy z pomocą AI; brak integracji zewnętrznych poza modelem AI; brak aplikacji mobilnej.

## 2. Problem użytkownika
- Użytkownik ma kilka produktów i nie wie, co z nich ugotować; szukanie przepisu ręcznie jest czasochłonne i zniechęcające, co obniża chęć gotowania.
- Użytkownik potrzebuje natychmiastowej, prostej podpowiedzi, jak wykorzystać posiadane składniki, bez dodatkowej konfiguracji czy filtrowania.

## 3. Wymagania funkcjonalne
- Wejście składników: pole tekstowe z listą składników rozdzielonych przecinkami; wymagane min. 3 składniki; opcjonalne automatyczne dodanie stałej listy „podstaw kuchennych” (np. sól, pieprz, olej).
- Generowanie przepisu: pojedyncze żądanie do AI; wynik zawiera tylko tytuł i listę kroków; czas odpowiedzi do 60 s; w razie błędu lub timeoutu użytkownik dostaje komunikat i opcję ponowienia.
- Automatyczne zapisywanie: każdy wygenerowany przepis zapisuje się na koncie użytkownika z danymi wejściowymi, treścią przepisu, datą utworzenia i flagą polubienia (domyślnie brak).
- Przeglądanie: lista zapisanych przepisów bez filtrów, sortowana malejąco po created_at; dostęp przez stały punkt nawigacji „Moje przepisy”.
- Polubienie: użytkownik może oznaczyć przepis kciukiem w górę (toggle), zapisywane trwale.
- Konta: rejestracja i logowanie; sesja zapewnia dostęp do zapisów; brak resetu hasła w MVP.
- Nawigacja: prosty widok wejścia (generowanie) oraz widok listy zapisów; powrót do generowania z listy.
- Obserwowalność: logowanie czasu generowania i statusu powodzenia/niepowodzenia na potrzeby pomiaru KPI.

## 4. Granice produktu
- W zakresie: generowanie 1 przepisu na podstawie składników (min. 3) z użyciem listy podstaw kuchennych, automatyczne zapisywanie, przegląd zapisów (sort po dacie), polubienie, rejestracja/logowanie, prosty web.
- Poza zakresem MVP: ręczne tworzenie lub edycja przepisów, współdzielenie, filtry dietetyczne/alergie, wiele wariantów przepisu, integracje zewnętrzne, aplikacje mobilne, reset hasła, zaawansowana moderacja treści.
- Założenia: stała lista podstaw kuchennych utrzymywana w kodzie/konfiguracji; brak walidacji poprawności składników poza wymogiem ilości; brak paginacji (lista ograniczona do realnych potrzeb MVP).
- Otwarte kwestie: dokładna zawartość listy podstaw i możliwość jej edycji; wymagania bezpieczeństwa kont (np. reset hasła, weryfikacja e-mail); finalny UX pola wejściowego i przykładowych podpowiedzi; priorytety testów jakości generacji.

## 5. Historyjki użytkowników
- ID: US-001  
  Tytuł: Rejestracja konta  
  Opis: Jako nowy użytkownik chcę założyć konto, aby moje przepisy były przypisane do mnie.  
  Kryteria akceptacji: formularz rejestracji przyjmuje e-mail i hasło; po poprawnym przesłaniu tworzony jest użytkownik i następuje zalogowanie; w razie błędu otrzymuję jasny komunikat.

- ID: US-002  
  Tytuł: Logowanie  
  Opis: Jako istniejący użytkownik chcę się zalogować, aby uzyskać dostęp do moich zapisanych przepisów.  
  Kryteria akceptacji: formularz logowania przyjmuje poprawne dane i tworzy sesję; błędne dane zwracają komunikat; po zalogowaniu widoczny jest przycisk „Moje przepisy”.

- ID: US-003  
  Tytuł: Minimalna liczba składników  
  Opis: Jako użytkownik chcę wiedzieć, że potrzebuję co najmniej 3 składników, aby system wygenerował przepis.  
  Kryteria akceptacji: przy próbie wysłania mniej niż 3 składników widzę komunikat o wymaganiu minimum 3; wysłanie 3 lub więcej przechodzi do generowania.

- ID: US-004  
  Tytuł: Dodanie listy składników i generowanie przepisu  
  Opis: Jako użytkownik chcę wpisać listę składników i otrzymać jeden przepis dostosowany do nich.  
  Kryteria akceptacji: mogę wpisać składniki rozdzielone przecinkami; po wysłaniu wywoływane jest generowanie; wynik zawiera tytuł i listę kroków; operacja kończy się w maks. 60 s lub zwraca komunikat o błędzie.

- ID: US-005  
  Tytuł: Uwzględnienie podstaw kuchennych  
  Opis: Jako użytkownik chcę, by system automatycznie uwzględnił podstawowe składniki kuchenne, aby przepis był kompletny.  
  Kryteria akceptacji: podczas generowania system dodaje stałą listę podstaw (np. sól, olej); w razie braku podstaw w wejściu przepis może je wykorzystać; użytkownik nie musi ich wpisywać ręcznie.

- ID: US-006  
  Tytuł: Obsługa błędu/timeoutu generowania  
  Opis: Jako użytkownik chcę otrzymać jasną informację, gdy generowanie się nie powiedzie lub przekroczy limit czasu.  
  Kryteria akceptacji: gdy generowanie trwa dłużej niż 60 s lub zwróci błąd, widzę komunikat z opcją ponowienia; brak utraty wprowadzonej listy składników.

- ID: US-007  
  Tytuł: Automatyczne zapisanie przepisu  
  Opis: Jako użytkownik chcę, by każdy wygenerowany przepis został zapisany automatycznie na moim koncie.  
  Kryteria akceptacji: po udanym generowaniu przepis zapisuje się z tytułem, krokami, wejściem użytkownika, datą utworzenia i flagą polubienia (false); zapis następuje bez dodatkowego działania.

- ID: US-008  
  Tytuł: Przegląd zapisanych przepisów  
  Opis: Jako użytkownik chcę przeglądać listę moich przepisów w kolejności od najnowszych.  
  Kryteria akceptacji: lista pokazuje wszystkie zapisane przepisy, sortowane malejąco po created_at; brak filtrów; każdy wpis pokazuje tytuł i informację o polubieniu; dostęp przez nawigację „Moje przepisy”.

- ID: US-009  
  Tytuł: Polubienie przepisu  
  Opis: Jako użytkownik chcę oznaczyć przepis kciukiem w górę, aby wskazać, że był pomocny.  
  Kryteria akceptacji: na karcie/listingu przepisu dostępny jest toggle polubienia; stan zapisuje się trwale i jest widoczny przy ponownym wejściu; polubienie można cofnąć.

- ID: US-010  
  Tytuł: Nawigacja między generowaniem a listą zapisów  
  Opis: Jako użytkownik chcę łatwo przechodzić między ekranem generowania a listą „Moje przepisy”.  
  Kryteria akceptacji: stały element nawigacji prowadzi do listy zapisów; z listy mogę wrócić do ekranu generowania jednym kliknięciem.

- ID: US-011  
  Tytuł: Bezpieczny dostęp do zapisów  
  Opis: Jako użytkownik chcę, aby moje zapisane przepisy były widoczne tylko po zalogowaniu.  
  Kryteria akceptacji: próba wejścia na listę zapisów bez sesji kieruje do logowania; po wylogowaniu (lub wygaśnięciu sesji) dostęp wymaga ponownego logowania; przepisy są powiązane z userId.

## 6. Metryki sukcesu
- Akceptacja przepisów: cel 50% zapisanych przepisów z oznaczeniem polubienia (kciuk w górę) na użytkownika.
- Czas generowania: p95 czasu odpowiedzi poniżej 60 s; logowanie czasu każdej próby generowania.
- Użycie funkcji: liczba wygenerowanych i zapisanych przepisów na użytkownika; odsetek sesji, w których użytkownik wraca do „Moich przepisów”.
- Stabilność: odsetek nieudanych generowań poniżej uzgodnionego progu (np. 5%) w MVP.
