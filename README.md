# QR Code Scanner

A lightweight web-based QR code scanner that recognizes QR codes from uploaded images or pasted screenshots. Optimized for ARM devices (Raspberry Pi, Armbian) but works on any platform.

---

## ✨ Features

- **📁 Image Upload**: Drag & drop or click to upload images
- **📋 Paste from Clipboard**: Directly paste screenshots (Win+Shift+S → Ctrl+V)
- **📸 Screenshot Capture**: Capture screen directly (Linux/X11 only)
- **🎯 One-Click Copy**: Copy decoded QR content with a single click
- **🎨 Clean & Simple UI**: Minimalist design, focused on core functionality
- **⚡ Fast & Lightweight**: Pure Python + minimal dependencies
- **🐳 Docker Ready**: Multi-architecture Docker images
- **🛡️ Privacy-Focused**: All processing done locally, no data uploaded to cloud

---

## 📸 Screenshots

| Main Interface | Result with Copy |
|---|---|
| Clean upload/paste area | QR data with copy button |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- `pip` package manager

### Option 1: Local Installation (Windows/macOS/Linux)

```bash
# 1. Clone or download the project
cd D:\python_project\qr_code_scanner_arm   # or your path

# 2. Create virtual environment (optional but recommended)
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the application
python app.py
```

Visit: **http://localhost:5000**

---

### Option 2: Docker (Recommended for ARM)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t qr-scanner .
docker run -d -p 5000:5000 qr-scanner
```

Visit: **http://localhost:5000**

---

## 📖 How to Use

### Method 1: Upload Image
1. Click **"Choose File"** or drag & drop an image
2. Wait for automatic QR detection
3. View results with **Copy** button

### Method 2: Paste Screenshot (Recommended)
1. Press `Win+Shift+S` (Windows) or use any screenshot tool
2. Select area containing QR code
3. Switch to browser, ensure the upload area is focused
4. Press `Ctrl+V`
5. QR content is automatically decoded and displayed

### Method 3: Capture Screen (Linux/X11 only)
1. Switch to **"Screenshot Capture"** tab (if enabled)
2. Click **"Capture Screen"**
3. The full screen or selected region is captured and decoded

---

## 🔧 Configuration

### Change Port
Edit `app.py`:
```python
app.run(host='0.0.0.0', port=8080)  # Change 5000 to 8080
```

### Adjust Max Upload Size
```python
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB
```

### Custom Upload Folder
```python
UPLOAD_FOLDER = '/path/to/uploads'
```

---

## 🛠️ Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Flask 2.3.3 | Web framework |
| QR Decoding | pyzbar 0.1.9 | QR code recognition (ZBar wrapper) |
| Image Processing | Pillow 10.0 | Image handling |
| Numerical | NumPy 1.24 | Array operations |
| Screenshot | mss 9.0.1 | Fast cross-platform screenshots (optional) |
| CORS | Flask-CORS | Cross-origin resource sharing |
| Frontend | Vanilla JS + CSS | No frameworks, pure HTML/CSS/JS |

---

## 📁 Project Structure

```
qr_code_scanner_arm/
├── app.py                  # Flask application entry point
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── Dockerfile             # Multi-arch Docker image
├── docker-compose.yml     # Docker Compose config
├── qr-scanner.service     # systemd service file (Linux)
├── install.sh             # Install script (Linux/ARM)
├── run.sh                 # Run script (Linux/ARM)
├── .dockerignore          # Docker ignore patterns
├── templates/
│   ├── clean.html         # Main page (simple & clean) ⭐
│   ├── simple_test.html   # Minimal test page
│   ├── index.html         # Old version (deprecated)
│   ├── debug.html         # Debug tools
│   └── clipboard_debug.html | Clipboard diagnostic
├── static/
│   ├── style.css          # Styles
│   ├── script.js          # JavaScript logic
│   └── uploads/           # Uploaded images storage
└── docs/                  # Additional documentation
    ├── ARM_DEPLOY.md      # ARM-specific deployment
    ├── WINDOWS_DEV.md     # Windows development guide
    └── TROUBLESHOOT.md    | Troubleshooting guide
```

---

## 🔌 API Reference

### `POST /upload`
Upload an image for QR code recognition.

**Request**:
- `Content-Type: multipart/form-data`
- Field name: `image` (file)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "data": "https://example.com",
      "type": "QRCODE",
      "rect": {
        "left": 100,
        "top": 50,
        "width": 200,
        "height": 200
      }
    }
  ],
  "message": "Found 1 QR code",
  "filename": "upload.jpg"
}
```

