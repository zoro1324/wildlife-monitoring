# Wildlife Monitoring System

A comprehensive IoT-based wildlife monitoring platform using ESP32-CAM devices, AI-powered animal detection with YOLO, and a full-stack dashboard for real-time monitoring and analysis.

## 📋 Overview

This system enables organizations to monitor wildlife across vast areas using distributed ESP32-CAM devices equipped with PIR motion sensors. When motion is detected, the system captures images, performs real-time AI inference to identify animal species, and alerts users through SMS/WhatsApp notifications based on proximity rules.

**Key Features:**
- 🎥 Real-time wildlife image capture via ESP32-CAM
- 🤖 AI-powered animal detection and classification (YOLO-based)
- 📊 Interactive dashboard with live monitoring and analytics
- 🗺️ GPS-based device tracking and heat maps
- 🔔 Proximity alerts via SMS/WhatsApp
- 👥 Multi-user support with role-based access (public/ranger)
- 🔐 JWT-based authentication
- 📱 Responsive React frontend with Tailwind CSS

---

## 🏗️ Project Structure

```
wildlife-monitoring/
├── dashboard/                    # Main application (Django + React)
│   ├── frontend/                 # React SPA
│   │   ├── src/
│   │   │   ├── pages/           # Page components (Dashboard, LiveMonitoring, etc.)
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── context/         # React context (Auth, App, Alerts)
│   │   │   ├── services/        # API calls
│   │   │   └── utils/           # Helper functions
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── tailwind.config.js
│   ├── server/                   # Django REST API
│   │   ├── api/                 # Main app with models, views, serializers
│   │   ├── server/              # Django settings
│   │   ├── media/               # Uploaded images
│   │   ├── manage.py
│   │   └── requirements.txt
│   ├── requirements.txt          # Python dependencies
│   └── SETUP.md                  # Backend setup guide
├── esp32/                        # ESP32-CAM firmware
│   ├── ESP32CamPirMotion.ino    # Main firmware with PIR motion detection
│   ├── CameraWebServer/          # Web server implementation
│   └── README.md
├── new-models/                   # ML model training & datasets
│   ├── animals/                  # Dataset with 8 animal classes
│   ├── animal_with_noise/        # Augmented dataset with noise
│   ├── dataset/                  # Processed dataset (train/val split)
│   ├── train.ipynb              # Model training notebook
│   ├── test.ipynb               # Evaluation notebook
│   └── data.yaml                 # YOLO dataset config
├── best_models/                  # Pre-trained YOLO models
│   ├── best.pt                  # Best overall model
│   ├── best-20-e.pt             # 20-epoch variant
│   ├── best-50.pt               # 50-epoch variant
│   └── best-boar.pt             # Specialized boar detection model
└── README.md                     # This file
```

---

## 🎯 Supported Animal Classes

The system can detect and classify 8 animal species:
- 🐻 Bear
- 🦬 Bison
- 🐗 Boar
- 🐘 Elephant
- 👨 Human
- 🐆 Leopard
- 🦁 Lion
- 🐯 Tiger

---

## 🔧 System Architecture

### Component Overview

```
ESP32-CAM Devices
    ↓ (HTTP POST with image)
Django REST API
    ↓ (image processing)
YOLO Model Inference
    ↓ (detected animals)
Database (MySQL)
    ↓
React Dashboard ← WebSocket/API
    ↓
SMS/WhatsApp Alerts (Twilio)
```

### Tech Stack

**Backend:**
- Django 5.2.10
- Django REST Framework 3.15.2
- JWT Authentication (djangorestframework-simplejwt)
- MySQL Database
- Twilio (SMS/WhatsApp notifications)

**Frontend:**
- React 18.2.0
- Vite (build tool)
- Tailwind CSS
- Leaflet (maps)
- Recharts (visualizations)
- Axios (HTTP client)

**ML/Hardware:**
- YOLO11n (object detection)
- ESP32-CAM (image capture)
- PIR Sensor (motion detection)

---

## 📦 Installation & Setup

### Prerequisites

- Python 3.10+
- Node.js 16+
- MySQL 8.0+
- ESP32-CAM development board
- PIR motion sensor

### Backend Setup

1. **Create Python environment and install dependencies:**
   ```bash
   cd dashboard
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cd server
   copy .env.example .env  # Windows
   # cp .env.example .env  # Linux/Mac
   ```

   Edit `.env` with your settings:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=127.0.0.1,localhost,your-server-ip
   
   # Database
   DB_NAME=wildlife_monitoring
   DB_USER=root
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=3306
   
   # JWT Token Lifetime
   ACCESS_TOKEN_LIFETIME_MINUTES=60
   REFRESH_TOKEN_LIFETIME_DAYS=7
   
   # CORS
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   
   # Twilio (for SMS/WhatsApp alerts)
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
   ```

3. **Setup MySQL database:**
   ```sql
   CREATE DATABASE wildlife_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Run migrations and create superuser:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Start development server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd dashboard/frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

### ESP32 Setup

1. **Install Arduino IDE** and add ESP32 board support
2. **Edit configuration** in `ESP32CamPirMotion.ino`:
   ```cpp
   const char* WIFI_SSID = "your-ssid";
   const char* WIFI_PASSWORD = "your-password";
   const char* SERVER_HOST = "your-server-ip";
   const int SERVER_PORT = 8000;
   const char* DEVICE_ID = "ESP32_CAM_001";
   const int PIR_PIN = 13;
   ```

3. **Wire PIR sensor:**
   - VCC → 5V
   - GND → GND
   - OUT → GPIO 13 (or configured pin)

