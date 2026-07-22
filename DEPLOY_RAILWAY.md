# Deploy na Railway

Projekt jest przygotowany jako jedna usluga: backend Python serwuje frontend oraz endpointy `/api`.

## Wymagane ustawienia Railway

1. Utworz projekt z repozytorium GitHub.
2. Railway powinien wykryc `Dockerfile` w katalogu glownym.
3. Dodaj Volume i zamontuj go jako:

```text
/data
```

4. W `Variables` ustaw:

```env
PROKOM_DATA_DIR=/data
PROKOM_HOST=0.0.0.0
```

Railway ustawia `PORT` automatycznie. Backend odczytuje `PORT`, a gdy go nie ma, wraca do `PROKOM_PORT` lub lokalnego portu `4173`.

## Dane trwale

Po ustawieniu `PROKOM_DATA_DIR=/data` backend zapisuje:

```text
/data/prokom-lan.sqlite3
/data/.session-secret
/data/uploads/
```

Bez Volume katalog `/data` bedzie nietrwaly po redeployu lub restarcie uslugi.

## Problem: unable to open database file

Jesli Railway pokazuje blad SQLite `unable to open database file`, sprawdz:

1. Volume jest podlaczony do tej samej uslugi co backend.
2. Mount path Volume to dokladnie:

```text
/data
```

3. W `Variables` istnieje:

```env
PROKOM_DATA_DIR=/data
```

4. Po zmianie Dockerfile wykonaj redeploy z czyszczeniem cache/build cache, jesli Railway dalej uruchamia stary obraz.

Railway montuje Volume podczas startu kontenera. Ten Dockerfile uruchamia backend bez przelaczania na osobnego uzytkownika systemowego, zeby proces Pythona mial prawo zapisu do `/data`.

## Lokalny test podobny do Railway

```powershell
$env:PROKOM_DATA_DIR=\"C:\\temp\\prokom-data\"
$env:PORT=\"4173\"
python outputs\\prokom-panel-prototype\\backend\\server.py
```

Adres:

```text
http://localhost:4173/
```