---

### `POST /capture`
Capture screen and decode QR codes (requires X11).

**Request** (JSON, optional):
```json
{
  "region": {
    "x": 0,
    "y": 0,
    "width": 800,
    "height": 600
  }
}
```

**Response**: Same as `/upload`

**Note**: This endpoint is disabled on headless systems.

---

### `GET /health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "qr-scanner"
}
```

---

## 🐳 Docker Deployment

### Quick Start (Docker Compose)
```bash
docker-compose up -d
```

### Manual Build (Multi-arch)
```bash
# Build for current architecture
docker build -t qr-scanner .

# Build for specific platform (example: ARMv7)
docker build --platform linux/arm/v7 -t qr-scanner .

# Run
docker run -d \
  --name qr-scanner \
  -p 5000:5000 \
  -v $(pwd)/static/uploads:/app/static/uploads \
  --restart unless-stopped \
  qr-scanner
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `production` | Flask environment |
| `FLASK_DEBUG` | `0` | Debug mode (0/1) |

---

## 🖥️ Platform-Specific Notes

### Windows
- All dependencies have pre-compiled wheels (no compilation needed)
- Clipboard paste works out of the box
- Screenshot capture via `mss` works but not needed (use paste)

### Linux (Armbian/Ubuntu/Raspberry Pi OS)
```bash
# Install system dependencies for Pillow
sudo apt-get install -y \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    libzbar-dev \
    libzbar0
```

### macOS
```bash
brew install zbar
pip install -r requirements.txt
```

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'flask_cors'"
```bash
pip install flask-cors
```

### "Pillow build fails: jpeg library not found"
Install JPEG development files:
- **Ubuntu/Debian**: `sudo apt-get install libjpeg-dev`
- **RHEL/CentOS**: `sudo yum install libjpeg-devel`
- **macOS**: `brew install jpeg`

### Clipboard paste not working
1. Ensure you're on `http://localhost:5000` (not IP without HTTPS)
2. Click inside the page to give it focus
3. Check browser console (F12) for errors
4. Try the clipboard debug tool: `/clipboard-debug`

### Port 5000 already in use
Change the port in `app.py`:
```python
app.run(port=8080)
```

---

## 📊 Performance on ARM

| Device | CPU | RAM | Decode Time |
|--------|-----|-----|-------------|
| Raspberry Pi 4B | Cortex-A72 4x1.5GHz | 4GB | ~150-300ms |
| Raspberry Pi 3B+ | Cortex-A53 4x1.4GHz | 1GB | ~300-600ms |
| Orange Pi Zero 2 | Cortex-A53 4x1.5GHz | 1GB | ~250-500ms |
| Jetson Nano | Cortex-A57 4x1.43GHz | 4GB | ~80-200ms |

---

## 🔒 Security Notes

- ⚠️ **Do NOT expose to public internet** without authentication
- 🔐 For production, add reverse proxy (Nginx) with HTTPS
- 🗑️ Uploaded files are stored locally; implement cleanup if needed
- 📝 No data is sent to external servers (fully local processing)

---

## 🛠️ Development

### Enable Debug Mode
```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

### Add New Routes
Edit `app.py` - Flask follows REST conventions.

### Customize UI
Edit `templates/clean.html` and `static/style.css`.

---

## 📚 Documentation

- **ARM Deployment Guide**: `docs/ARM_DEPLOY.md`
- **Windows Development**: `docs/WINDOWS_DEV.md`
- **Troubleshooting**: `docs/TROUBLESHOOT.md`
- **API Spec**: See above section

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Acknowledgements

- **pyzbar** - ZBar wrapper for Python
- **Flask** - Micro web framework
- **Pillow** - Python Imaging Library
- **ZBar** - QR code library

---

**Made with ❤️ for ARM devices. Happy scanning!**

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Visit `/clipboard-debug` for diagnostic tools
3. Open an issue with:
   - Platform (OS, architecture)
   - Python version
   - Browser console logs
   - Flask server logs

---

**Quick Links**:
- Homepage: `/`
- Health Check: `/health`
- Debug Tools: `/debug`
- Clipboard Debug: `/clipboard-debug`
