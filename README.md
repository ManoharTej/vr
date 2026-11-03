# StyleSpeak

**Voice-Controlled Augmented Reality Virtual Outfit Try-On and Fashion Assistance System**

> A browser-based fashion technology prototype demonstrating four interconnected modules: live image capture, virtual garment visualization, voice-controlled interaction and occasion-based outfit recommendations.

---

## Live Demo (Frontend Only)

The frontend runs entirely in the browser with no server required.

1. Open `index.html` in Chrome or Edge (**must be served over localhost or HTTPS for camera/voice APIs**)
2. Use a local static server:

```bash
# Option 1 — Python (any machine with Python 3)
cd c:\Users\manoh\Downloads\vr
python -m http.server 5500
# Then open: http://localhost:5500

# Option 2 — Node / npx
npx serve .

# Option 3 — VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

---

## Full Stack Setup (Frontend + FastAPI Backend)

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10 or newer |
| pip | latest |
| Chrome or Edge | latest (for voice / camera) |

---

### 1. Clone / Navigate to the Project

```bash
cd c:\Users\manoh\Downloads\vr
```

---

### 2. Set Up the Python Backend

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### 3. Configure Environment Variables

```bash
# Copy the example file
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux

# Edit .env if needed (defaults work out of the box)
```

---

### 4. Start the FastAPI Backend

```bash
# From inside backend/ with venv active
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **API root:** `http://localhost:8000`
- **Interactive docs:** `http://localhost:8000/docs`
- **Health check:** `http://localhost:8000/api/health`

---

### 5. Start the Frontend

Open a new terminal:

```bash
cd c:\Users\manoh\Downloads\vr
python -m http.server 5500
```

Open **http://localhost:5500** in Chrome or Edge.

The frontend automatically detects whether the backend is online and shows the status in Settings.

---

## Four Core Modules

### 01 · User Input & Image Capture
- Live webcam via `getUserMedia`
- Photo upload (JPEG, PNG, WebP — up to 10 MB)
- Camera/upload toggle, retake, remove controls
- Body guide frame overlay

### 02 · Virtual Outfit Try-On
- 5 garment categories: tops, dresses, jackets, tees, kurtas
- 7+ colour swatches with hex values
- Adjustable position (horizontal) and scale sliders
- Optional MediaPipe Pose landmark detection (requires webcam)
- DEMO MODE (SVG overlay) — works without any model files
- AI MODE ready (module stub for IDM-VTON / CatVTON integration)

### 03 · Voice-Controlled Interaction
- Web Speech API (Chrome/Edge)
- Colour commands: *"change to red"*, *"make it navy"*
- Garment commands: *"show a dress"*, *"try a jacket"*
- Voice feedback via SpeechSynthesis
- Manual fallback controls when mic unavailable

#### Example Voice Commands
| Command | Action |
|---------|--------|
| "Show me a red dress" | Switches to dress category, applies red |
| "Change to navy" | Changes colour to navy |
| "Try a jacket" | Switches to jacket category |
| "Show a black shirt" | Switches to top, applies black |
| "Reset my outfit" | Resets preview |
| "Go to recommendations" | Navigates to Fashion Assistant |

### 04 · Smart Fashion Assistant
- 10 occasion types (College, Interview, Office, Wedding, Party, Birthday, Date, Festival, Casual, Traditional)
- Style preference filter (Minimal, Classic, Bold, Traditional)
- Weather/comfort filter
- Garment + colour recommendations
- Accessory suggestions
- "Try this outfit" → loads directly in Virtual Studio

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/garments` | List all garments (optional `?category=` filter) |
| `GET` | `/api/garments/{id}` | Get a single garment |
| `POST` | `/api/upload` | Upload a user photograph |
| `POST` | `/api/tryon` | Request virtual try-on |
| `POST` | `/api/voice/command` | Process a voice transcript |
| `POST` | `/api/recommendations` | Get occasion-based outfit recommendation |

Full interactive documentation at `http://localhost:8000/docs` (Swagger UI).

