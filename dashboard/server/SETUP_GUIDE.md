# Wildlife Monitoring System - Setup & Deployment Guide

## ✅ Migration Successful!

Your backend is now fully set up and running. The database has been created with all necessary tables.

---

## 🚀 Quick Start

### Server is Running
```
http://127.0.0.1:8000/
```

### Admin Panel
```
URL: http://127.0.0.1:8000/admin/
Username: admin
Password: admin123
```

### API Base URL
```
http://127.0.0.1:8000/api/
```

---

## 📋 What Was Created

### Database Tables
✅ **Core Tables:**
- `auth_user` - User accounts
- `auth_group` - User groups/roles
- `auth_permission` - Permissions

✅ **API Tables:**
- `api_iotdevice` - IoT devices (ESP32-CAM)
- `api_devicetoken` - Device authentication tokens
- `api_image` - Captured images metadata
- `api_animaldetection` - AI detection results
- `api_alert` - User alerts

✅ **Celery Tables:**
- `django_celery_beat_*` - Scheduled tasks
- `django_celery_results_*` - Task results

✅ **JWT Tables:**
- `token_blacklist_*` - Token management

---

## 🔧 Management Commands

### Run Development Server
```powershell
cd dashboard\server
python manage.py runserver
```

### Create Superuser (Additional Users)
```powershell
python manage.py createsuperuser
```

### Run Celery Worker (For AI Processing)
```powershell
# In a separate terminal
cd dashboard\server
celery -A server worker -l info
```

### Run Celery Beat (For Scheduled Tasks)
```powershell
# In another separate terminal
cd dashboard\server
celery -A server beat -l info
```

### Check Migration Status
```powershell
python manage.py showmigrations
```

### Create New Migrations (After Model Changes)
```powershell
python manage.py makemigrations
python manage.py migrate
```

---

## 🧪 Test the API

### 1. Register a New User
```powershell
curl -X POST http://127.0.0.1:8000/api/auth/register/ `
  -H "Content-Type: application/json" `
  -d '{
    \"username\": \"farmer_john\",
    \"email\": \"john@farm.com\",
    \"password\": \"SecurePass123!\",
    \"password_confirm\": \"SecurePass123!\",
    \"first_name\": \"John\",
    \"last_name\": \"Doe\"
  }'
```

### 2. Login
```powershell
curl -X POST http://127.0.0.1:8000/api/auth/login/ `
  -H "Content-Type: application/json" `
  -d '{
    \"username\": \"farmer_john\",
    \"password\": \"SecurePass123!\"
  }'
```

**Save the access token from the response!**

### 3. Register a Device
```powershell
curl -X POST http://127.0.0.1:8000/api/devices/ `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"device_id\": \"ESP32-CAM-001\",
    \"latitude\": 40.7128,
    \"longitude\": -74.0060,
    \"status\": \"active\"
  }'
```

**Save the device token from the response!**

### 4. Test Device Heartbeat
```powershell
curl -X POST http://127.0.0.1:8000/api/devices/heartbeat/ `
  -H "Authorization: Device YOUR_DEVICE_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"battery_level\": 85,
    \"signal_strength\": -45
  }'
```

### 5. Get Dashboard Stats
```powershell
curl -X GET http://127.0.0.1:8000/api/dashboard/stats/ `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Available API Endpoints

### Authentication (`/api/auth/`)
- `POST /register/` - Register user
- `POST /login/` - Get JWT tokens
- `POST /refresh/` - Refresh access token
- `POST /logout/` - Logout
- `GET /profile/` - Get user profile
- `PATCH /profile/` - Update profile
- `POST /change-password/` - Change password

### Devices (`/api/devices/`)
- `GET /` - List devices
- `POST /` - Register device
- `GET /{id}/` - Device details
- `PATCH /{id}/` - Update device
- `DELETE /{id}/` - Delete device
- `GET /{id}/token/` - Get device token
- `POST /{id}/regenerate-token/` - Regenerate token
- `POST /heartbeat/` - Device heartbeat
- `GET /{id}/images/` - Device images

### Images (`/api/images/`)
- `GET /` - List images
- `GET /{id}/` - Image details
- `POST /upload/` - Upload image (device)
- `POST /capture/` - Request manual capture

### Detections (`/api/detections/`)
- `GET /` - List detections
- `GET /{id}/` - Detection details
- `GET /summary/` - Detection statistics

