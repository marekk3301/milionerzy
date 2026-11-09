# Milionerzy: Technika Cyfrowa, Elektronika i Systemy Wbudowane 🏆

Interaktywna gra webowa inspirowana teleturniejem **Milionerzy**, zawierająca zestaw **230 pytań** (w tym 30 pytań z ilustracjami schematów i płytek rozwojowych) z zakresu techniki cyfrowej, elektroniki, mikrokontrolerów RP2040, ESP32, Arduino, CircuitPython oraz algebry Boole'a.

---

## 🚀 Jak uruchomić grę

Masz dwie wygodne opcje:

### Opcja 1: Bezpośrednio w przeglądarce (najprościej)
Wystarczy dwukrotnie kliknąć plik **`index.html`** (lub uruchomić **`start.bat`**). Działa w 100% offline, bez konieczności instalowania czegokolwiek!

### Opcja 2: Za pomocą lokalnego serwera Node.js
W terminalu wpisz:
```bash
npm start
# lub
node server.js
```
A następnie otwórz w przeglądarce: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Panel Zarządzania i Edycji Pytań (`editor.html`)

Aplikacja posiada pełny, wbudowany **frontend do przeglądania, edycji i usuwania pytań**:
- Dostępny pod przyciskiem **„✏️ Baza pytań”** w nagłówku lub bezpośrednio: [`editor.html`](file:///c:/Users/marekk3301/Documents/Github%20Projects/swb_milionerzy/editor.html).
- **Lista pytań**: przeglądaj wszystkie pytania z podglądem odpowiedzi i wyróżnieniem poprawnej.
- **Wyszukiwanie i filtry**: filtruj pytania po poziomie (1–12), kategorii, treści oraz fladze *„Tylko z obrazkiem”*.
- **Nawigacja strzałkami**: przyciski **`⬅ Poprzednie`** i **`Następne ➡`** (oraz skróty klawiaturowe: `Strzałka w lewo` / `Strzałka w prawo`).
- **Edycja**: edytuj treść pytania, poziom, kategorię, adres i źródło obrazka, warianty odpowiedzi A–D (z wyborem poprawnej) oraz wyjaśnienie.
- **Usuwanie**: przycisk **`🗑️ Usuń to pytanie`** pozwala bezpiecznie usunąć dowolne pytanie z bazy po potwierdzeniu.
- **Dodawanie i duplikowanie**: przyciski **`➕ Nowe pytanie`** oraz **`📋 Duplikuj`**.
- **Działanie na GitHub Pages i lokalnie**:
  - Na GitHub Pages zmiany zapisują się w pamięci przeglądarki (`localStorage`) i od razu działają w grze, a przycisk **„📥 Pobierz JSON”** pozwala pobrać zaktualizowany plik `milionerzy.json`.
  - Przy uruchomieniu lokalnym z `node server.js` dostępny jest dodatkowo przycisk **„⚡ Zapisz na dysku”**, który bezpośrednio aktualizuje pliki na komputerze.

---

## 🎮 Zasady i Funkcje Gry

1. **Pytania z ilustracjami (schematy, bramki, płytki)**:
   - Pytania zawierające grafikę wyświetlają estetyczną ramkę z obrazkiem na jasnym tle (zapewniającym doskonałą czytelność symboli i czarnych linii schematów).
   - Kliknięcie w obrazek otwiera **powiększony podgląd (lightbox)** na pełnym ekranie z podaniem źródła.

2. **Drabinka punktów (po prawej stronie)**:
   - 12 poziomów pytań od 1 pkt do **10 pkt**.
   - Progi gwarantowane:
     - Poziom 2: **1 pkt** 🔒
     - Poziom 7: **4 pkt** 🔒
     - Poziom 12: **10 pkt** 👑
   - Aktualny poziom jest dynamicznie podświetlony pulsującą, pomarańczową belką z symbolem `◆`.

3. **Odkrywanie odpowiedzi krok po kroku**:
   - Po wylosowaniu pytania warianty odpowiedzi są ukryte.
   - Kliknięcie przycisku **„Odkryj kolejną odpowiedź”** lub naciśnięcie klawisza **`Spacja`** odkrywa po kolei odpowiedzi (A, potem B, potem C, potem D).
   - Można też od razu odsłonić wszystkie odpowiedzi przyciskiem lub klawiszem **`Tab`**.

4. **Zaznaczanie i weryfikacja odpowiedzi**:
   - Kliknij wybraną odpowiedź (lub naciśnij klawisz **`A`**, **`B`**, **`C`** lub **`D`** / **`1`**, **`2`**, **`3`**, **`4`**).
   - Odpowiedź podświetli się na **pomarańczowo** (stan zaznaczenia).
   - Kliknij **„Zatwierdź odpowiedź”** (lub wciśnij **`Enter`**).
   - Po sprawdzeniu:
     - **Zielony kolor**: poprawna odpowiedź!
     - **Czerwony kolor**: zła odpowiedź, a prawidłowy wariant podświetla się na zielono.
   - Wyświetla się **merytoryczne wyjaśnienie** pytania!

5. **Koła ratunkowe**:
   - **50:50 (Pół na pół)**: **w pełni funkcjonalne** – losowo odrzuca 2 błędne odpowiedzi, wyszarza się i oznacza czerwonym krzyżykiem `✕`.
   - **Telefon do przyjaciela (📞)**: wyszarza się po kliknięciu.
   - **Pytanie do publiczności (👥)**: wyszarza się po kliknięciu.

6. **Efekty dźwiękowe (Web Audio API)**:
   - Wbudowany syntezator Web Audio API (działa w 100% offline bez plików mp3/wav).
   - Dźwięki: odkrywanie odpowiedzi, kliknięcie zaznaczenia, napięcie/suspens, poprawna odpowiedź, błąd, użycie koła ratunkowego oraz fanfara wygranej 10 pkt z konfetti.
   - Przełącznik wyciszenia 🔊 / 🔇 w nagłówku.

7. **Pamięć sesji i ochrona przed powtórkami pytań**:
   - Wylosowane pytania są automatycznie wykreślane i zapamiętywane w `localStorage`.
   - Przycisk **`🗑️ (X/230)`** w nagłówku pozwala jednym kliknięciem zresetować historię wylosowanych pytań.
   - **Telefon do przyjaciela (📞)**: wyszarza się po kliknięciu i informuje o użyciu koła.
   - **Pytanie do publiczności (👥)**: wyszarza się po kliknięciu i informuje o użyciu koła.

5. **Efekty dźwiękowe (Web Audio API)**:
   - Wbudowany syntezator dźwięku Web Audio API (działa w 100% offline bez żadnych zewnętrznych plików mp3/wav).
   - Dźwięki: odkrywanie odpowiedzi, kliknięcie zaznaczenia, napięcie/suspens, poprawna odpowiedź, błąd, użycie koła ratunkowego oraz wielka fanfara wygranej 1 000 000 zł.
   - Możliwość wyciszenia/włączenia dźwięku przyciskiem 🔊 / 🔇 w nagłówku.

6. **Zarządzanie pulą pytań i pamięć sesji**:
   - Po wylosowaniu pytanie jest automatycznie **wykreślane z puli** i zapisywane w `localStorage`, dzięki czemu kolejny gracz nie trafi na te same pytania.
   - Pula pytań nie znika po odświeżeniu strony ani po zamknięciu przeglądarki.
   - W nagłówku znajduje się przycisk **„🗑️ Reset sesji (X/200)”**, który pozwala jednym kliknięciem odkreślić wszystkie zadane pytania i zresetować pulę.
   - W dowolnym momencie przed zaznaczeniem błędnej odpowiedzi można kliknąć **„💾 Zachowaj punkty”**, aby bezpiecznie odejść ze zdobytymi punktami, lub **„🔄 Nowa gra”**, aby rozpocząć grę dla kolejnego gracza.

---

## ⌨️ Skróty klawiszowe

| Klawisz | Akcja |
| :--- | :--- |
| **`Spacja`** | Odkryj kolejną odpowiedź / Następne pytanie (po sprawdzeniu) |
| **`Tab`** | Odkryj od razu wszystkie 4 odpowiedzi |
| **`A` / `1`** | Zaznacz odpowiedź A |
| **`B` / `2`** | Zaznacz odpowiedź B |
| **`C` / `3`** | Zaznacz odpowiedź C |
| **`D` / `4`** | Zaznacz odpowiedź D |
| **`Enter`** | Zatwierdź zaznaczoną odpowiedź / Następne pytanie |
