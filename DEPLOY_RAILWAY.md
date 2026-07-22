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
