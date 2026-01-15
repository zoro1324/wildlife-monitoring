# 🦁 Wildlife Monitoring System

A comprehensive real-time wildlife detection and monitoring platform using AI-powered image classification, IoT camera devices (ESP32), and instant alert notifications. This system helps forest rangers and local communities detect and track wildlife near human settlements.

![Wildlife Monitoring](https://img.shields.io/badge/Wildlife-Monitoring-green?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django)
![YOLO](https://img.shields.io/badge/YOLOv8-Object_Detection-FF6F00?style=for-the-badge)

## 📖 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#-api-documentation)
- [User Types & Permissions](#-user-types--permissions)
- [Wildlife Detection](#-wildlife-detection)
- [Notification System](#-notification-system)
- [ESP32 Integration](#-esp32-integration)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Features

### Core Functionality
- **🎯 Real-time Wildlife Detection** - AI-powered animal classification using YOLOv8 custom-trained model
- **📷 IoT Camera Integration** - ESP32-CAM devices for remote wildlife monitoring
- **🗺️ Live Map Tracking** - Interactive map showing camera locations and recent detections
- **🔔 Instant Alerts** - WhatsApp messages and phone calls for wildlife sightings
- **📊 Analytics Dashboard** - Detection statistics, trends, and heatmaps

### User Features
- **👤 Role-based Access Control** - Rangers vs Public users with different capabilities
- **📱 Device Management** - Register, track, and manage personal camera devices
- **🏠 Home Location** - Set home coordinates to receive proximity-based alerts
- **📜 Detection History** - Browse past detections with filtering and search

### Technical Features
- **🔐 JWT Authentication** - Secure API with token-based auth and auto-refresh
- **🖼️ Image Processing** - Automatic annotation with bounding boxes
- **📡 Device Heartbeat** - Monitor camera health and connectivity status
- **🔄 Real-time Updates** - Live data synchronization across dashboard

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WILDLIFE MONITORING SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────────┐ │
│  │   ESP32-CAM  │────▶│   Django REST    │◀───▶│    React Dashboard       │ │
│  │   Devices    │     │     Backend      │     │      (Vite + TailwindCSS)│ │
│  └──────────────┘     └────────┬─────────┘     └──────────────────────────┘ │
│         │                      │                                             │
│         │              ┌───────▼───────┐                                     │
│         │              │   YOLOv8      │                                     │
│         │              │   Model       │                                     │
│         │              │  (8 classes)  │                                     │
│         │              └───────────────┘                                     │
│         │                      │                                             │
│         │              ┌───────▼───────┐     ┌─────────────────────────────┐│
│         │              │   SQLite/     │     │     Twilio Integration     ││
│         │              │   MySQL DB    │     │  • WhatsApp Alerts         ││
│         └─────────────▶│               │     │  • Phone Calls             ││
│                        └───────────────┘     └─────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Core language |
| Django | 5.2.10 | Web framework |
| Django REST Framework | 3.15.2 | API development |
| SimpleJWT | 5.4.0 | JWT authentication |
| Ultralytics | Latest | YOLO model inference |
| Twilio | 9.4.0 | WhatsApp & voice alerts |
| MySQL / SQLite | - | Database |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 5.0 | Build tool |
| TailwindCSS | 3.3.5 | Styling |
| React Router | 6.20 | Navigation |
| Leaflet | 1.9.4 | Interactive maps |
| Recharts | 2.10 | Data visualization |
| Lucide React | 0.294 | Icons |

### AI/ML
| Component | Details |
|-----------|---------|
| Model | YOLOv8s (custom-trained) |
| Classes | 8 animal types |
| Framework | Ultralytics |

---

## 📁 Project Structure

```
wildlife-monitoring/
├── 📂 dashboard/                   # Main application
│   ├── 📂 frontend/                # React frontend
│   │   ├── 📂 src/
│   │   │   ├── 📂 components/      # Reusable UI components
│   │   │   │   ├── 📂 layout/      # Layout components (Header, Sidebar)
│   │   │   │   └── 📂 ui/          # UI primitives (Button, Card, Modal)
│   │   │   ├── 📂 context/         # React Context providers
│   │   │   │   ├── AlertContext    # Alert state management
│   │   │   │   ├── AppContext      # Global app state
│   │   │   │   └── AuthContext     # Authentication state
│   │   │   ├── 📂 pages/           # Page components
│   │   │   │   ├── Dashboard       # Ranger main dashboard
│   │   │   │   ├── UserDashboard   # Public user dashboard
│   │   │   │   ├── LiveMonitoring  # Real-time camera feed
│   │   │   │   ├── MapTracking     # Interactive wildlife map
│   │   │   │   ├── DetectionHistory# Past detection records
│   │   │   │   ├── AlertsCenter    # Alert management
│   │   │   │   ├── Analytics       # Statistics & charts
│   │   │   │   ├── MyDevices       # User device management
│   │   │   │   └── DeviceSimulator # Testing tool
│   │   │   ├── 📂 services/        # API service layer
│   │   │   └── 📂 utils/           # Helper functions
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── 📂 server/                  # Django backend
│       ├── 📂 api/                 # Main API app
│       │   ├── models.py           # Database models
│       │   ├── views.py            # API endpoints
│       │   ├── serializers.py      # Data serialization
│       │   ├── notifications.py    # Twilio integration
│       │   └── urls.py             # URL routing
│       ├── 📂 media/               # Uploaded images
│       │   ├── captured_images/    # Original captures
│       │   └── annotated_images/   # YOLO-annotated
│       ├── manage.py
│       └── db.sqlite3
│
├── 📂 best_models/                 # Trained YOLO models
│   ├── best.pt                     # Primary model
│   ├── best-20-e.pt               # 20-epoch variant
│   └── best-boar.pt               # Boar-specialized
│
├── 📂 new-models/                  # Model training
│   ├── 📂 animals/                 # Training dataset
│   ├── 📂 dataset/                 # YOLO-formatted data
│   ├── train.ipynb                # Training notebook
│   └── data.yaml                  # Dataset config
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & npm
- **MySQL** (or SQLite for development)
- **Git**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zoro1324/wildlife-monitoring.git
   cd wildlife-monitoring/dashboard
   ```

2. **Create Python virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   SECRET_KEY=your-long-random-secret-key
   DEBUG=True
   ALLOWED_HOSTS=127.0.0.1,localhost
   
   # Database (MySQL)
   DB_NAME=wildlife_monitoring
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=3306
   
   # JWT Settings
   ACCESS_TOKEN_LIFETIME_MINUTES=60
   REFRESH_TOKEN_LIFETIME_DAYS=7
   
   # CORS
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   
   # Twilio (Optional - for alerts)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   TWILIO_WHATSAPP_NUMBER=+14155238886
   ```

5. **Setup database**
   ```bash
   # For MySQL, create database first:
   # CREATE DATABASE wildlife_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Seed sample data (optional)**
   ```bash
   python manage.py seed_data
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```
   
   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at `http://localhost:5173`

---

## 📚 API Documentation

Complete API documentation is available at [dashboard/server/API_DOCUMENTATION.md](dashboard/server/API_DOCUMENTATION.md)

### Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup/` | ❌ | Register new user |
| `POST` | `/api/auth/login/` | ❌ | Login (username/email/mobile) |
| `POST` | `/api/auth/logout/` | ✅ | Logout (blacklist token) |
| `GET/PUT` | `/api/auth/profile/` | ✅ | Get/update user profile |
| `GET` | `/api/device/` | ✅ | List all devices |
| `POST` | `/api/device/register/` | ❌ | Register ESP32 device |
| `PUT` | `/api/device/<id>/` | ✅ | Update device |
| `DELETE` | `/api/device/<id>/` | ✅ | Delete device |
| `POST` | `/api/device/message/` | ❌ | Device heartbeat |
| `POST` | `/api/device/capture/` | ❌ | Upload image for classification |
| `GET` | `/api/images/` | ✅ | List captured images |
| `GET/POST/DELETE` | `/api/user/devices/` | ✅ | Manage user's own devices |

### Authentication

The API uses JWT (JSON Web Token) authentication:

```bash
# Get tokens
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Use access token
curl -X GET http://localhost:8000/api/device/ \
  -H "Authorization: Bearer <access_token>"

# Refresh token
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'
```

---

## 👥 User Types & Permissions

### Ranger (Admin)
- ✅ View all devices across the system
- ✅ View all detections from all cameras
- ✅ Access analytics and reports
- ✅ Manage all devices (edit/delete)
- ✅ View camera health status
- ✅ Access device simulator for testing

### Public User
- ✅ View their own devices
- ✅ See detections from owned devices
- ✅ Receive proximity-based alerts
- ✅ Set home location for alerts
- ✅ Add/remove personal devices
- ❌ Cannot see other users' devices

---

## 🦁 Wildlife Detection

### Supported Animals

| Animal | Risk Level | Alert Priority |
|--------|------------|----------------|
| 🐅 Tiger | 🔴 High | Phone Call + WhatsApp |
| 🦁 Lion | 🔴 High | Phone Call + WhatsApp |
| 🐆 Leopard | 🔴 High | Phone Call + WhatsApp |
| 👤 Human | 🔴 High | Phone Call + WhatsApp |
| 🐘 Elephant | 🟡 Medium | WhatsApp |
| 🐻 Bear | 🟡 Medium | WhatsApp |
| 🐗 Wild Boar | 🟡 Medium | WhatsApp |
| 🦬 Bison | 🟢 Low | WhatsApp |

### Detection Flow

```
ESP32 Camera → Image Capture → POST /api/device/capture/
                                        ↓
                              YOLOv8 Classification
                                        ↓
                              Annotated Image Saved
                                        ↓
                              Send Alerts (if dangerous)
                                        ↓
                              Return Detection Result
```

---

## 📱 Notification System

### Twilio Integration

The system sends automatic alerts when wildlife is detected:

1. **WhatsApp Messages** - Sent to all users within 10km radius of detection
2. **Phone Calls** - Made to the device owner for high-risk animals

### Alert Message Example

```
🚨 WILDLIFE ALERT 🚨

Animal Detected: Tiger
Confidence: 95.2%
Device: camera-forest-01
Location: 12.971600, 77.594600

Please stay alert and take necessary precautions!

Distance from your home: 2.3 km
```

### Configuration

Add Twilio credentials to `server/.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## 📡 ESP32 Integration

### Device Registration

On startup, ESP32 devices should register with the server:

```cpp
// POST /api/device/register/
{
  "device_id": "esp32_cam_01",
  "lat": 12.9716,
  "lon": 77.5946
}
```

### Heartbeat

Send periodic status updates:

```cpp
// POST /api/device/message/
{
  "device_id": "esp32_cam_01",
  "message": "heartbeat"
}
```

### Image Upload

When motion is detected, capture and upload image:

```cpp
// POST /api/device/capture/
// Content-Type: multipart/form-data

device_id: "esp32_cam_01"
image: <binary image data>
```

See [API_DOCUMENTATION.md](dashboard/server/API_DOCUMENTATION.md#esp32-arduino-example) for complete Arduino code example.

---

## 📸 Screenshots

### Ranger Dashboard
- Live map with camera positions
- Real-time detection statistics
- Recent alerts panel
- Camera health overview

### Detection History
- Filterable detection records
- Original and annotated images
- Confidence scores
- Timestamp tracking

### Device Simulator
- Test wildlife detection without physical hardware
- Upload sample images
- View classification results

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

- **GitHub**: [@zoro1324](https://github.com/zoro1324)
- **Repository**: [wildlife-monitoring](https://github.com/zoro1324/wildlife-monitoring)

---

<p align="center">
  Made with ❤️ for Wildlife Conservation
</p>