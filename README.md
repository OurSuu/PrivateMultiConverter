# Private Multi-Converter

A premium full-stack web application for file conversion, YouTube downloading, and QR code generation with a split architecture (Frontend on Vercel, Backend self-hosted).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![Version](https://img.shields.io/badge/version-2.0.0-gold.svg)

## ✨ Features

### 🔄 File Converter
- **MP4 → MP3**: Extract audio from video files
- **PNG/JPG → WebP**: Convert images to modern WebP format
- **PDF → JPG**: Convert PDF documents to images
- **DOCX → PDF**: Convert Word documents to PDF

### 📺 YouTube Downloader (via yt-dlp)
- **Audio Only**: Extract as MP3
- **Video + Audio**: Download merged MP4
- **Video Only**: No audio (for editing)
- **Separate Files**: Video + Audio as separate downloads

### 📱 QR Code Generator
- Generate QR codes from any URL, text, WiFi credentials, or email
- **Custom Colors**: Choose foreground and background colors
- **Color Presets**: Classic, Gold, Navy, Forest, Wine
- **Size Options**: 128px to 1024px
- **Copy to Clipboard**: One-click copy functionality
- Download as PNG

## 🎨 UI Features
- **Dark + Gold Luxury Theme**: Premium glassmorphism design
- **Keyboard Shortcuts**: `Ctrl+1/2/3` to switch tabs
- **Server Status Indicator**: Real-time backend connectivity
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Works on desktop and mobile
- **Animated Background**: Floating gold particles

## 🛠 Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Processing** | FFmpeg, Sharp, yt-dlp, QRCode |

---

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** 18+ installed
- **FFmpeg** installed and in PATH
- **yt-dlp** installed and in PATH (for YouTube downloads)
- **LibreOffice** (optional, for DOCX→PDF conversion)

### Installing FFmpeg

```bash
# Windows (using winget)
winget install FFmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### Installing yt-dlp

```bash
# Using pip (all platforms)
pip install yt-dlp

# Windows using winget
winget install yt-dlp

# macOS using Homebrew
brew install yt-dlp
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/OurSuu/PrivateMultiConverter.git
cd PrivateMultiConverter
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
API_KEY=your-secret-api-key-change-me
MAX_FILE_SIZE=104857600
TEMP_DIR=./temp
CLEANUP_INTERVAL_MINUTES=30
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_API_KEY=your-secret-api-key-change-me
```

### 4. Run Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📁 Project Structure

```
private-multi-converter/
├── frontend/                 # React frontend (Vercel-ready)
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── FileConverter.tsx
│   │   │   ├── YouTubeDownloader.tsx
│   │   │   ├── QRCodeGenerator.tsx
│   │   │   ├── NotificationToast.tsx
│   │   │   └── ...
│   │   ├── services/        # API service
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Express backend (self-hosted)
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── middleware/      # Auth, rate limiting, upload
│   │   ├── routes/          # API routes
│   │   ├── services/        # Conversion logic
│   │   └── utils/           # Cleanup utilities
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## 🔐 Security Features

- ✅ **API Key Authentication**: All requests require valid `x-api-key` header
- ✅ **Rate Limiting**: 100 requests per 15 minutes per IP
- ✅ **File Size Limit**: 100MB maximum upload
- ✅ **File Type Whitelist**: Only allowed file types accepted
- ✅ **Auto Cleanup**: Temp files deleted after 30 minutes
- ✅ **Graceful Shutdown**: Clean exit on process termination
- ✅ **CORS Protection**: Configurable origin whitelist

---

## 🔌 API Endpoints

### File Conversion
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/convert` | Upload and convert file |
| GET | `/api/convert/status/:jobId` | Check conversion status |
| GET | `/api/convert/download/:filename` | Download converted file |

### YouTube
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/youtube/info` | Get video info (preview) |
| POST | `/api/youtube/download` | Start YouTube download |
| GET | `/api/youtube/status/:jobId` | Check download status |
| GET | `/api/youtube/file/:filename` | Download file |

### QR Code
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qrcode/generate` | Generate QR code (data URL) |
| POST | `/api/qrcode/download` | Generate and download PNG |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Switch to File Converter |
| `Ctrl+2` | Switch to YouTube Downloader |
| `Ctrl+3` | Switch to QR Code Generator |

---

## 🚀 Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your backend URL
   - `VITE_API_KEY`: Your API key

### Backend → Self-Hosted (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Build and start
cd backend
npm run build
pm2 start dist/index.js --name "multi-converter"

# Save and setup startup
pm2 save
pm2 startup
```

---

## 🐛 Troubleshooting

### FFmpeg not found
```bash
ffmpeg -version  # Should output version info
```

### YouTube download fails
- Ensure yt-dlp is installed: `yt-dlp --version`
- Update yt-dlp: `yt-dlp -U` or `pip install -U yt-dlp`

### PDF to JPG not working
Requires libvips with poppler support:
```bash
# Ubuntu
sudo apt install libvips-dev poppler-utils

# macOS
brew install vips poppler
```

### DOCX to PDF not working
Requires LibreOffice:
```bash
# Ubuntu
sudo apt install libreoffice

# macOS
brew install --cask libreoffice
```

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

Made with ❤️ and ✨