4. **Flash firmware:**
   - Select "AI Thinker ESP32-CAM" board
   - Enable PSRAM
   - Upload sketch

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup/` - Register new user
- `POST /api/auth/login/` - Login and get tokens
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/profile/` - Get user profile

### Device Management
- `GET /api/devices/` - List all devices
- `POST /api/devices/` - Register new device
- `GET /api/devices/{id}/` - Get device details
- `PUT /api/devices/{id}/` - Update device
- `DELETE /api/devices/{id}/` - Delete device

### Image Capture & Analysis
- `POST /api/device/capture/` - Upload captured image (from ESP32)
- `GET /api/images/` - List captured images
- `GET /api/images/{id}/` - Get image details

### Device Communication
- `POST /api/device/message/` - Send device heartbeat/status

### User Device Management
- `GET /api/my-devices/` - Get user's assigned devices
- `POST /api/my-devices/` - Add device to user
- `DELETE /api/my-devices/{device_id}/` - Remove device from user

For detailed API documentation, see [dashboard/server/API_DOCUMENTATION.md](dashboard/server/API_DOCUMENTATION.md).

---

## 📊 Database Schema

### Key Models

**User**
- Extended with `UserProfile` for additional fields
- Stores home location for proximity alerts
- Role-based (public/ranger)

**Device**
- Represents ESP32-CAM instances
- Stores GPS location and owner
- Tracks creation/update timestamps

**CapturedImage**
- Stores uploaded images from devices
- Includes original and annotated (with bounding boxes) versions
- Links to detected animal type

**DeviceMessage**
- Stores heartbeat/status messages from devices
- Timestamps for monitoring device health

---

## 🚀 Usage

### For End Users

1. **Sign up** on the dashboard at `http://your-server/`
2. **Add devices** by scanning QR codes or entering device IDs
3. **View live monitoring** dashboard with real-time animal detections
4. **Enable alerts** for specific species or proximity zones
5. **Track devices** on the map view
6. **Analyze** detection history and statistics

### For Administrators

1. Access Django admin at `/admin/`
2. Manage users, devices, and detection records
3. Monitor device health and connectivity
4. View annotated images for model validation

### For Developers

1. Train custom models: See [new-models/train.ipynb](new-models/train.ipynb)
2. Integrate new device types by extending device communication endpoints
3. Add custom alerts by extending notification system
4. Modify dashboard by updating React components

---

## 📱 Dashboard Features

### Pages

- **Dashboard** - Overview of recent detections and active devices
- **Live Monitoring** - Real-time feed from ESP32 cameras
- **Detection History** - Historical records of all detections with filters
- **Analytics** - Statistical analysis and trends
- **Map Tracking** - GPS-based device locations and detection heat maps
- **Camera Health** - Device status and connectivity monitoring
- **Alerts Center** - Manage alert rules and notifications
- **My Devices** - Assign and configure personal devices
- **Settings** - User profile and preferences

---

## 🔐 Security

- **JWT Authentication** - Stateless token-based auth with refresh tokens
- **CORS** - Configured allowed origins
- **ALLOWED_HOSTS** - Server validation to prevent host header attacks
- **Role-Based Access** - Public users vs rangers with different permissions
- **Image Validation** - File type and size checks on upload
- **Environment Variables** - Sensitive data via `.env` files

---

## 🐛 Troubleshooting

### ESP32 Connection Issues

**"DisallowedHost" error:**
- Add your server IP to `ALLOWED_HOSTS` in `.env`
- Ensure ESP32 can reach the server IP/hostname

**PIR sensor not triggering:**
- Verify GPIO pin configuration matches wiring
- Check if PIR sensor needs warm-up time
- Try with polling mode if interrupts are unstable

### Dashboard Issues

**CORS errors:**
- Verify `CORS_ALLOWED_ORIGINS` in backend `.env`
- Check frontend is calling correct API URL

**Images not uploading:**
- Check `media/` directory permissions
- Verify file size limits in Django settings
- Check database connection

### Model Inference Issues

**Low detection accuracy:**
- Use specialized model (`best-boar.pt`, `best-20-e.pt`) for specific animals
- Check image quality and lighting
- Retrain on domain-specific data

---

## 📈 ML Model Details

### Available Models

| Model | Epochs | Use Case | File |
|-------|--------|----------|------|
| best.pt | 50 | General detection | `best_models/best.pt` |
| best-50.pt | 50 | High accuracy | `best_models/best-50.pt` |
| best-20-e.pt | 20 | Fast inference | `best_models/best-20-e.pt` |
| best-boar.pt | Specialized | Boar detection | `best_models/best-boar.pt` |

### Dataset

- **Classes:** 8 animal species
- **Training Set:** Annotated wildlife images
- **Augmentation:** Noise addition to improve robustness
- **Format:** YOLO detection format (bounding box coordinates)

### Training

To train custom models:

```bash
cd new-models
jupyter notebook train.ipynb
```

Edit `data.yaml` to point to your dataset and run training cells.

---

## 📞 Notifications

### SMS/WhatsApp Alerts

Alerts are sent via Twilio when:
- Wildlife detected near user's home location
- High-threat animals (lions, tigers) detected
- Device connectivity issues

Configure Twilio:
1. Create Twilio account
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` in `.env`
3. User must enable notifications in settings

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Check documentation in `/dashboard/server/API_DOCUMENTATION.md`

---

## 🙏 Acknowledgments

- YOLO team for object detection framework
- Django and DRF communities
- React ecosystem contributors
- Twilio for communication APIs
- ESP32 and Arduino communities
