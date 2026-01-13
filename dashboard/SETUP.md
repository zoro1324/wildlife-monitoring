# Wildlife Monitoring Dashboard - Backend Setup (Decouple + MySQL + JWT)

## 1) Python environment

```powershell
cd d:\wildlife-monitoring\dashboard
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Environment variables
Copy the template and edit values:

```powershell
cd server
Copy-Item .env.example .env
# Edit .env and set SECRET_KEY and DB_* values
```

Required keys in `server/.env`:
- `SECRET_KEY` — a long random string
- `DEBUG` — `True` or `False`
- `ALLOWED_HOSTS` — comma-separated hosts, e.g. `127.0.0.1,localhost`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `ACCESS_TOKEN_LIFETIME_MINUTES`, `REFRESH_TOKEN_LIFETIME_DAYS`
- `CORS_ALLOWED_ORIGINS` — comma-separated list of allowed origins

## 3) MySQL
Create the database in MySQL:

```sql
CREATE DATABASE wildlife_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4) Django migrations and run

```powershell
cd d:\wildlife-monitoring\dashboard\server
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 5) JWT endpoints
- POST /api/token/ — obtain access and refresh tokens
- POST /api/token/refresh/ — refresh access token
- GET /api/test/ — protected test endpoint (requires Authorization: Bearer <access>)

## Notes
- Uses python-decouple to read server/.env.
- MySQL uses mysqlclient. If installing on Windows is problematic, install a pre-built wheel or use WSL.
