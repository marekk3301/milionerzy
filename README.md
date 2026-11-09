# Milionerzy: Podstawy Techniki Cyfrowej 🏆

Interaktywna gra webowa inspirowana teleturniejem **Milionerzy**, zawierająca zestaw 100 pytań z podstaw techniki cyfrowej (bramki logiczne, algebra Boole'a, systemy liczbowe, sumatory, przerzutniki, rejestry, liczniki, automaty skończone, mapy Karnaugha, ALU).

---

## 🚀 Jak uruchomić grę

Masz dwie wygodne opcje:

### Opcja 1: Bezpośrednio w przeglądarce (najprościej)
Wystarczy dwukrotnie kliknąć plik **`index.html`** w eksploratorze plików Windows (otworzy się w Twojej domyślnej przeglądarce). Działa w 100% offline, bez konieczności instalowania czegokolwiek!

### Opcja 2: Za pomocą lokalnego serwera Node.js
W terminalu wpisz:
```bash
npm start
# lub
node server.js
```
A następnie otwórz w przeglądarce: [http://localhost:3000](http://localhost:3000)

---

## 🎮 Zasady i Funkcje Gry

1. **Drabinka punktów (po prawej stronie)**:
   - 12 poziomów pytań od 1 pkt do **10 pkt**.
   - Progi gwarantowane:
     - Poziom 2: **1 pkt** 🔒
     - Poziom 7: **4 pkt** 🔒
     - Poziom 12: **10 pkt** 👑
   - Aktualny poziom jest dynamicznie podświetlony pulsującą, pomarańczową belką z symbolem `◆`.

2. **Odkrywanie odpowiedzi krok po kroku**:
   - Po wylosowaniu pytania warianty odpowiedzi są ukryte.
   - Kliknięcie przycisku **„Odkryj kolejną odpowiedź”** lub naciśnięcie klawisza **`Spacja`** odkrywa po kolei odpowiedzi (A, potem B, potem C, potem D).
   - Można też od razu odsłonić wszystkie odpowiedzi przyciskiem lub klawiszem **`Tab`**.

3. **Zaznaczanie i weryfikacja odpowiedzi**:
   - Kliknij wybraną odpowiedź (lub naciśnij klawisz **`A`**, **`B`**, **`C`** lub **`D`** / **`1`**, **`2`**, **`3`**, **`4`**).
   - Odpowiedź podświetli się na **pomarańczowo** (stan zaznaczenia).
   - Kliknij **„Zatwierdź odpowiedź”** (lub wciśnij **`Enter`**).
   - Następuje dramatyczne napięcie dźwiękowo-wizualne (suspens), po czym:
     - **Zielony kolor**: poprawna odpowiedź!
     - **Czerwony kolor**: zła odpowiedź, a prawidłowy wariant podświetla się na zielono.
   - Po każdej odpowiedzi pojawia się **merytoryczne wyjaśnienie** z pliku JSON!

4. **Koła ratunkowe**:
   - **50:50 (Pół na pół)**: **W pełni funkcjonalne** – losowo odrzuca 2 błędne odpowiedzi, wyszarza się i oznacza czerwonym krzyżykiem `✕`.
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