### Alerts (`/api/alerts/`)
- `GET /` - List alerts
- `GET /{id}/` - Alert details
- `PATCH /{id}/` - Update alert
- `DELETE /{id}/` - Delete alert
- `POST /mark_read/` - Mark alerts as read
- `GET /unread_count/` - Unread count

### Dashboard (`/api/dashboard/`)
- `GET /stats/` - Dashboard statistics
- `GET /activity/` - Recent activity
- `GET /map/` - Device locations
- `GET /trends/` - Detection trends
- `GET /live/` - Live feed

---

## 🔐 Environment Configuration

Your `.env` file is already configured with:
```env
DEBUG=True
DB_NAME=wildlife_db
DB_USER=root
DB_PASSWORD=zoro@1324
DB_HOST=localhost
DB_PORT=3306
```

### For Production:
1. Set `DEBUG=False`
2. Update `SECRET_KEY` with a new random key
3. Configure `ALLOWED_HOSTS` with your domain
4. Set up proper CORS origins
5. Configure Redis for Celery
6. Set AI model path

---

## 📁 Project Structure

```
dashboard/server/
├── manage.py
├── requirements.txt
├── .env
├── API_DOCUMENTATION.md
├── set_admin_password.py
├── api/
│   ├── models.py              # Database models
│   ├── views.py               # API endpoints
│   ├── serializers.py         # Data serializers
│   ├── urls.py                # URL routing
│   ├── authentication.py      # Device token auth
│   ├── permissions.py         # Access control
│   ├── tasks.py               # Celery tasks
│   ├── services.py            # AI detection service
│   ├── signals.py             # Model signals
│   ├── admin.py               # Admin interface
│   ├── exceptions.py          # Error handling
│   └── throttling.py          # Rate limiting
├── server/
│   ├── settings.py            # Django configuration
│   ├── urls.py                # Main URL config
│   ├── celery.py              # Celery config
│   └── __init__.py            # Celery initialization
└── logs/
    └── .gitkeep
```

---

## 🐛 Troubleshooting

### Migration Error: "Table doesn't exist"
```powershell
# Drop and recreate database
python -c "import MySQLdb; conn = MySQLdb.connect(host='localhost', user='root', password='zoro@1324'); cursor = conn.cursor(); cursor.execute('DROP DATABASE IF EXISTS wildlife_db'); cursor.execute('CREATE DATABASE wildlife_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); conn.close()"

# Run migrations
python manage.py migrate
```

### Server Won't Start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Use different port
python manage.py runserver 8080
```

### Module Not Found Errors
```powershell
# Reinstall requirements
pip install -r requirements.txt
```

### Celery Worker Issues
```powershell
# Make sure Redis is running
# Or update CELERY_BROKER_URL in .env

# For Windows, use eventlet:
pip install eventlet
celery -A server worker -l info -P eventlet
```

---

## 🎯 Next Steps

### 1. Configure AI Model
- Place your YOLO model in: `../../best_models/best.pt`
- Or update `AI_MODEL_PATH` in `.env`

### 2. Test Image Upload
- Use the admin panel to create a device
- Upload test images via API
- Check if detections are created

### 3. Set Up Frontend
- Use API documentation to build dashboard
- Implement real-time updates with polling
- Add device map visualization

### 4. Configure ESP32-CAM
- Use device token for authentication
- Implement image upload on motion detection
- Send heartbeat every 5 minutes

### 5. Deploy to Production
- Use Gunicorn/uWSGI for WSGI
- Set up Nginx as reverse proxy
- Configure SSL certificates
- Use PostgreSQL for production DB
- Set up Redis for Celery
- Configure proper logging

---

## 📚 Documentation

- **API Documentation**: `API_DOCUMENTATION.md`
- **Django Admin**: http://127.0.0.1:8000/admin/
- **API Root**: http://127.0.0.1:8000/api/

---

## 🆘 Support

If you encounter issues:
1. Check the console output for errors
2. Review Django logs in `logs/django.log`
3. Check database connectivity
4. Verify environment variables in `.env`
5. Ensure all dependencies are installed

---

## 🎉 Success!

Your Wildlife Monitoring System backend is now fully operational!

**Admin Access:**
- URL: http://127.0.0.1:8000/admin/
- Username: `admin`
- Password: `admin123`

**API Base:**
- http://127.0.0.1:8000/api/

**Server Status:**
✅ Database connected
✅ Migrations applied
✅ Admin user created
✅ Development server running
✅ All API endpoints active

Happy coding! 🚀