---

## Project Structure

```
voice-ar-fashion/
│
├── index.html            ← SPA frontend (4 modules)
├── styles.css            ← Premium lavender/charcoal design system
├── app.js                ← All frontend logic + voice + pose detection
│
├── backend/
│   ├── main.py           ← FastAPI app entry point
│   ├── database.py       ← SQLAlchemy setup
│   ├── requirements.txt  ← Python dependencies
│   ├── .env.example      ← Environment variable template
│   │
│   ├── routes/
│   │   ├── garments.py   ← GET /garments, GET /garments/{id}
│   │   ├── upload.py     ← POST /upload
│   │   ├── tryon.py      ← POST /tryon
│   │   ├── voice.py      ← POST /voice/command
│   │   └── recommendations.py ← POST /recommendations
│   │
│   ├── models/
│   │   └── garment.py    ← SQLAlchemy ORM model
│   │
│   ├── schemas/
│   │   └── schemas.py    ← Pydantic v2 request/response models
│   │
│   ├── services/
│   │   ├── recommender.py  ← Rule-based recommendation engine
│   │   └── voice_parser.py ← NLP intent parser
│   │
│   ├── datasets/
│   │   └── garments.json ← 16 sample garments (auto-seeded to DB)
│   │
│   └── uploads/          ← User-uploaded images (gitignored)
│
├── .gitignore
├── .env.example
└── README.md             ← This file
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Vanilla HTML5 + CSS3 + JavaScript (ES2022) |
| Styling | Custom CSS design system (DM Sans, Manrope, Playfair Display) |
| Camera | Web MediaDevices API (`getUserMedia`) |
| Voice input | Web Speech API (`SpeechRecognition`) |
| Voice output | Web Speech API (`SpeechSynthesis`) |
| Pose detection | MediaPipe Pose (CDN, browser-side) |
| Backend framework | FastAPI 0.115 |
| Language | Python 3.10+ |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite |
| Validation | Pydantic v2 |
| Image processing | Pillow |
| Server | Uvicorn (ASGI) |

---

## Known Limitations

| Limitation | Notes |
|-----------|-------|
| Garment visualization | SVG overlay only — not photorealistic cloth simulation |
| Pose detection | Landmark dots only — garment does not deform to body |
| Voice recognition | Requires Chrome or Edge (Firefox unsupported) |
| AI try-on | Module stub ready — requires IDM-VTON or CatVTON model files |
| Multi-user | Single local session — no authentication |

---

## Roadmap (Future Development)

- [ ] MediaPipe-based automatic garment alignment
- [ ] IDM-VTON or CatVTON integration for realistic cloth synthesis
- [ ] LLM-powered fashion assistant (GPT-4o or Gemini)
- [ ] User accounts and outfit history
- [ ] Cloud image storage (AWS S3 / Firebase)
- [ ] Mobile-responsive camera improvements
- [ ] Expanded garment dataset with real product photographs

---

## Demonstration Workflow

1. Open the app and land on the **Home** page
2. Click **Enter Virtual Studio**
3. Start your **webcam** or upload a **full-length photograph**
4. Select a garment category and colour
5. Enable **Pose Detection** (optional, webcam only)
6. Say *"change to red"* or *"show a jacket"* using voice control
7. Navigate to **Outfit Catalogue** and browse all 16 garments
8. Open **Fashion Assistant**, choose an occasion, generate a recommendation
9. Click **Try this outfit** — it loads in the Virtual Studio
10. Open **Settings** to change voice language or check backend status

---

## Academic Acknowledgement

This is an academic prototype demonstrating browser-based fashion technology concepts. It does not claim to perform photorealistic AI garment synthesis in demo mode. The AI try-on module is architected for future integration with pretrained models (IDM-VTON, CatVTON).

---

*StyleSpeak · Voice-Controlled AR Outfit Try-On · Local Build 1.0*
