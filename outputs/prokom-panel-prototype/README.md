# Panel Firmowy PRO-KOM

Aplikacja webowa dla zespolu PRO-KOM z lokalnym backendem Python i wspoldzielona baza SQLite w folderze `outputs/prokom-lan-database`.

## Uruchomienie

```powershell
python outputs\prokom-panel-prototype\backend\server.py --host 0.0.0.0 --port 4173
```

Adres lokalny:

```text
http://localhost:4173/index.html
```

Po udostepnieniu komputera w sieci LAN aplikacja bedzie dostepna dla innych komputerow pod adresem serwera, docelowo `http://192.168.1.101:4173/index.html`.

## Zakres

- logowanie na konta firmowe i przypomnienie o ustawieniu hasla,
- panel administratora do zarzadzania kontami i haslami,
- tablica dnia z checklistami, powiadomieniami, decyzjami i zeszytem zmiany,
- ogloszenia z adresatami, odczytami, komentarzami i reakcjami,
- wspolna tablica zadan calej firmy,
- ewidencja czasu pracy i statusy obecnosci,
- wspolne zgloszenia, wnioski, kalendarz, baza wiedzy i czat,
- upload prawdziwych dokumentow do bazy wiedzy,
- eksport CSV aktualnych statusow czasu pracy,
- podstawowy service worker i manifest PWA.
