# Wildlife Monitoring Dashboard - Setup Guide

## MySQL Setup

### 1. Install MySQL
- Download and install MySQL from [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
- During installation, set a root password

### 2. Create Database
Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE wildlife_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Update Database Password
Edit `server/server/settings.py` and update the MySQL password:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "wildlife_monitoring",
        "USER": "root",
        "PASSWORD": "your_password",  # Change this to your MySQL root password
        "HOST": "localhost",
        "PORT": "3306",
    }
}
```

## Python Environment Setup

### 1. Create Virtual Environment (recommended)
```bash
cd dashboard
python -m venv venv
.\venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Migrations
```bash
cd server
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Run Server
```bash
python manage.py runserver
```

## JWT Authentication

### Endpoints

1. **Get Token** (Login)
   - URL: `POST http://localhost:8000/api/token/`
   - Body:
   ```json
   {
       "username": "your_username",
       "password": "your_password"
   }
   ```
   - Response:
   ```json
   {
       "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
       "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
   }
   ```

2. **Refresh Token**
   - URL: `POST http://localhost:8000/api/token/refresh/`
   - Body:
   ```json
   {
       "refresh": "your_refresh_token"
   }
   ```

3. **Protected Endpoint (Test)**
   - URL: `GET http://localhost:8000/api/test/`
   - Headers:
   ```
   Authorization: Bearer your_access_token
   ```

### Token Configuration
- Access Token Lifetime: 60 minutes
- Refresh Token Lifetime: 1 day
- Token Type: Bearer

### Using JWT in Requests
Add the following header to your API requests:
```
Authorization: Bearer <your_access_token>
```

## CORS Configuration
The following origins are allowed:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000
- http://127.0.0.1:5173

Update `CORS_ALLOWED_ORIGINS` in settings.py if you need to add more.

## Testing

### Test Database Connection
```bash
cd server
python manage.py check
```

### Test JWT Authentication
1. Create a user via admin panel or `createsuperuser`
2. Get token:
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```
3. Use token to access protected endpoint:
```bash
curl -X GET http://localhost:8000/api/test/ \
  -H "Authorization: Bearer <your_access_token>"
```

## Troubleshooting

### MySQL Connection Error
- Verify MySQL is running
- Check credentials in settings.py
- Ensure database exists: `SHOW DATABASES;`

### mysqlclient Installation Error (Windows)
If you get an error installing mysqlclient, try:
```bash
pip install wheel
pip install mysqlclient
```

Or download a pre-built wheel from [https://www.lfd.uci.edu/~gohlke/pythonlibs/#mysqlclient](https://www.lfd.uci.edu/~gohlke/pythonlibs/#mysqlclient)

### JWT Token Issues
- Verify SECRET_KEY is set in settings.py
- Check token hasn't expired
- Ensure Bearer prefix in Authorization header
