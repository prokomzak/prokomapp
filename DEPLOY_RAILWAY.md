# Deploy na Railway

Projekt jest przygotowany jako jedna usluga: backend Python serwuje frontend oraz endpointy `/api`.

## Aktualny stan plikow deploy

Aktualizacja: 2026-07-22. Railway powinien uruchamiac projekt z katalogu glownego repozytorium:

- `Dockerfile` buduje obraz z backendem i frontendem z `outputs/prokom-panel-prototype`.
- `railway.json` wymusza builder `DOCKERFILE`.
- backend czyta port z env `PORT`, ktory Railway ustawia automatycznie.
- baza SQLite i uploady powinny trafic do Volume pod `/data`.

Jesli na GitHubie ten plik nadal pokazuje stara date, to znaczy, ze commit nie zawieral zmiany w `DEPLOY_RAILWAY.md`. Sam redeploy moze byc wywolany pustym commitem, ale GitHub nie zmieni daty konkretnego pliku, dopoki nie zmieni sie jego tresc.

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

## Wymuszenie nowego deploya

Po zmianie plikow wykonaj:

```powershell
git add Dockerfile railway.json DEPLOY_RAILWAY.md outputs/prokom-panel-prototype
git commit -m "Aktualizacja deploy Railway"
git push origin main
```

Jesli nie ma zmian w plikach, a chcesz tylko wymusic rebuild Railway:

```powershell
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin main
```

Po pushu w Railway wejdz w usluge aplikacji i sprawdz, czy najnowszy deployment pokazuje SHA ostatniego commita z GitHuba. Jesli Railway pokazuje starsze SHA, uzyj w Railway opcji redeploy dla najnowszego commita albo odlacz i ponownie wskaz repozytorium/branch `main`.

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
