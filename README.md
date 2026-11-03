# StyleSpeak

**Voice-Controlled Augmented Reality Virtual Outfit Try-On & Fashion Assistant**

> A full-stack browser-based fashion technology system featuring **real-time 3D deformable upper-body cloth meshes (Three.js WebGL)**, **60 FPS MediaPipe skeletal arm & body tracking**, **voice-controlled styling (Web Speech API)**, **Anywear AR fitting dock**, and **FASHN VTON v1.5 neural diffusion support via Colab GPU**.

---

## ⚡ Quick Start: Execution Commands

### Option 1: One-Click Instant Launcher (Easiest)

Open PowerShell or Command Prompt and run:

```powershell
cd "c:\Users\manoh\Downloads\vr"
.\start.bat
```
*(Or simply open `c:\Users\manoh\Downloads\vr` in File Explorer and double-click `start.bat` — it automatically starts both the backend and frontend servers, then opens your browser).*

---

### Option 2: Run in Two Separate Terminals

#### Terminal 1 — Run FastAPI Backend (Port 8001):
```powershell
cd "c:\Users\manoh\Downloads\vr\backend"
python -m uvicorn main:app --port 8001 --reload
```
*Health Check / Swagger Docs: [http://localhost:8001/docs](http://localhost:8001/docs)*

#### Terminal 2 — Run 3D AR Frontend (Port 5500):
```powershell
cd "c:\Users\manoh\Downloads\vr"
python -m http.server 5500
```
*Frontend URL: [http://localhost:5500](http://localhost:5500)*

---

### Option 3: Starting from Scratch (First-Time Setup)

```powershell
# 1. Install backend dependencies
cd "c:\Users\manoh\Downloads\vr\backend"
pip install -r requirements.txt

# 2. Start the FastAPI backend
python -m uvicorn main:app --port 8001 --reload

# 3. In a new terminal, start the frontend
cd "c:\Users\manoh\Downloads\vr"
python -m http.server 5500

# 4. Open browser
start http://localhost:5500
```

---

### 🚀 Bonus: Google Colab + ngrok Code for FASHN Try-On v1.5 API

If you have a Google Colab GPU notebook running FASHN Try-On v1.5 and want to connect it to StyleSpeak:

```python
# 1. Install requirements in Colab
!pip install fastapi uvicorn pyngrok nest_asyncio diffusers transformers accelerate

# 2. Expose with ngrok
from pyngrok import ngrok
import nest_asyncio

# Paste your ngrok auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok.set_auth_token("YOUR_NGROK_AUTHTOKEN")

# Open public tunnel to port 8000
public_url = ngrok.connect(8000).public_url
print("🚀 YOUR PUBLIC FASHN ENDPOINT IS:", public_url)

# 3. Paste that public_url in StyleSpeak Virtual Studio -> FASHN VTON tab!
```

---

## 🌟 Key Features

### 1. 3D Deformable Upper-Body Cloth Mesh
- **Continuous Surface Mesh:** Built with Three.js `BufferGeometry` (24×32 Torso grid = 825 vertices + two 20×16 Arm Sleeves = 357 vertices each).
- **Dynamic Arm Tracking:** When you raise your hands or bend your elbows in front of the webcam, the sleeves **elevate, bend, and follow your arms in real time**!
- **Zero Blockiness:** No disjointed cylinders, floating collars, or rigid boxes.
- **PBR Fabric Rendering:** Double-sided high-resolution woven twill textures with realistic ambient occlusion, drop shadows, pearl/brass buttons, tailored collar wings, lapels, and flowing 360° skirt pleats.
- **⚡ 3D Mesh Wireframe Mode:** Toggle the cyan polygon tracking grid on/off with one click to see your body mesh in real time!

### 2. Live Webcam & MediaPipe Pose Tracking (60 FPS)
- Tracks 33 body landmarks (shoulders, elbows, wrists, hips, clavicle, and nose).
- Frame-paced inference keeps memory stable with 0% dropped frames.
- Aspect ratio cover mapping prevents distortion across any webcam resolution.
- Suprasternal notch collar clamping ensures clothes never creep up onto the chin or face.

### 3. Voice-Controlled Fashion Stylist (Web Speech API)
- Hands-free commands: *"Show a red dress"*, *"Change to navy"*, *"Try a blazer"*, *"Show festive kurta"*.
- Built-in text-to-speech assistant confirms every style change.

### 4. Anywear Live AR Fitting Dock & Outfit Catalogue
- Fast horizontal carousel lets you switch between Cotton Tee, Oxford Shirt, Navy Blazer, Festive Kurta, and Rose Dress in 1 click.
- **Upload Any Garment:** Upload photos of your own clothing from Zara, Nike, etc. to fit onto your live 3D body!
- 16 curated outfits categorized across 10 life occasions (College, Interview, Party, Wedding, Festival, Date, etc.).

---

## 📁 Project Architecture

```
vr/
├── index.html            ← Single-page application with 3D WebGL viewport
├── styles.css            ← Responsive luxury styling & cyber HUD
├── app.js                ← Three.js 3D deformable mesh + MediaPipe + voice engine
├── start.bat             ← One-click launcher for frontend + backend
├── assets/
│   └── garments/         ← 3D models (.glb) and fabric texture maps
│
├── backend/
│   ├── main.py           ← FastAPI application entry point (port 8001)
│   ├── database.py       ← SQLite database configuration
│   ├── requirements.txt  ← Python dependencies
│   ├── routes/           ← Modular API routes (garments, upload, tryon, voice)
│   ├── models/           ← SQLAlchemy data models
│   ├── schemas/          ← Pydantic schemas
│   └── datasets/         ← Pre-seeded outfit catalogue
│
├── .gitignore
├── PROJECT_NOTES.md
└── README.md             ← Documentation & execution guide
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **3D Rendering** | Three.js WebGL, PBR MeshStandardMaterial, BufferGeometry, OrbitControls |
| **Computer Vision** | MediaPipe Pose (33 3D skeletal landmarks) |
| **Voice & Speech** | Web Speech API (SpeechRecognition & SpeechSynthesis) |
| **Frontend UI** | Modern Vanilla JavaScript (ES2022), CSS3 Flexbox/Grid, Canvas API |
| **Backend API** | FastAPI 0.115, Uvicorn, Python 3.10+ |
| **Database** | SQLite, SQLAlchemy 2.0 |
| **Neural VTON** | FASHN VTON v1.5 (Colab / ngrok integration) |

---

## 📸 Try-On Snapshot & Privacy
- StyleSpeak processes webcam video and pose landmarks **100% locally in your browser**.
- Click the **📸 Snapshot** button to download a high-resolution photo wearing your 3D try-on outfit.
- No webcam frames or biometric data leave your device.
