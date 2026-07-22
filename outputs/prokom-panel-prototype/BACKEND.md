# Backend LAN PRO-KOM

Rozpoczety etap backendu znajduje sie w katalogu `backend/`.

Backend nie wymaga instalowania paczek npm. Korzysta z Pythona i plikowej bazy SQLite:

```text
outputs\prokom-lan-database\prokom-lan.sqlite3
```

Wspolne dane obejmuja konta, ogloszenia, zadania, zgloszenia, czat, kalendarz, baze wiedzy i zeszyt zmiany.

## Uruchomienie

Na komputerze-serwerze uruchom:

```powershell
.\start-backend.ps1
```

Albo bezposrednio:

```powershell
python .\backend\server.py --host 0.0.0.0 --port 4173
```

Po uruchomieniu inne komputery w tej samej sieci beda mogly wejsc na aplikacje przez adres komputera-serwera, docelowo:

```text
http://192.168.1.101:4173
```

## Endpointy API

- `GET /api/health`
- `GET /api/accounts`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `PATCH /api/password`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:login`
- `PATCH /api/users/:login/password`
- `DELETE /api/users/:login`
- `PATCH /api/time/presence`
- `GET /api/announcements`
- `POST /api/announcements`
- `POST /api/announcements/:id/read`
- `POST /api/announcements/:id/comments`
- `POST /api/announcements/:id/reactions`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/reports`
- `POST /api/reports`
- `PATCH /api/reports/:id`
- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/:id`
- `GET /api/calendar`
- `POST /api/calendar`
- `POST /api/calendar/:id/rsvp`
- `GET /api/knowledge`
- `POST /api/knowledge/articles` - formularz `multipart/form-data` z plikiem dokumentu.
- `GET /api/knowledge/articles/:id/download`
- `POST /api/knowledge/handover`
- `POST /api/knowledge/handover/:id/accept`
- `DELETE /api/knowledge/handover/:id`
- `GET /api/chat/groups`
- `POST /api/chat/groups`
- `GET /api/chat/messages?conversationId=...`
- `POST /api/chat/messages`
- `POST /api/chat/messages/read`

## Konta startowe

- `root` / `root1234` - pelny dostep aplikacyjny do SQL i zarzadzania uzytkownikami.
- `tadeusz` - administrator aplikacji bez hasla startowego.
- `krystian`, `kuba`, `pawel` - konta pracownikow bez hasla startowego.

## Uwagi

- Konto `root` jest chronione przed usunieciem.
- Uzytkownicy bez hasla widza wymagane powiadomienie o ustawieniu wlasnego hasla.
- Hasla sa przechowywane w bazie jako hash PBKDF2.
- Frontend probuje korzystac z backendu automatycznie. Jesli `/api/accounts` nie odpowiada, aplikacja wraca do trybu lokalnego opartego o `data.js` i `localStorage`.
- Pliku SQLite nie nalezy udostepniac jako folderu sieciowego. Dostep do niego powinien miec tylko backend uruchomiony na komputerze-serwerze.
