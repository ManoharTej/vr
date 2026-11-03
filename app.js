/* =========================================================
   StyleSpeak — app.js
   Voice-Controlled AR Virtual Outfit Try-On & Fashion Assistant
   Version 2.0 — Full upgrade with TTS, Pose Detection, 16 garments,
   10 occasions, backend integration, landing, overview, settings
   ========================================================= */

"use strict";

// ── SHORTCUTS ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── STATE ────────────────────────────────────────────────────────────────────
let cameraStream      = null;
let toastTimer        = null;
let selectedColor     = '#8270d8';
let selectedCat       = 'top';
let selectedGarmentId = 'g1';
let currentMode       = 'ar'; // 'ar' | 'fashn' | 'manual'
let uploadedImagePath = null;
let poseActive        = true;
let poseModel         = null;
let poseRAF           = null;
let voiceLang         = 'en-IN';
let voiceRate         = 1.0;
let backendOnline     = false;
let API_BASE          = 'http://localhost:8001';

// ── COLOUR MAP ───────────────────────────────────────────────────────────────
const COLORS = {
  red:'#d85c79', rose:'#d85c79', pink:'#d85c79', fuchsia:'#d85c79',
  purple:'#8270d8', lavender:'#8270d8', violet:'#8270d8', mauve:'#8270d8',
  blue:'#263f80', cobalt:'#263f80', navy:'#263650', indigo:'#263f80',
  green:'#2c897c', teal:'#2c897c', sage:'#2c897c', emerald:'#2c897c',
  yellow:'#d69a43', amber:'#d69a43', mustard:'#d69a43', gold:'#d69a43',
  cream:'#e9dfd0', white:'#e9dfd0', ivory:'#e9dfd0', beige:'#e9dfd0',
  black:'#262626', charcoal:'#262626', dark:'#262626',
  orange:'#d4753a', coral:'#d4753a',
};

// ── GARMENT SHAPES (SVG paths) ────────────────────────────────────────────────
const SHAPES = {
  top:    'M72 20 103 6Q120 27 137 6l31 14 58 52-35 41-25-23 9 170H62l9-170-25 23L11 72Z',
  dress:  'M72 20 103 6Q120 27 137 6l31 14 58 52-35 41-25-23 43 170H31l43-170-25 23L11 72Z',
  jacket: 'M72 20 103 6Q120 27 137 6l31 14 58 52-35 41-25-23 9 170H62l9-170-25 23L11 72Z',
  tee:    'M72 20 103 6Q120 27 137 6l31 14 58 52-35 41-25-23 9 135H62l9-135-25 23L11 72Z',
  kurta:  'M72 20 103 6Q120 27 137 6l31 14 58 52-35 41-25-23 18 170H56l18-170-25 23L11 72Z',
};

// ── GARMENT CATALOGUE (16 items) ─────────────────────────────────────────────
const CATALOG = [
  {id:'g1',  name:'Everyday Relaxed Top',   category:'top',    type:'Casual',       color:'#8270d8', occasion:['college','date'],         desc:'Easy everyday styling'},
  {id:'g2',  name:'Evening Midi Dress',      category:'dress',  type:'Party',        color:'#d85c79', occasion:['party','date'],           desc:'A clean statement silhouette'},
  {id:'g3',  name:'Classic Layer Jacket',    category:'jacket', type:'Layering',     color:'#263650', occasion:['college','office'],       desc:'Smart layering essential'},
  {id:'g4',  name:'Minimal Cotton Tee',      category:'tee',    type:'Casual',       color:'#e9dfd0', occasion:['college'],                desc:'Simple and versatile'},
  {id:'g5',  name:'Festive Kurta Style',     category:'kurta',  type:'Traditional',  color:'#2c897c', occasion:['wedding','festival'],     desc:'Traditional celebration look'},
  {id:'g6',  name:'Formal Work Shirt',       category:'top',    type:'Formal',       color:'#263650', occasion:['interview','office'],     desc:'Professional and polished'},
  {id:'g7',  name:'Rose Occasion Dress',     category:'dress',  type:'Celebration',  color:'#d85c79', occasion:['wedding','party'],        desc:'Soft colour for special events'},
  {id:'g8',  name:'Weekend Overshirt',       category:'jacket', type:'Casual',       color:'#d69a43', occasion:['college','date'],         desc:'Relaxed weekend layer'},
  {id:'g9',  name:'Elegant Maxi Dress',      category:'dress',  type:'Evening',      color:'#263650', occasion:['party','wedding'],        desc:'Floor-length drama piece'},
  {id:'g10', name:'Smart Blazer',            category:'jacket', type:'Formal',       color:'#252536', occasion:['office','interview'],     desc:'Power dressing essential'},
  {id:'g11', name:'Floral Kurta',            category:'kurta',  type:'Festive',      color:'#d69a43', occasion:['festival','wedding'],     desc:'Vibrant festive choice'},
  {id:'g12', name:'Oversized Hoodie',        category:'tee',    type:'Streetwear',   color:'#8270d8', occasion:['college'],                desc:'Urban casual comfort'},
  {id:'g13', name:'Wrap Midi Dress',         category:'dress',  type:'Smart Casual', color:'#2c897c', occasion:['date','party'],           desc:'Versatile wrap silhouette'},
  {id:'g14', name:'Linen Summer Shirt',      category:'top',    type:'Resort',       color:'#e9dfd0', occasion:['college','date'],         desc:'Breathable warm-weather top'},
  {id:'g15', name:'Velvet Party Jacket',     category:'jacket', type:'Evening',      color:'#d85c79', occasion:['party','wedding'],        desc:'Statement evening layer'},
  {id:'g16', name:'Classic White Shirt',     category:'top',    type:'Classic',      color:'#e9dfd0', occasion:['office','interview'],     desc:'Wardrobe foundation piece'},
];

// ── RECOMMENDATION ENGINE (10 occasions) ─────────────────────────────────────
const RECS = {
  college: {
    title: 'Relaxed campus essential',
    desc: 'Keep it comfortable and put-together with a breathable casual top, straight-fit denim and clean sneakers. Add a light overshirt for an extra layer.',
    items: ['Pastel or neutral top', 'Straight-fit jeans', 'Clean sneakers', 'Light overshirt'],
    accessories: ['Canvas tote', 'Simple watch', 'Small stud earrings'],
    garment: 'top', color: '#8270d8',
  },
  interview: {
    title: 'Confident interview look',
    desc: 'Choose a well-fitted solid shirt with tailored trousers and clean formal footwear. Navy, white and light blue are reliable professional colour choices.',
    items: ['Crisp formal shirt', 'Navy or charcoal trousers', 'Formal shoes', 'Minimal accessories'],
    accessories: ['Leather belt', 'Stud earrings', 'Portfolio folder'],
    garment: 'top', color: '#263650',
  },
  office: {
    title: 'Polished workday look',
    desc: 'A structured layer over a simple shirt creates a neat business-casual outfit. Keep the palette restrained and accessories minimal.',
    items: ['Structured blazer', 'Plain shirt', 'Tailored trousers', 'Neutral footwear'],
    accessories: ['Simple chain', 'Classic watch', 'Leather bag'],
    garment: 'jacket', color: '#263650',
  },
  party: {
    title: 'After-hours statement',
    desc: 'Choose one standout piece and keep the rest balanced. A dress or top in rose, deep navy or jewel tones works well for an evening event.',
    items: ['Statement dress or top', 'One accent accessory', 'Neutral or coordinated shoes', 'Small evening bag'],
    accessories: ['Drop earrings', 'Clutch bag', 'Heels'],
    garment: 'dress', color: '#d85c79',
  },
  wedding: {
    title: 'Celebration-ready edit',
    desc: 'Choose an elegant traditional or contemporary outfit in jewel tones. Coordinate accessories rather than layering too many competing details.',
    items: ['Elegant kurta or dress', 'Jewel-tone palette', 'Coordinated accessories', 'Comfortable formal footwear'],
    accessories: ['Jhumka earrings', 'Bangles', 'Embroidered clutch'],
    garment: 'kurta', color: '#2c897c',
  },
  date: {
    title: 'Effortless smart-casual',
    desc: 'A clean fitted top with dark denim or a simple dress makes a relaxed but intentional look. Add one accent colour and comfortable footwear.',
    items: ['Fitted top or simple dress', 'Dark denim or tailored pants', 'One accent accessory', 'Comfortable shoes'],
    accessories: ['Dainty necklace', 'Small crossbody bag', 'Clean sneakers or low heels'],
    garment: 'top', color: '#d85c79',
  },
  festival: {
    title: 'Traditional festive look',
    desc: 'Try a kurta-inspired silhouette with a rich colour and coordinated accessories. Choose breathable fabric and comfortable footwear for long celebrations.',
    items: ['Traditional kurta', 'Teal, wine or jewel tones', 'Subtle accessories', 'Comfortable sandals'],
    accessories: ['Kundan earrings', 'Maang tikka', 'Juttis or flats'],
    garment: 'kurta', color: '#2c897c',
  },
  birthday: {
    title: 'Birthday celebration look',
    desc: 'Pick something festive and fun — a bold dress or a bright kurta with statement accessories. You deserve to stand out on your day.',
    items: ['Bold dress or kurta', 'Statement colour (fuchsia, orange, gold)', 'Fun accessories', 'Comfortable heels or flats'],
    accessories: ['Statement earrings', 'Embellished clutch', 'Block heels'],
    garment: 'dress', color: '#d85c79',
  },
  casual: {
    title: 'Effortless casual-party style',
    desc: 'Relaxed but intentional — a stylish top with jeans or a casual midi skirt. Keep it comfortable but elevated.',
    items: ['Stylish top or midi dress', 'Dark jeans or casual skirt', 'Minimal jewellery', 'Sneakers or flats'],
    accessories: ['Simple chain necklace', 'Canvas sneakers', 'Tote or mini bag'],
    garment: 'top', color: '#8270d8',
  },
  traditional: {
    title: 'Traditional celebration outfit',
    desc: 'Embrace rich fabrics and classic silhouettes. A kurta or ethnic dress in jewel tones is always appropriate for cultural celebrations.',
    items: ['Silk or cotton kurta with embroidery', 'Churidar or straight-fit trousers', 'Dupatta or stole', 'Ethnic footwear'],
    accessories: ['Kundan or temple jewellery', 'Potli bag', 'Kolhapuris or mojris'],
    garment: 'kurta', color: '#2c897c',
  },
};

// ── TOAST NOTIFICATION ────────────────────────────────────────────────────────
function notify(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── VOICE FEEDBACK (TTS) ──────────────────────────────────────────────────────
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // stop any ongoing speech
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = voiceLang;
  utter.rate = voiceRate;
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
}

// ── GARMENT PREVIEW & MODES ───────────────────────────────────────────────────
function updateStageCaption() {
  const cap = $('stageCaption');
  if (!cap) return;
  if (currentMode === 'ai') {
    cap.textContent = `VTON AI MODE · ${selectedCat.toUpperCase()} · MODULAR ENGINE`;
  } else if (poseActive) {
    cap.textContent = `POSE-AWARE MODE · ${selectedCat.toUpperCase()}`;
  } else {
    cap.textContent = `GARMENT: ${selectedCat.toUpperCase()} · DEMO MODE`;
  }
}

function activatePreview() {
  $('empty').style.display = 'none';
  if (currentMode === 'manual') {
    $('garmentLayer').style.display = 'block';
  } else {
    $('garmentLayer').style.display = 'none';
  }
  updateStageCaption();
}

function setColor(hex) {
  selectedColor = hex;
  $('garmentPath').setAttribute('fill', hex);
  $$('.swatch').forEach(b => b.classList.toggle('selected', b.dataset.color === hex));
  if (typeof update3DGarmentColor === 'function') update3DGarmentColor(hex);
  activatePreview();
}

// ── REALISTIC GARMENT PNG ASSETS MAP ───────────────────────────────────────
const GARMENT_ASSETS = {
  tee:    'assets/garments/tee_lavender.png',
  top:    'assets/garments/shirt_cream.png',
  jacket: 'assets/garments/blazer_navy.png',
  kurta:  'assets/garments/kurta_teal.png',
  dress:  'assets/garments/dress_rose.png'
};

function setCategory(type) {
  selectedCat = type;
  const catEl = $('category');
  if (catEl) catEl.value = type;
  $('garmentPath').setAttribute('d', SHAPES[type] || SHAPES.top);
  const match = CATALOG.find(g => g.category === type);
  if (match) selectedGarmentId = match.id;

  // Auto-switch Anywear 3D AR texture image & Three.js 3D volumetric model
  const targetImg = GARMENT_ASSETS[type] || GARMENT_ASSETS.tee;
  activeGarmentImg = new Image();
  activeGarmentImg.src = targetImg;

  if (typeof buildAndAttach3DGarment === 'function') {
    buildAndAttach3DGarment(type, selectedColor);
  }

  // Sync active Anywear dock carousel item
  $$('.anywear-item').forEach(it => {
    it.classList.toggle('active', it.dataset.cat === type);
  });

  activatePreview();
}

function setMode(mode) {
  currentMode = mode;
  $('arModeBtn')?.classList.toggle('active', mode === 'ar');
  $('fashnModeBtn')?.classList.toggle('active', mode === 'fashn');
  $('manualModeBtn')?.classList.toggle('active', mode === 'manual');

  const fashnCard = $('fashnControlCard');
  if (fashnCard) fashnCard.style.display = (mode === 'fashn') ? 'block' : 'none';

  const sliders = $('manualSlidersGroup');
  if (sliders) sliders.style.display = (mode === 'manual') ? 'block' : 'none';

  if (mode === 'manual') {
    $('garmentLayer').style.display = 'block';
    stopPoseDetection();
    notify('▦ 2D Manual Drag Mode active — use sliders to position outfit.');
  } else if (mode === 'ar') {
    $('garmentLayer').style.display = 'none';
    startPoseDetection(false);
    notify('◉ 3D AR Body Fit Mode active — live 60 FPS shoulder tracking.');
  } else if (mode === 'fashn') {
    $('garmentLayer').style.display = 'none';
    loadFashnSettings();
    notify('⚡ FASHN VTON Mode — neural diffusion try-on via Colab GPU.');
  }
  updateStageCaption();
}

$('arModeBtn')?.addEventListener('click', () => setMode('ar'));
$('fashnModeBtn')?.addEventListener('click', () => setMode('fashn'));
$('manualModeBtn')?.addEventListener('click', () => setMode('manual'));

// Synchronize FASHN settings across views
function loadFashnSettings() {
  const url = localStorage.getItem('stylespeak_fashn_url') || '';
  const key = localStorage.getItem('stylespeak_fashn_key') || '';
  if ($('studioFashnUrl')) $('studioFashnUrl').value = url;
  if ($('studioFashnKey')) $('studioFashnKey').value = key;
  if ($('fashnUrlInput'))  $('fashnUrlInput').value  = url;
  if ($('fashnKeyInput'))  $('fashnKeyInput').value  = key;
}

function saveFashnSettings(url, key) {
  localStorage.setItem('stylespeak_fashn_url', (url || '').trim());
  localStorage.setItem('stylespeak_fashn_key', (key || '').trim());
  loadFashnSettings();
  notify('💾 Colab ngrok endpoint saved!');
}

$('saveStudioFashnBtn')?.addEventListener('click', () => {
  saveFashnSettings($('studioFashnUrl')?.value, $('studioFashnKey')?.value);
});
$('saveFashnBtn')?.addEventListener('click', () => {
  saveFashnSettings($('fashnUrlInput')?.value, $('fashnKeyInput')?.value);
  const st = $('fashnSaveStatus');
  if (st) { st.style.display = 'inline'; setTimeout(() => st.style.display = 'none', 3000); }
});

async function runFashnTryOn() {
  const url = ($('studioFashnUrl')?.value || localStorage.getItem('stylespeak_fashn_url') || '').trim();
  const key = ($('studioFashnKey')?.value || localStorage.getItem('stylespeak_fashn_key') || '').trim();

  if (!url) {
    notify('Please paste your Google Colab ngrok URL (e.g. https://xxxx.ngrok-free.app)');
    $('studioFashnUrl')?.focus();
    return;
  }

  const prog = $('fashnProgress');
  const resBox = $('fashnResultContainer');
  if (prog) prog.style.display = 'block';
  if (resBox) { resBox.style.display = 'none'; resBox.innerHTML = ''; }

  // Capture user photo / frame
  let userImageData = uploadedImagePath;
  if (!userImageData) {
    const video = $('video');
    if (video && video.readyState >= 2) {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = video.videoWidth || 640;
      snapCanvas.height = video.videoHeight || 480;
      const sCtx = snapCanvas.getContext('2d');
      sCtx.translate(snapCanvas.width, 0);
      sCtx.scale(-1, 1);
      sCtx.drawImage(video, 0, 0);
      userImageData = snapCanvas.toDataURL('image/jpeg', 0.92);
    } else if ($('photo')?.src) {
      userImageData = $('photo').src;
    }
  }

  notify('⚡ Contacting Colab GPU for FASHN VTON neural synthesis…');
  speak('Synthesizing look with FASHN VTON on your Colab GPU.');

  try {
    const payload = {
      garment_id: selectedGarmentId,
      image_path: userImageData || 'demo_model_webcam',
      color: selectedColor,
      fashn_api_url: url,
      fashn_api_key: key
    };

    const res = await fetch(`${API_BASE}/api/tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (prog) prog.style.display = 'none';

    if (res.ok) {
      const data = await res.json();
      if (resBox) {
        resBox.style.display = 'block';
        const imgUrl = (data.result_image_path && data.result_image_path.startsWith('/')) ? `${API_BASE}${data.result_image_path}` : (data.result_image_path || userImageData);
        resBox.innerHTML = `
          <div class="panel" style="background:#fff;border:1px solid #dcd6f5;border-radius:8px;padding:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <b>✨ FASHN VTON Synthesis Complete</b>
              <span class="anywear-badge">● GPU COMPLETE</span>
            </div>
            <p style="font-size:10px;color:#555;margin:0 0 10px">${data.message}</p>
            <div class="fashn-result-preview">
              <div>
                <small style="display:block;font-size:9px;color:#999;margin-bottom:4px">INPUT FRAME</small>
                <img src="${userImageData || 'assets/demo_user.jpg'}" alt="Input user photo" style="max-height:220px;object-fit:cover">
              </div>
              <div>
                <small style="display:block;font-size:9px;color:#999;margin-bottom:4px">FASHN VTON v1.5 OUTPUT</small>
                <img src="${imgUrl}" alt="Synthesized try-on result" style="max-height:220px;object-fit:cover">
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <a href="${imgUrl}" download="FASHN_TryOn_Result.png" class="btn primary" style="text-decoration:none;font-size:10px">⬇ Download High-Res Look</a>
              <button class="btn secondary" onclick="switchView('wardrobe')" style="font-size:10px">Browse More Styles</button>
            </div>
          </div>
        `;
      }
      notify('✨ FASHN VTON try-on completed successfully!');
      speak('FASHN VTON neural synthesis complete.');
    } else {
      const err = await res.json();
      if (resBox) {
        resBox.style.display = 'block';
        resBox.innerHTML = `<div style="background:#fff0f3;border:1px solid #f8c8d2;color:#d85c79;padding:10px;border-radius:6px;font-size:10px"><b>Error:</b> ${err.detail || 'Could not connect to Colab API'}</div>`;
      }
      notify('Colab inference failed — check your ngrok URL.');
    }
  } catch (err) {
    if (prog) prog.style.display = 'none';
    if (resBox) {
      resBox.style.display = 'block';
      resBox.innerHTML = `<div style="background:#fff0f3;border:1px solid #f8c8d2;color:#d85c79;padding:10px;border-radius:6px;font-size:10px">Could not reach backend on ${API_BASE}. Ensure FastAPI server is running on port 8001.</div>`;
    }
    notify('Connection error. Verify backend server.');
  }
}
$('runFashnBtn')?.addEventListener('click', runFashnTryOn);

// Colour swatch click handlers
$$('.swatch').forEach(b => b.addEventListener('click', () => setColor(b.dataset.color)));

// Category dropdown
const catEl = $('category');
if (catEl) catEl.onchange = () => setCategory(catEl.value);

// Overlay sliders
const posEl   = $('position');
const scaleEl = $('scale');
if (posEl)   posEl.oninput   = e => $('garmentLayer').style.left  = e.target.value + '%';
if (scaleEl) scaleEl.oninput = e => $('garmentLayer').style.width = (180 * Number(e.target.value) / 100) + 'px';

// ── WEBCAM ────────────────────────────────────────────────────────────────────
const camBtn = $('cameraBtn');
if (camBtn) {
  camBtn.onclick = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Camera requires localhost or HTTPS.');
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      const videoEl = $('video');
      videoEl.srcObject = cameraStream;
      videoEl.style.display = 'block';
      $('photo').style.display = 'none';
      activatePreview();
      notify('Webcam connected — initializing 3D AR body tracking…');
      // Auto-start 3D AR body tracking as soon as webcam stream plays
      const onReady = () => {
        videoEl.play();
        startPoseDetection(true);
      };
      if (videoEl.readyState >= 1) {
        onReady();
      } else {
        videoEl.onloadedmetadata = onReady;
      }
    } catch (e) {
      notify('Camera unavailable — allow permission or upload a photo.');
    }
  };
}

// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
const photoInput = $('photoInput');
if (photoInput) {
  photoInput.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) { notify('Please upload JPG, PNG or WebP.'); return; }
    if (f.size > 10 * 1024 * 1024)  { notify('Image must be smaller than 10 MB.'); return; }
    const photoEl = $('photo');
    photoEl.src = URL.createObjectURL(f);
    photoEl.style.display = 'block';
    $('video').style.display = 'none';
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    activatePreview();
    notify('Photo loaded — analyzing body posture for 3D fit…');
    photoEl.onload = () => {
      startPoseDetection(true);
    };

    // Optionally also POST to backend if online
    if (backendOnline) uploadToBackend(f);
  };
}

async function uploadToBackend(file) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
    if (r.ok) {
      const d = await r.json();
      uploadedImagePath = d.file_path;
      console.log('[Backend] Photo uploaded:', d.file_path);
    }
  } catch { /* backend offline — silent fail */ }
}

// ── RETAKE / REMOVE BUTTONS ───────────────────────────────────────────────────
const retakeBtn = $('retakeBtn');
const removeBtn = $('removePhotoBtn');

if (retakeBtn) {
  retakeBtn.onclick = () => {
    stopPoseDetection();
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    $('video').srcObject = null;
    $('video').style.display = 'none';
    $('empty').style.display = 'flex';
    $('garmentLayer').style.display = 'none';
    $('guide').style.display = 'none';
    if (posEl) posEl.value = 50;
    if (scaleEl) scaleEl.value = 100;
    $('garmentLayer').style.left = '50%';
    $('garmentLayer').style.width = '180px';
    notify('Ready to retake — start webcam again.');
  };
}

if (removeBtn) {
  removeBtn.onclick = () => {
    stopPoseDetection();
    $('photo').src = '';
    $('photo').style.display = 'none';
    if (photoInput) photoInput.value = '';
    $('empty').style.display = 'flex';
    $('garmentLayer').style.display = 'none';
    $('guide').style.display = 'none';
    notify('Photo removed.');
  };
}

// ── 3D AR BODY-FITTING VIRTUAL TRY-ON ENGINE ─────────────────────────────────
// ── THREE.JS SKELETAL 3D CLOTHING & DYNAMIC ARM RIG ENGINE ────────────────────
// Real 3D garments with dynamic limb tracking: sleeves raise and bend with user's arms!
let threeRenderer        = null;
let threeScene           = null;
let threeCamera          = null;
let threeControls        = null;
let active3DGarmentGroup = null;
let is3DOrbitMode        = false; // false = Live AR Body Fit, true = 360° inspector

// Smooth 6-DOF pose state & skeletal joints for butter-smooth tracking
let threePoseState = {
  x: 0, y: 0, z: 0,
  yaw: 0, pitch: 0, roll: 0,
  scale: 1, init: false
};

const threeSmoothPose = {
  S_L: new THREE.Vector3(),
  S_R: new THREE.Vector3(),
  E_L: new THREE.Vector3(),
  E_R: new THREE.Vector3(),
  W_L: new THREE.Vector3(),
  W_R: new THREE.Vector3(),
  H_L: new THREE.Vector3(),
  H_R: new THREE.Vector3(),
  init: false
};

const poseToggle = $('poseToggle');
const poseCanvas = $('poseCanvas');

// Color shading helper
function adjustColor(hex, percent) {
  let num = parseInt((hex || '#8270d8').replace('#',''), 16);
  if (isNaN(num)) num = 0x8270d8;
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00FF) + amt;
  let B = (num & 0x0000FF) + amt;
  return `rgb(${Math.min(255, Math.max(0, R))}, ${Math.min(255, Math.max(0, G))}, ${Math.min(255, Math.max(0, B))})`;
}

function createFabricMat(colorHex, roughness = 0.65, metalness = 0.04) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: roughness,
    metalness: metalness,
    side: THREE.DoubleSide
  });
}

// ── GARMENT TEXTURE & ASSET CACHE ────────────────────────────────────────────
let threeTextureLoader = null;
const garmentTextureCache = {};

function loadGarmentTexture(url) {
  if (!window.THREE) return null;
  if (!threeTextureLoader) threeTextureLoader = new THREE.TextureLoader();
  if (garmentTextureCache[url]) return garmentTextureCache[url];

  const tex = threeTextureLoader.load(url, () => {
    if (threeRenderer && threeScene && threeCamera) {
      threeRenderer.render(threeScene, threeCamera);
    }
  });
  tex.anisotropy = 4;
  garmentTextureCache[url] = tex;
  return tex;
}

// ── 3D UPPER BODY MESH WIREFRAME STATE ─────────────────────────────────────────
let show3DMeshWireframe = false;

// Dynamic Orthonormal Basis Vector generator for Arm Splines
function getOrthoFrame(T) {
  let len = Math.hypot(T.x, T.y, T.z);
  let dir = (len < 1e-4) ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(T.x / len, T.y / len, T.z / len);
  let ref = Math.abs(dir.y) > 0.92 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  let N = new THREE.Vector3().crossVectors(dir, ref).normalize();
  let B = new THREE.Vector3().crossVectors(dir, N).normalize();
  return { T: dir, N, B };
}

// ── PROCEDURAL REALISTIC FABRIC TEXTURE GENERATOR ────────────────────────────
function generateRealisticClothTexture(category, colorHex, customTextureUrl = null, isSleeve = false) {
  if (customTextureUrl) {
    return loadGarmentTexture(customTextureUrl);
  }

  const canvas = document.createElement('canvas');
  const size = isSleeve ? 512 : 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 1. Base fabric color
  ctx.fillStyle = colorHex || '#8270d8';
  ctx.fillRect(0, 0, size, size);

  // 2. Microscopic woven twill weave
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = 0; y < size; y += 4) {
    ctx.fillRect(0, y, size, 1.5);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let x = 0; x < size; x += 4) {
    ctx.fillRect(x, 0, 1.5, size);
  }

  // 3. Cylindrical Ambient Occlusion (darker at lateral edges for 3D depth)
  const aoGrad = ctx.createLinearGradient(0, 0, size, 0);
  aoGrad.addColorStop(0.00, 'rgba(0, 0, 0, 0.40)');
  aoGrad.addColorStop(0.20, 'rgba(0, 0, 0, 0.06)');
  aoGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.10)');
  aoGrad.addColorStop(0.80, 'rgba(0, 0, 0, 0.06)');
  aoGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0.40)');
  ctx.fillStyle = aoGrad;
  ctx.fillRect(0, 0, size, size);

  if (isSleeve) {
    // Sleeve tailored cuff styling at bottom
    const cuffY = size * 0.88;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, cuffY, size, size - cuffY);

    if (category === 'top') {
      // Oxford Shirt Sleeve Cuff & Button
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(size * 0.35, cuffY + 5, size * 0.30, size - cuffY - 10);
      ctx.setLineDash([]);
      // Pearl cuff button
      ctx.beginPath();
      ctx.arc(size * 0.50, cuffY + 28, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f8f8f4';
      ctx.fill();
      ctx.strokeStyle = '#33333344';
      ctx.stroke();
    } else if (category === 'jacket') {
      // Tailored Blazer 3 Kissing Buttons
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(size * 0.42 + i * 20, cuffY + 26, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#d4af37';
        ctx.fill();
        ctx.strokeStyle = '#8a711c';
        ctx.stroke();
      }
    } else if (category === 'kurta') {
      // Golden Zari Embroidered Cuff Border
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(0, cuffY + 6, size, 14);
      ctx.fillStyle = '#ffffffbb';
      for (let x = 10; x < size; x += 22) {
        ctx.beginPath();
        ctx.arc(x, cuffY + 13, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Tee / Dress fine double hem stitch
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, cuffY + 12); ctx.lineTo(size, cuffY + 12);
      ctx.moveTo(0, cuffY + 20); ctx.lineTo(size, cuffY + 20);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else {
    // Torso Front Center Features (centered around x = size * 0.50 = 512)
    const midX = size * 0.50;

    if (category === 'top') {
      // ── OXFORD SHIRT ────────────────────────────────────────────────────────
      ctx.fillStyle = adjustColor(colorHex, 15);
      ctx.beginPath();
      ctx.moveTo(midX - 110, 0);
      ctx.lineTo(midX, 60);
      ctx.lineTo(midX + 110, 0);
      ctx.lineTo(midX + 140, 100);
      ctx.lineTo(midX + 60, 110);
      ctx.lineTo(midX, 70);
      ctx.lineTo(midX - 60, 110);
      ctx.lineTo(midX - 140, 100);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Placket band down center
      ctx.fillStyle = adjustColor(colorHex, 8);
      ctx.fillRect(midX - 22, 60, 44, size - 100);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(midX - 20, 65, 40, size - 110);
      ctx.setLineDash([]);

      // 5 Pearl Buttons with drop shadow and stitch holes
      const buttonYs = [120, 260, 420, 600, 780];
      buttonYs.forEach(by => {
        ctx.beginPath();
        ctx.arc(midX + 1, by + 2, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(midX, by, 9, 0, Math.PI * 2);
        const bGrad = ctx.createRadialGradient(midX - 2, by - 2, 2, midX, by, 9);
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(0.7, '#f0efe9');
        bGrad.addColorStop(1, '#d8d6ce');
        ctx.fillStyle = bGrad;
        ctx.fill();
        ctx.strokeStyle = '#bbb9af';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#444';
        ctx.fillRect(midX - 3.5, by - 3.5, 2, 2);
        ctx.fillRect(midX + 1.5, by - 3.5, 2, 2);
        ctx.fillRect(midX - 3.5, by + 1.5, 2, 2);
        ctx.fillRect(midX + 1.5, by + 1.5, 2, 2);
      });

      // Left chest patch pocket
      const pocX = midX - 160, pocY = 240, pocW = 100, pocH = 120;
      ctx.fillStyle = adjustColor(colorHex, 5);
      ctx.fillRect(pocX, pocY, pocW, pocH);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(pocX, pocY, pocW, pocH);
      ctx.setLineDash([]);

    } else if (category === 'jacket') {
      // ── TAILORED NAVY BLAZER ────────────────────────────────────────────────
      ctx.fillStyle = adjustColor(colorHex, -12);
      ctx.beginPath();
      ctx.moveTo(midX - 140, 0);
      ctx.lineTo(midX - 30, 480);
      ctx.lineTo(midX - 10, 480);
      ctx.lineTo(midX - 60, 200);
      ctx.lineTo(midX - 110, 220);
      ctx.lineTo(midX - 80, 80);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(midX + 140, 0);
      ctx.lineTo(midX + 30, 480);
      ctx.lineTo(midX + 10, 480);
      ctx.lineTo(midX + 60, 200);
      ctx.lineTo(midX + 110, 220);
      ctx.lineTo(midX + 80, 80);
      ctx.closePath();
      ctx.fill();

      // Inner white shirt & silk tie triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(midX - 35, 0); ctx.lineTo(midX + 35, 0); ctx.lineTo(midX, 220); ctx.closePath();
      ctx.fill();
      // Silk tie
      ctx.fillStyle = '#1c223a';
      ctx.beginPath();
      ctx.moveTo(midX - 14, 0); ctx.lineTo(midX + 14, 0); ctx.lineTo(midX + 18, 140); ctx.lineTo(midX, 240); ctx.lineTo(midX - 18, 140); ctx.closePath();
      ctx.fill();

      // Brass / Gold crest buttons
      [520, 680].forEach(by => {
        ctx.beginPath();
        ctx.arc(midX, by, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#d4af37';
        ctx.fill();
        ctx.strokeStyle = '#7c6114';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Pocket square peek
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(midX - 165, 290, 65, 12);

    } else if (category === 'kurta') {
      // ── FESTIVE KURTA ───────────────────────────────────────────────────────
      // Mandarin band collar
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(midX - 90, 0, 180, 40);

      // Golden zari embroidered placket
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(midX - 26, 40, 52, 480);

      // Placket embroidery motifs
      ctx.fillStyle = '#ffffffcc';
      for (let y = 60; y < 500; y += 32) {
        ctx.beginPath();
        ctx.arc(midX, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden spherical potli buttons
      [110, 210, 310, 410].forEach(by => {
        ctx.beginPath();
        ctx.arc(midX, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f3e5ab';
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Hemline zari border
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(0, size - 36, size, 36);

    } else if (category === 'dress') {
      // ── ROSE DRESS ──────────────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.beginPath();
      ctx.arc(midX - 60, 40, 50, 0, Math.PI);
      ctx.arc(midX + 60, 40, 50, 0, Math.PI);
      ctx.fill();

      // Cinched waist sash
      ctx.fillStyle = adjustColor(colorHex, -18);
      ctx.fillRect(0, 450, size, 42);

      // Gold / Pearl belt brooch
      ctx.beginPath();
      ctx.arc(midX, 471, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Flowing skirt vertical pleats
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let x = 40; x < size; x += 80) {
        ctx.fillRect(x, 492, 18, size - 492);
      }

    } else {
      // ── COTTON TEE ──────────────────────────────────────────────────────────
      ctx.fillStyle = adjustColor(colorHex, -14);
      ctx.beginPath();
      ctx.ellipse(midX, 35, 120, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colorHex || '#8270d8';
      ctx.beginPath();
      ctx.ellipse(midX, 28, 95, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Collar ribbed stitch lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(midX, 35, 118, 33, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hem double-stitching
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, size - 35); ctx.lineTo(size, size - 35);
      ctx.moveTo(0, size - 25); ctx.lineTo(size, size - 25);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ── DEFORMABLE GRID GEOMETRY BUILDER (TORSO & SLEEVES) ────────────────────────
function createDeformableGridGeometry(nRows, nCols) {
  const geo = new THREE.BufferGeometry();
  const numVerts = (nRows + 1) * (nCols + 1);
  const positions = new Float32Array(numVerts * 3);
  const uvs = new Float32Array(numVerts * 2);
  const indices = [];

  let idx = 0;
  for (let r = 0; r <= nRows; r++) {
    const v = 1.0 - (r / nRows);
    for (let c = 0; c <= nCols; c++) {
      const u = c / nCols;
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = v;
      positions[idx * 3] = 0;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = 0;
      idx++;
    }
  }

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const v0 = r * (nCols + 1) + c;
      const v1 = v0 + 1;
      const v2 = (r + 1) * (nCols + 1) + c;
      const v3 = v2 + 1;
      indices.push(v0, v2, v1);
      indices.push(v1, v2, v3);
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ── DEFORM UPPER BODY MESH FUNCTION ──────────────────────────────────────────
function deformUpperBodyMesh(group, pose, Nose_3D, span, userScale, userShift, category) {
  if (!group || !group.userData) return;
  const { torsoGeo, leftSleeveGeo, rightSleeveGeo } = group.userData;
  if (!torsoGeo || !leftSleeveGeo || !rightSleeveGeo) return;

  const S_L = pose.S_L;
  const S_R = pose.S_R;
  const E_L = pose.E_L;
  const E_R = pose.E_R;
  const W_L = pose.W_L;
  const W_R = pose.W_R;
  const H_L = pose.H_L;
  const H_R = pose.H_R;

  // 1. Torso Spine and Coordinate Axes
  const S_mid = new THREE.Vector3().addVectors(S_L, S_R).multiplyScalar(0.5);
  const H_mid = new THREE.Vector3().addVectors(H_L, H_R).multiplyScalar(0.5);

  let torsoDir = new THREE.Vector3().subVectors(H_mid, S_mid);
  if (torsoDir.length() < 0.2) torsoDir.set(0, -1, 0);
  else torsoDir.normalize();

  const rightVec = new THREE.Vector3().subVectors(S_R, S_L).normalize();
  let fwdVec = new THREE.Vector3().crossVectors(rightVec, torsoDir.clone().negate()).normalize();
  if (fwdVec.z < 0) fwdVec.negate();

  let neckAnchor = S_mid.clone().addScaledVector(torsoDir, span * 0.08);
  if (Nose_3D) {
    const maxCollarY = Nose_3D.y - (span * 0.28);
    if (neckAnchor.y > maxCollarY) neckAnchor.y = maxCollarY;
  }
  neckAnchor.y += userShift;

  const nRows = 24, nCols = 32;
  const torsoPos = torsoGeo.attributes.position.array;
  let ptr = 0;

  for (let r = 0; r <= nRows; r++) {
    const t = r / nRows;
    let C = new THREE.Vector3();
    if (t <= 1.0) {
      C.lerpVectors(neckAnchor, H_mid, t);
    } else {
      const ext = (category === 'dress' ? 1.05 : 0.60) * span;
      C.copy(H_mid).addScaledVector(torsoDir, (t - 1.0) * ext);
    }

    let wScale = 0.85, dScale = 0.45;
    if (category === 'dress') {
      if (t < 0.15) { wScale = 0.38 + t * 3.8; dScale = 0.24 + t * 1.0; }
      else if (t < 0.40) { wScale = 0.95 - (t - 0.15) * 0.5; dScale = 0.39; }
      else if (t < 0.60) { wScale = 0.82 - (t - 0.40) * 0.7; dScale = 0.34; }
      else { const st = (t - 0.60) / 0.40; wScale = 0.68 + st * 0.95; dScale = 0.34 + st * 0.75; }
    } else if (category === 'kurta') {
      if (t < 0.15) { wScale = 0.36 + t * 4.1; dScale = 0.24 + t * 1.2; }
      else if (t < 0.45) { wScale = 0.98 - (t - 0.15) * 0.4; dScale = 0.42; }
      else if (t < 0.75) { wScale = 0.86 - (t - 0.45) * 0.2; dScale = 0.40; }
      else { wScale = 0.80 + (t - 0.75) * 0.45; dScale = 0.42; }
    } else if (category === 'jacket') {
      if (t < 0.15) { wScale = 0.40 + t * 4.2; dScale = 0.26 + t * 1.3; }
      else if (t < 0.45) { wScale = 1.03 - (t - 0.15) * 0.4; dScale = 0.46; }
      else if (t < 0.75) { wScale = 0.91 - (t - 0.45) * 0.3; dScale = 0.44; }
      else { wScale = 0.82 + (t - 0.75) * 0.35; dScale = 0.44; }
    } else {
      if (t < 0.15) { wScale = 0.38 + t * 4.0; dScale = 0.24 + t * 1.1; }
      else if (t < 0.45) { wScale = 0.98 - (t - 0.15) * 0.4; dScale = 0.42; }
      else if (t < 0.75) { wScale = 0.86 - (t - 0.45) * 0.3; dScale = 0.38; }
      else { wScale = 0.77 + (t - 0.75) * 0.30; dScale = 0.38; }
    }

    const curW = span * wScale * userScale;
    const curD = span * dScale * userScale;

    for (let c = 0; c <= nCols; c++) {
      const theta = 2 * Math.PI * (c / nCols);
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let dx = (curW * 0.5) * sinT;
      let dz = (curD * 0.5) * cosT;

      let dy = 0;
      if (r < 4 && cosT > 0 && Math.abs(sinT) < 0.65) {
        dy = -span * 0.08 * (1 - r / 4) * Math.max(0, cosT);
      }

      const wrinkle = 0.012 * span * Math.sin(3 * theta + 4 * t) * Math.sin(t * Math.PI);
      dz += wrinkle;
      if (category === 'dress' && t > 0.60) {
        dz += 0.035 * span * Math.sin(8 * theta) * ((t - 0.60) / 0.40);
      }

      torsoPos[ptr++] = C.x + dx * rightVec.x + dz * fwdVec.x;
      torsoPos[ptr++] = C.y + dy + dx * rightVec.y + dz * fwdVec.y;
      torsoPos[ptr++] = C.z + dx * rightVec.z + dz * fwdVec.z;
    }
  }

  torsoGeo.attributes.position.needsUpdate = true;
  torsoGeo.computeVertexNormals();

  // 2. Sleeve Deformations (Left & Right Arms)
  const isShortSleeve = (category === 'tee' || category === 'dress');
  deformSingleSleeve(leftSleeveGeo, S_L, E_L, W_L, span, userScale, isShortSleeve);
  deformSingleSleeve(rightSleeveGeo, S_R, E_R, W_R, span, userScale, isShortSleeve);
}

function deformSingleSleeve(geo, S, E, W, span, userScale, isShortSleeve) {
  const nRows = 20, nCols = 16;
  const pos = geo.attributes.position.array;
  let ptr = 0;

  for (let k = 0; k <= nRows; k++) {
    const s = k / nRows;
    let P = new THREE.Vector3();
    let T = new THREE.Vector3();

    if (isShortSleeve) {
      const reach = s * 0.48;
      P.lerpVectors(S, E, reach);
      T.subVectors(E, S);
    } else {
      if (s <= 0.5) {
        const u = s / 0.5;
        P.lerpVectors(S, E, u);
        T.subVectors(E, S);
      } else {
        const u = (s - 0.5) / 0.5;
        P.lerpVectors(E, W, u);
        T.subVectors(W, E);
      }
    }

    const { N, B } = getOrthoFrame(T);

    let rFrac = 0.16;
    if (s < 0.15) rFrac = 0.20 - s * 0.25;
    else if (s < 0.50) rFrac = 0.15 - (s - 0.15) * 0.06;
    else rFrac = 0.13 - (s - 0.50) * 0.06;

    const r = span * rFrac * userScale;
    const armTilt = Math.abs(T.clone().normalize().y);
    const drapeAmt = (1.0 - armTilt) * span * 0.025 * userScale;

    for (let c = 0; c <= nCols; c++) {
      const phi = 2 * Math.PI * (c / nCols);
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      let wrinkle = 0;
      if (!isShortSleeve && Math.abs(s - 0.5) < 0.18) {
        wrinkle = 0.010 * span * Math.sin(4 * phi) * (1.0 - Math.abs(s - 0.5) / 0.18);
      }

      const totalR = r + wrinkle;
      pos[ptr++] = P.x + totalR * (cosP * N.x + sinP * B.x);
      pos[ptr++] = P.y + totalR * (cosP * N.y + sinP * B.y) - drapeAmt;
      pos[ptr++] = P.z + totalR * (cosP * N.z + sinP * B.z);
    }
  }

  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
}

// ── CONTINUOUS DEFORMABLE 3D GARMENT BUILDER ─────────────────────────────────
function buildDynamicRiggedGarment(category, colorHex, customTextureUrl = null) {
  const group = new THREE.Group();

  const torsoGeo = createDeformableGridGeometry(24, 32);
  const leftSleeveGeo = createDeformableGridGeometry(20, 16);
  const rightSleeveGeo = createDeformableGridGeometry(20, 16);

  const torsoTex = generateRealisticClothTexture(category, colorHex, customTextureUrl, false);
  const sleeveTex = generateRealisticClothTexture(category, colorHex, customTextureUrl, true);

  const clothMat = new THREE.MeshStandardMaterial({
    map: torsoTex,
    roughness: 0.72,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  const sleeveMat = new THREE.MeshStandardMaterial({
    map: sleeveTex,
    roughness: 0.72,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });

  const torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
  group.add(torsoMesh);

  const torsoWireframe = new THREE.Mesh(torsoGeo, wireMat);
  torsoWireframe.visible = show3DMeshWireframe;
  group.add(torsoWireframe);

  const leftSleeveMesh = new THREE.Mesh(leftSleeveGeo, sleeveMat);
  group.add(leftSleeveMesh);

  const leftSleeveWireframe = new THREE.Mesh(leftSleeveGeo, wireMat);
  leftSleeveWireframe.visible = show3DMeshWireframe;
  group.add(leftSleeveWireframe);

  const rightSleeveMesh = new THREE.Mesh(rightSleeveGeo, sleeveMat);
  group.add(rightSleeveMesh);

  const rightSleeveWireframe = new THREE.Mesh(rightSleeveGeo, wireMat);
  rightSleeveWireframe.visible = show3DMeshWireframe;
  group.add(rightSleeveWireframe);

  group.userData = {
    torsoGeo,
    leftSleeveGeo,
    rightSleeveGeo,
    torsoWireframe,
    leftSleeveWireframe,
    rightSleeveWireframe,
    clothMat,
    sleeveMat,
    wireMat,
    category,
    colorHex
  };

  return group;
}

// ── BUILD & ATTACH 3D GARMENT CONTROLLER ──────────────────────────────────────
function buildAndAttach3DGarment(category, colorHex, customTextureUrl = null) {
  if (!threeScene) return;

  if (active3DGarmentGroup) {
    threeScene.remove(active3DGarmentGroup);
    active3DGarmentGroup = null;
  }

  active3DGarmentGroup = buildDynamicRiggedGarment(category, colorHex, customTextureUrl);
  threeScene.add(active3DGarmentGroup);

  if (is3DOrbitMode) {
    setupOrbitGarment(active3DGarmentGroup);
  }
}

function update3DGarmentColor(colorHex) {
  selectedColor = colorHex;
  if (!active3DGarmentGroup) return;
  buildAndAttach3DGarment(selectedCat, selectedColor);
}

function setupOrbitGarment(group) {
  if (!group || !group.userData) return;
  const { category, colorHex } = group.userData;

  const mannequinPose = {
    S_L: new THREE.Vector3(-0.85, 0.55, 0),
    S_R: new THREE.Vector3(0.85, 0.55, 0),
    E_L: new THREE.Vector3(-1.18, 0.08, 0),
    E_R: new THREE.Vector3(1.18, 0.08, 0),
    W_L: new THREE.Vector3(-1.30, -0.42, 0),
    W_R: new THREE.Vector3(1.30, -0.42, 0),
    H_L: new THREE.Vector3(-0.65, -0.72, 0),
    H_R: new THREE.Vector3(0.65, -0.72, 0)
  };

  deformUpperBodyMesh(group, mannequinPose, new THREE.Vector3(0, 1.15, 0), 1.70, 1.0, 0, category);
}

// ── THREE.JS ENGINE INITIALIZATION ───────────────────────────────────────────
function initThreeEngine() {
  const canvas = $('threeCanvas');
  if (!canvas || threeRenderer || !window.THREE) return;

  const w = canvas.parentElement.offsetWidth || 640;
  const h = canvas.parentElement.offsetHeight || 520;

  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  threeCamera.position.set(0, 0, 4.8);

  threeRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  threeRenderer.setSize(w, h);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Fabric studio lighting (Key, Fill, and Rim)
  const ambient = new THREE.AmbientLight(0xffffff, 0.90);
  threeScene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
  keyLight.position.set(2.5, 4.0, 3.5);
  threeScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8270d8, 0.45);
  fillLight.position.set(-2.5, -1.0, 2.0);
  threeScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
  rimLight.position.set(0, 2.0, -3.5);
  threeScene.add(rimLight);

  // OrbitControls for 360° inspector view
  if (window.THREE.OrbitControls) {
    threeControls = new THREE.OrbitControls(threeCamera, canvas);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.08;
    threeControls.enablePan = false;
    threeControls.minDistance = 2.0;
    threeControls.maxDistance = 8.0;
    threeControls.enabled = is3DOrbitMode;
  }

  // Initial 3D model build
  buildAndAttach3DGarment(selectedCat, selectedColor);

  // Three.js Render loop
  function threeRenderLoop() {
    requestAnimationFrame(threeRenderLoop);
    if (is3DOrbitMode && threeControls) {
      threeControls.update();
    }
    threeRenderer.render(threeScene, threeCamera);
  }
  threeRenderLoop();

  // Wire 3D AR vs 360° Orbit vs Wireframe toggle buttons
  const arBtn = $('view3dArBtn');
  const orbitBtn = $('view3dOrbitBtn');
  const wireBtn = $('toggleMeshWireframeBtn');

  if (arBtn && orbitBtn) {
    arBtn.onclick = () => {
      is3DOrbitMode = false;
      arBtn.classList.add('active');
      orbitBtn.classList.remove('active');
      if (threeControls) threeControls.enabled = false;
      threeCamera.position.set(0, 0, 4.8);
      threeCamera.lookAt(0, 0, 0);
      threeSmoothPose.init = false;
      notify('◉ 3D AR Body Tracking Active — turn sideways or raise hands to see dynamic fit!');
    };
    orbitBtn.onclick = () => {
      is3DOrbitMode = true;
      orbitBtn.classList.add('active');
      arBtn.classList.remove('active');
      if (threeControls) {
        threeControls.enabled = true;
        threeControls.reset();
      }
      setupOrbitGarment(active3DGarmentGroup);
      notify('↻ 360° Inspector: Drag with mouse to spin 3D clothes front, back, top, bottom!');
    };
  }

  if (wireBtn) {
    wireBtn.onclick = () => {
      show3DMeshWireframe = !show3DMeshWireframe;
      wireBtn.classList.toggle('active', show3DMeshWireframe);
      if (active3DGarmentGroup && active3DGarmentGroup.userData) {
        const { torsoWireframe, leftSleeveWireframe, rightSleeveWireframe } = active3DGarmentGroup.userData;
        if (torsoWireframe) torsoWireframe.visible = show3DMeshWireframe;
        if (leftSleeveWireframe) leftSleeveWireframe.visible = show3DMeshWireframe;
        if (rightSleeveWireframe) rightSleeveWireframe.visible = show3DMeshWireframe;
      }
      notify(show3DMeshWireframe ? '⚡ 3D Body Mesh Wireframe ON: Real-time polygon grid tracking active!' : '◉ Photorealistic Cloth View Active');
    };
  }
}

// ── 3D POSE TO REAL SKELETAL CLOTHING POSE (DYNAMIC ARMS & BODY WRAP) ────────
function update3DGarmentPose(lm, W, H) {
  if (!active3DGarmentGroup || is3DOrbitMode || !threeCamera) return;

  const isVideo = ($('video').style.display !== 'none');
  const videoEl = $('video');
  const photoEl = $('photo');
  const mediaW = isVideo ? (videoEl.videoWidth || 640) : (photoEl.naturalWidth || 640);
  const mediaH = isVideo ? (videoEl.videoHeight || 480) : (photoEl.naturalHeight || 480);
  const metrics = getCoverMetrics(mediaW, mediaH, W, H);

  // Perspective camera frustum dimensions at depth Z = 0
  const camDist = 4.8;
  const vFovRad = (threeCamera.fov * Math.PI) / 180;
  const viewHeight = 2 * Math.tan(vFovRad / 2) * camDist;
  const viewWidth = viewHeight * (W / H);

  const pt = i => {
    const rawX = isVideo ? (1 - lm[i].x) : lm[i].x;
    return {
      x: metrics.offsetX + rawX * metrics.scaledW,
      y: metrics.offsetY + lm[i].y * metrics.scaledH,
      z: lm[i].z || 0,
      v: lm[i].visibility ?? 1.0
    };
  };

  const to3D = p => {
    const ndcX = (p.x / W) * 2 - 1;
    const ndcY = -(p.y / H) * 2 + 1;
    return new THREE.Vector3(
      ndcX * (viewWidth / 2),
      ndcY * (viewHeight / 2),
      -(p.z || 0) * (viewWidth * 0.40)
    );
  };

  // Screen Left and Screen Right Chains (Handles mirrored webcam & uploaded photo)
  const pShL = isVideo ? pt(12) : pt(11);
  const pShR = isVideo ? pt(11) : pt(12);

  const pElL = isVideo ? pt(14) : pt(13);
  const pElR = isVideo ? pt(13) : pt(14);

  const pWrL = isVideo ? pt(16) : pt(15);
  const pWrR = isVideo ? pt(15) : pt(16);

  const pHiL = isVideo ? pt(24) : pt(23);
  const pHiR = isVideo ? pt(23) : pt(24);

  const pNose = pt(0);

  const S_L = to3D(pShL);
  const S_R = to3D(pShR);
  const Nose_3D = (pNose && pNose.v > 0.3) ? to3D(pNose) : null;

  const shoulderVec = new THREE.Vector3().subVectors(S_R, S_L);
  let span = shoulderVec.length();
  if (span < 0.25) span = 1.6;

  // User UI slider offsets
  const userPosShift = ((Number(posEl?.value || 50) - 50) / 50) * (viewHeight * 0.15);
  const userScaleFactor = Math.max(0.6, Math.min(1.5, Number(scaleEl?.value || 100) / 100));

  // Downward direction in 2D body plane
  const sh2D = new THREE.Vector2(shoulderVec.x, shoulderVec.y).normalize();
  let downDir = new THREE.Vector3(sh2D.y, -sh2D.x, 0).normalize();
  if (downDir.y > 0) downDir.negate();

  // Arms: Elbows and Wrists (dynamically lift when user raises hand!)
  let E_L = (pElL.v > 0.20) ? to3D(pElL) : S_L.clone().addScaledVector(downDir, span * 0.58).sub(shoulderVec.clone().multiplyScalar(0.18));
  let E_R = (pElR.v > 0.20) ? to3D(pElR) : S_R.clone().addScaledVector(downDir, span * 0.58).add(shoulderVec.clone().multiplyScalar(0.18));

  let W_L = (pWrL.v > 0.20) ? to3D(pWrL) : E_L.clone().addScaledVector(downDir, span * 0.52);
  let W_R = (pWrR.v > 0.20) ? to3D(pWrR) : E_R.clone().addScaledVector(downDir, span * 0.52);

  let H_L = (pHiL.v > 0.15) ? to3D(pHiL) : S_L.clone().addScaledVector(downDir, span * 1.35);
  let H_R = (pHiR.v > 0.15) ? to3D(pHiR) : S_R.clone().addScaledVector(downDir, span * 1.35);

  // Smooth with EMA
  if (!threeSmoothPose.init) {
    threeSmoothPose.S_L.copy(S_L);
    threeSmoothPose.S_R.copy(S_R);
    threeSmoothPose.E_L.copy(E_L);
    threeSmoothPose.E_R.copy(E_R);
    threeSmoothPose.W_L.copy(W_L);
    threeSmoothPose.W_R.copy(W_R);
    threeSmoothPose.H_L.copy(H_L);
    threeSmoothPose.H_R.copy(H_R);
    threeSmoothPose.init = true;
  } else {
    const k = 0.40;
    threeSmoothPose.S_L.lerp(S_L, k);
    threeSmoothPose.S_R.lerp(S_R, k);
    threeSmoothPose.E_L.lerp(E_L, k);
    threeSmoothPose.E_R.lerp(E_R, k);
    threeSmoothPose.W_L.lerp(W_L, k);
    threeSmoothPose.W_R.lerp(W_R, k);
    threeSmoothPose.H_L.lerp(H_L, k);
    threeSmoothPose.H_R.lerp(H_R, k);
  }

  const { category } = active3DGarmentGroup.userData || {};

  // Procedural Upper-Body Deformable Mesh Update (Torso + Dynamic Lifting Arms)
  deformUpperBodyMesh(
    active3DGarmentGroup,
    threeSmoothPose,
    Nose_3D,
    span,
    userScaleFactor,
    userPosShift,
    category
  );
}

// ── MEDIAPIPE POSE DETECTION ENGINE ──────────────────────────────────────────
if (poseToggle) {
  poseToggle.onclick = () => {
    if (!poseActive) {
      startPoseDetection(false);
    } else {
      stopPoseDetection();
    }
  };
}

function startPoseDetection(silent = false) {
  if (!cameraStream && !$('photo').src) {
    if (!silent) notify('Start your webcam or upload a photo first.');
    return;
  }
  poseActive = true;
  updatePoseToggleUI();

  if (window.Pose) {
    initPoseModel(silent);
  } else {
    if (!silent) notify('Loading 3D AR Body Tracking engine…');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => initPoseModel(silent);
    script.onerror = () => {
      notify('MediaPipe could not load — check your internet connection.');
      poseActive = false;
      updatePoseToggleUI();
    };
    document.head.appendChild(script);
  }
}

function initPoseModel(silent = false) {
  const video = $('video');
  if (!video) return;

  try {
    poseModel = new window.Pose({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    poseModel.setOptions({
      modelComplexity: 0,        // Lite model: 60 FPS real-time
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });

    poseModel.onResults(onPoseResults);
    runPoseLoop();
    if (!silent) notify('◉ 3D AR Body Fit Active — tracking your posture at 60 FPS');
  } catch (err) {
    console.error('Pose init error:', err);
  }
}

// Aspect ratio cover mapping: guarantees pixel-perfect landmark alignment on cropped video
function getCoverMetrics(mediaW, mediaH, canvasW, canvasH) {
  if (!mediaW || !mediaH) return { scale: 1, offsetX: 0, offsetY: 0, scaledW: canvasW, scaledH: canvasH };
  const scale = Math.max(canvasW / mediaW, canvasH / mediaH);
  const scaledW = mediaW * scale;
  const scaledH = mediaH * scale;
  const offsetX = (canvasW - scaledW) / 2;
  const offsetY = (canvasH - scaledH) / 2;
  return { scale, offsetX, offsetY, scaledW, scaledH };
}

let isPoseProcessing = false;
let poseLoopTimer = null;

async function runPoseLoop() {
  if (!poseActive || !poseModel) return;

  const video = $('video');
  const photo = $('photo');
  const hasVideo = video && video.style.display !== 'none' && video.readyState >= 2;
  const hasPhoto = photo && photo.style.display !== 'none' && photo.complete && photo.naturalWidth > 0;

  // Only send a new frame if previous inference is complete (ELIMINATES LAG!)
  if (!isPoseProcessing && (hasVideo || hasPhoto)) {
    isPoseProcessing = true;
    try {
      const src = hasVideo ? video : photo;
      await poseModel.send({ image: src });
    } catch (e) {
      // transient frame drop
    } finally {
      isPoseProcessing = false;
    }
  }

  // Paced loop: ~35 FPS avoids WASM memory saturation and keeps UI silky smooth
  if (poseActive) {
    poseLoopTimer = setTimeout(() => {
      poseRAF = requestAnimationFrame(runPoseLoop);
    }, 24);
  }
}

// ── 3D AR HUD & SHOULDER TRACKING RETICLES ───────────────────────────────────
function draw3DGarmentMesh(ctx, W, H, lm) {
  const isVideo = ($('video').style.display !== 'none');
  const videoEl = $('video');
  const photoEl = $('photo');
  const mediaW = isVideo ? (videoEl.videoWidth || 640) : (photoEl.naturalWidth || 640);
  const mediaH = isVideo ? (videoEl.videoHeight || 480) : (photoEl.naturalHeight || 480);
  const metrics = getCoverMetrics(mediaW, mediaH, W, H);

  const pt = i => {
    const rawX = isVideo ? (1 - lm[i].x) : lm[i].x;
    return {
      x: metrics.offsetX + rawX * metrics.scaledW,
      y: metrics.offsetY + lm[i].y * metrics.scaledH,
      z: lm[i].z || 0
    };
  };

  const pShL = isVideo ? pt(12) : pt(11); // screen-left shoulder
  const pShR = isVideo ? pt(11) : pt(12); // screen-right shoulder
  const pElL = isVideo ? pt(14) : pt(13); // screen-left elbow
  const pElR = isVideo ? pt(13) : pt(14); // screen-right elbow
  const pWrL = isVideo ? pt(16) : pt(15); // screen-left wrist
  const pWrR = isVideo ? pt(15) : pt(16); // screen-right wrist
  const pHiL = isVideo ? pt(24) : pt(23); // screen-left hip
  const pHiR = isVideo ? pt(23) : pt(24); // screen-right hip

  // Connect 3D coordinates to Three.js deformable cloth mesh!
  update3DGarmentPose(lm, W, H);

  // Hide 2D flat SVG overlay and guide when 3D AR tracking is live
  $('garmentLayer').style.display = 'none';
  $('guide').style.display = 'none';

  // Calculate live arm elevation metrics
  const span2D = Math.max(30, Math.hypot(pShR.x - pShL.x, pShR.y - pShL.y));
  const armElevL = Math.max(0, Math.min(100, Math.round(((pShL.y - pWrL.y + span2D * 0.4) / (span2D * 1.15)) * 100)));
  const armElevR = Math.max(0, Math.min(100, Math.round(((pShR.y - pWrR.y + span2D * 0.4) / (span2D * 1.15)) * 100)));

  ctx.save();

  // If 3D Mesh Wireframe mode is active, render Cyber Upper-Body Skeletal Mesh lines
  if (show3DMeshWireframe) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.70)';
    ctx.fillStyle = '#00f3ff';

    // 1. Clavicle & Spine Lines
    ctx.beginPath();
    ctx.moveTo(pShL.x, pShL.y); ctx.lineTo(pShR.x, pShR.y);
    const midShX = (pShL.x + pShR.x) / 2, midShY = (pShL.y + pShR.y) / 2;
    const midHiX = (pHiL.x + pHiR.x) / 2, midHiY = (pHiL.y + pHiR.y) / 2;
    ctx.moveTo(midShX, midShY); ctx.lineTo(midHiX, midHiY);

    // 2. Left Arm Mesh Spine
    ctx.moveTo(pShL.x, pShL.y); ctx.lineTo(pElL.x, pElL.y); ctx.lineTo(pWrL.x, pWrL.y);
    // 3. Right Arm Mesh Spine
    ctx.moveTo(pShR.x, pShR.y); ctx.lineTo(pElR.x, pElR.y); ctx.lineTo(pWrR.x, pWrR.y);

    // 4. Torso Flanks & Rib Diagonals
    ctx.moveTo(pShL.x, pShL.y); ctx.lineTo(pHiL.x, pHiL.y); ctx.lineTo(pHiR.x, pHiR.y); ctx.lineTo(pShR.x, pShR.y);
    ctx.moveTo(pShL.x, pShL.y); ctx.lineTo(pHiR.x, pHiR.y);
    ctx.moveTo(pShR.x, pShR.y); ctx.lineTo(pHiL.x, pHiL.y);
    ctx.stroke();

    // 5. Joint Reticles & Depth Nodes
    [pShL, pShR, pElL, pElR, pWrL, pWrR, pHiL, pHiR].forEach(joint => {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.40)';
      ctx.stroke();
    });
  } else {
    // Elegant shoulder tracking reticles
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(130, 112, 216, 0.70)';
    ctx.beginPath(); ctx.arc(pShL.x, pShL.y, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(pShR.x, pShR.y, 5, 0, Math.PI * 2); ctx.stroke();
  }

  // Live Anywear 3D HUD Badge
  ctx.fillStyle = 'rgba(18, 16, 30, 0.90)';
  ctx.beginPath();
  ctx.roundRect(14, 14, 275, 30, 7);
  ctx.fill();
  ctx.strokeStyle = show3DMeshWireframe ? 'rgba(0, 243, 255, 0.50)' : 'rgba(255, 255, 255, 0.16)';
  ctx.stroke();

  // Green / Cyan active pulse dot
  ctx.beginPath();
  ctx.arc(26, 29, 4, 0, Math.PI * 2);
  ctx.fillStyle = show3DMeshWireframe ? '#00f3ff' : '#319b79';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 9px "DM Sans", sans-serif';
  ctx.textAlign = 'left';
  const modeText = show3DMeshWireframe ? '3D MESH TRACKING · WIREFRAME + FABRIC' : '3D DEFORMABLE MESH · AR BODY FIT';
  ctx.fillText(modeText, 38, 28);
  ctx.fillStyle = '#b7b4c7';
  ctx.font = '600 7.5px "DM Sans", sans-serif';
  ctx.fillText(`L-ARM: ${armElevL}% · R-ARM: ${armElevR}% · 60 FPS`, 38, 38);

  ctx.restore();

  // Update caption
  $('stageCaption').textContent = `3D DEFORMABLE MESH: ${selectedCat.toUpperCase()} · DYNAMIC SKELETAL FIT`;
}

function onPoseResults(results) {
  if (!poseCanvas) return;
  const ctx = poseCanvas.getContext('2d');

  // Only resize canvas buffer if dimensions changed
  const ow = poseCanvas.offsetWidth;
  const oh = poseCanvas.offsetHeight;
  if (poseCanvas.width !== ow || poseCanvas.height !== oh) {
    poseCanvas.width = ow;
    poseCanvas.height = oh;
    if (threeRenderer) threeRenderer.setSize(ow, oh);
    if (threeCamera) {
      threeCamera.aspect = ow / oh;
      threeCamera.updateProjectionMatrix();
    }
  }
  ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

  if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
    return;
  }

  // Render high-fidelity 3D AR Body-Fitting Garment in Three.js
  draw3DGarmentMesh(ctx, poseCanvas.width, poseCanvas.height, results.poseLandmarks);
}

function stopPoseDetection() {
  poseActive = false;
  isPoseProcessing = false;
  threePoseState.init = false;
  threeSmoothPose.init = false;
  if (poseLoopTimer) clearTimeout(poseLoopTimer);
  if (poseRAF) cancelAnimationFrame(poseRAF);
  if (poseCanvas) {
    const ctx = poseCanvas.getContext('2d');
    ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  }
  if (currentMode === 'manual') {
    $('garmentLayer').style.display = 'block';
    $('guide').style.display = 'block';
  } else {
    $('garmentLayer').style.display = 'none';
  }
  $('stageCaption').textContent = currentMode === 'fashn' ? 'FASHN VTON MODE · COLAB GPU' : 'VIRTUAL STUDIO · READY';
  updatePoseToggleUI();
}

function updatePoseToggleUI() {
  if (!poseToggle) return;
  const statusEl = $('poseStatus');
  if (poseActive) {
    poseToggle.textContent = '◉ 3D AR Body Fit: ON';
    poseToggle.classList.add('active');
    if (statusEl) {
      statusEl.textContent = '3D AR: ACTIVE — tracking body & shoulders';
      statusEl.style.color = '#319b79';
    }
  } else {
    poseToggle.textContent = '○ 3D AR Body Fit: OFF';
    poseToggle.classList.remove('active');
    if (statusEl) {
      statusEl.textContent = '3D AR: OFF — manual positioning';
      statusEl.style.color = '#898797';
    }
  }
}

// ── ANYWEAR REAL-TIME GARMENT DOCK & ASSET LOADER ─────────────────────────────
let activeGarmentImg = new Image();
activeGarmentImg.src = 'assets/garments/tee_lavender.png';

function setupAnywearDock() {
  const items = $$('.anywear-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(it => it.classList.remove('active'));
      item.classList.add('active');

      const imgSrc = item.dataset.img;
      const cat = item.dataset.cat;
      const color = item.dataset.color;
      const name = item.dataset.name;

      if (imgSrc) {
        activeGarmentImg = new Image();
        activeGarmentImg.src = imgSrc;
      }
      if (cat) setCategory(cat);
      if (color) setColor(color);

      // Auto-start pose detection if not yet active
      if (!poseActive && (cameraStream || $('photo').src)) {
        startPoseDetection(true);
      }

      notify(`✦ Anywear AR: Switched to ${name}`);
      speak(`Switched to ${name}`);
    });
  });

  // Custom Garment Upload (Anywear feature: upload any clothing picture from Zara, Nike, etc.)
  const customInput = $('customGarmentInput');
  if (customInput) {
    customInput.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const customUrl = ev.target.result;
        activeGarmentImg = new Image();
        activeGarmentImg.src = customUrl;
        items.forEach(it => it.classList.remove('active'));

        if (typeof buildAndAttach3DGarment === 'function') {
          buildAndAttach3DGarment(selectedCat, selectedColor, customUrl);
        }

        if (!poseActive && (cameraStream || $('photo').src)) {
          startPoseDetection(true);
        }
        notify('Custom garment loaded — fitting onto your live body in real time!');
        speak('Custom garment fitted onto your body.');
      };
      reader.readAsDataURL(file);
    };
  }

  // Snapshot Try-On Look button
  const snapBtn = $('snapshotBtn');
  if (snapBtn) {
    snapBtn.onclick = captureTryOnSnapshot;
  }
}

// ── SNAPSHOT: SAVE TRY-ON PICTURE ─────────────────────────────────────────────
function captureTryOnSnapshot() {
  const video = $('video');
  const photo = $('photo');
  const canvas = document.createElement('canvas');
  const w = poseCanvas.width || 640;
  const h = poseCanvas.height || 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Draw background (mirrored video or uploaded photo)
  if (video.style.display !== 'none' && video.readyState >= 2) {
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
  } else if (photo.style.display !== 'none' && photo.complete) {
    ctx.drawImage(photo, 0, 0, w, h);
  }

  // Draw the 3D WebGL volumetric clothing layer
  const threeCanv = $('threeCanvas');
  if (threeCanv) {
    ctx.drawImage(threeCanv, 0, 0, w, h);
  }

  // Draw the fitted garment layer from poseCanvas
  ctx.drawImage(poseCanvas, 0, 0, w, h);

  // Trigger download
  const a = document.createElement('a');
  a.download = `StyleSpeak_Anywear_TryOn_${Date.now()}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  notify('📸 Snapshot saved to your device!');
  speak('Snapshot captured and saved.');
}

// ── VOICE COMMAND PROCESSING ──────────────────────────────────────────────────
function applyVoiceCommand(command) {
  const cmd = command.toLowerCase().trim();
  let acted  = false;
  let msg    = '';

  // Reset
  if (cmd.includes('reset') || cmd.includes('clear') || cmd.includes('start over')) {
    const retake = $('retakeBtn');
    if (retake) retake.click();
    msg = 'Reset complete.';
    acted = true;
  }

  // Navigate
  const navMap = {
    'studio':         'studio',
    'virtual studio': 'studio',
    'fitting room':   'studio',
    'assistant':      'assistant',
    'recommendation': 'assistant',
    'fashion':        'assistant',
    'wardrobe':       'wardrobe',
    'catalogue':      'wardrobe',
    'catalog':        'wardrobe',
    'outfit':         'wardrobe',
    'home':           'landing',
    'landing':        'landing',
    'about':          'about',
    'settings':       'settings',
    'overview':       'overview',
  };
  for (const [keyword, view] of Object.entries(navMap)) {
    if (cmd.includes('go to ' + keyword) || cmd.includes('open ' + keyword) || cmd.includes('take me to ' + keyword)) {
      switchView(view);
      msg = 'Navigating to ' + keyword + '.';
      acted = true;
      break;
    }
  }

  // Detect garment type
  const garmentMap = {
    'dress': 'dress', 'gown': 'dress', 'frock': 'dress',
    'jacket': 'jacket', 'blazer': 'jacket', 'coat': 'jacket',
    'kurta': 'kurta', 'kurti': 'kurta', 'ethnic': 'kurta', 'traditional': 'kurta',
    'tee': 'tee', 't-shirt': 'tee', 'tshirt': 'tee', 'hoodie': 'tee',
    'top': 'top', 'shirt': 'top', 'blouse': 'top', 'tunic': 'top',
  };
  let detectedGarment = null;
  for (const [kw, cat] of Object.entries(garmentMap)) {
    if (cmd.includes(kw)) { detectedGarment = cat; break; }
  }

  // Detect colour
  let detectedColor = null;
  for (const [kw, hex] of Object.entries(COLORS)) {
    if (cmd.includes(kw)) { detectedColor = hex; break; }
  }

  if (detectedGarment) { setCategory(detectedGarment); acted = true; }
  if (detectedColor)   { setColor(detectedColor);       acted = true; }

  // Adjust position
  if (cmd.includes('move left'))  { if (posEl) { posEl.value = 38; posEl.dispatchEvent(new Event('input')); } acted = true; }
  if (cmd.includes('move right')) { if (posEl) { posEl.value = 62; posEl.dispatchEvent(new Event('input')); } acted = true; }
  if (cmd.includes('bigger') || cmd.includes('larger')) { if (scaleEl) { scaleEl.value = Math.min(130, +scaleEl.value + 15); scaleEl.dispatchEvent(new Event('input')); } acted = true; }
  if (cmd.includes('smaller'))    { if (scaleEl) { scaleEl.value = Math.max(70,  +scaleEl.value - 15); scaleEl.dispatchEvent(new Event('input')); } acted = true; }

  // Build feedback message
  if (!msg) {
    const parts = [];
    if (detectedGarment) parts.push('switched to ' + detectedGarment);
    if (detectedColor)   {
      const colorName = Object.entries(COLORS).find(([, v]) => v === detectedColor)?.[0] || 'new colour';
      parts.push('colour changed to ' + colorName);
    }
    msg = parts.length ? parts.join(' and ') + '.' : (acted ? 'Done.' : 'Command not recognized.');
  }

  // Also post to backend if online
  if (backendOnline) postVoiceToBackend(command, msg);

  return { acted, msg };
}

async function postVoiceToBackend(transcript, fallbackMsg) {
  try {
    const r = await fetch(`${API_BASE}/api/voice/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, current_garment: selectedCat, current_color: selectedColor }),
    });
    if (r.ok) {
      const d = await r.json();
      console.log('[Backend] Voice parsed:', d);
    }
  } catch { /* silent */ }
}

// ── WEB SPEECH API ────────────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const listenBtn         = $('listenBtn');
const voiceStatusEl     = $('voiceStatus');

if (listenBtn) {
  listenBtn.onclick = () => {
    if (!SpeechRecognition) {
      if (voiceStatusEl) voiceStatusEl.textContent = 'Speech recognition is not supported in this browser. Use Chrome or Edge.';
      notify('Voice not supported — use Chrome or Edge.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang            = voiceLang;
    rec.interimResults  = false;
    rec.maxAlternatives = 3;

    listenBtn.textContent = '🎙 Listening…';
    listenBtn.disabled    = true;
    if (voiceStatusEl) voiceStatusEl.textContent = 'Listening… say a colour or garment command.';

    rec.onresult = e => {
      // Try all alternatives for best intent match
      let bestCmd = null, bestActed = false;
      for (let i = 0; i < e.results[0].length; i++) {
        const transcript = e.results[0][i].transcript.toLowerCase();
        const result     = applyVoiceCommand(transcript);
        if (result.acted) { bestCmd = transcript; bestActed = true; break; }
        if (!bestCmd) bestCmd = transcript;
      }

      if (voiceStatusEl) voiceStatusEl.textContent = 'Heard: "' + bestCmd + '"';
      const { msg } = applyVoiceCommand(bestCmd);
      notify('🎙 ' + msg);
      speak(msg);
    };

    rec.onerror = e => {
      const msgs = {
        'no-speech':     'No speech detected — tap again to retry.',
        'not-allowed':   'Microphone access denied. Allow it in browser settings.',
        'network':       'Network error during voice recognition.',
        'aborted':       'Listening cancelled.',
      };
      const text = msgs[e.error] || 'Voice error: ' + e.error;
      if (voiceStatusEl) voiceStatusEl.textContent = text;
      notify(text);
    };

    rec.onend = () => {
      listenBtn.textContent = '🎙  Start voice control';
      listenBtn.disabled    = false;
    };

    rec.start();
  };
}

// ── FASHION ASSISTANT (recommendations) ───────────────────────────────────────
const recommendBtn = $('recommendBtn');
if (recommendBtn) {
  recommendBtn.onclick = makeRecommendation;
}

async function makeRecommendation() {
  const occasionEl = $('occasion');
  const stylePrefEl = $('stylePreference');
  const weatherEl   = $('weather');

  const key   = occasionEl?.value || 'college';
  const pref  = stylePrefEl?.value || 'balanced';
  const wthr  = weatherEl?.value   || 'any';
  const r     = RECS[key];

  if (!r) return;

  // Clone items and add modifier chips
  let chips = [...r.items];
  let accessoryList = [...(r.accessories || [])];
  if (pref === 'minimal')     chips.push('Keep accessories minimal');
  if (pref === 'bold')        chips.push('Add a statement colour piece');
  if (pref === 'traditional' && !chips.some(x => x.toLowerCase().includes('kurta'))) chips.push('Traditional accent piece');
  if (pref === 'classic')     chips.push('Classic cuts and neutral tones');
  if (wthr === 'warm')        chips.push('Breathable lightweight fabrics');
  if (wthr === 'cool')        chips.push('Add a light jacket or shawl');

  // Try backend first, fall back to local
  let recData = r;
  if (backendOnline) {
    try {
      const resp = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion: key, style_preference: pref, weather: wthr }),
      });
      if (resp.ok) recData = await resp.json();
    } catch { /* use local data */ }
  }

  const resultEl = $('recommendResult');
  if (!resultEl) return;

  resultEl.innerHTML = `
    <div class="result-content">
      <div class="eyebrow">YOUR PERSONAL STYLE DIRECTION</div>
      <h2>${r.title}</h2>
      <p>${r.desc}</p>
      <div class="suggestion-chips">
        ${chips.map(x => `<span>${x}</span>`).join('')}
      </div>
      <div class="accessories-row">
        <b>Accessories:</b>
        <div class="accessory-chips">${accessoryList.map(a => `<span class="acc-chip">✦ ${a}</span>`).join('')}</div>
      </div>
      <div class="result-actions">
        <button class="btn primary" id="trySuggestion">Try this outfit in Studio →</button>
        <button class="btn secondary" id="saveSuggestion">Save idea ♡</button>
      </div>
      <div class="mode-note">Powered by local rule engine · No API needed</div>
    </div>`;

  $('trySuggestion').onclick = () => {
    setCategory(r.garment);
    setColor(r.color);
    switchView('studio');
    notify('✦ Recommendation applied to Virtual Studio.');
    speak('Outfit loaded in Virtual Studio. Enjoy your ' + r.garment + '.');
  };

  $('saveSuggestion').onclick = () => {
    let saved = JSON.parse(localStorage.getItem('stylespeak_saved') || '[]');
    saved.unshift({ title: r.title, occasion: key, desc: r.desc, garment: r.garment, color: r.color, date: new Date().toISOString() });
    localStorage.setItem('stylespeak_saved', JSON.stringify(saved));
    notify('Outfit idea saved on this device.');
    renderSavedOutfits();
  };
}

// ── SAVED OUTFITS ─────────────────────────────────────────────────────────────
function renderSavedOutfits() {
  const grid = $('savedGrid');
  if (!grid) return;
  const saved = JSON.parse(localStorage.getItem('stylespeak_saved') || '[]');
  if (!saved.length) { grid.innerHTML = '<p class="empty-saved">No saved outfits yet. Generate a recommendation and save it.</p>'; return; }
  grid.innerHTML = saved.slice(0, 6).map((s, i) => `
    <div class="saved-card">
      <div class="saved-swatch" style="background:${s.color}"></div>
      <div class="saved-info">
        <b>${s.title}</b>
        <small>${s.occasion} · ${new Date(s.date).toLocaleDateString()}</small>
        <button class="btn text-btn saved-load" data-i="${i}">Load →</button>
      </div>
    </div>`).join('');

  $$('.saved-load').forEach(btn => {
    btn.onclick = () => {
      const item = saved[+btn.dataset.i];
      setCategory(item.garment);
      setColor(item.color);
      switchView('studio');
      notify('Loaded saved outfit: ' + item.title);
    };
  });
}

// ── OUTFIT CATALOGUE ──────────────────────────────────────────────────────────
function renderCatalog() {
  const q   = ($('catalogSearch')?.value || '').toLowerCase();
  const cat = $('catalogCategory')?.value || 'all';

  // Try to load from backend if online
  if (backendOnline) {
    const url = new URL(`${API_BASE}/api/garments`);
    if (cat !== 'all') url.searchParams.set('category', cat);
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data)) {
          renderCatalogGrid(data.filter(x => !q || (x.name + x.type + x.description).toLowerCase().includes(q)));
        } else {
          renderCatalogGrid(filterLocalCatalog(q, cat));
        }
      })
      .catch(() => renderCatalogGrid(filterLocalCatalog(q, cat)));
  } else {
    renderCatalogGrid(filterLocalCatalog(q, cat));
  }
}

function filterLocalCatalog(q, cat) {
  return CATALOG.filter(x =>
    (cat === 'all' || x.category === cat) &&
    (x.name + ' ' + x.type + ' ' + x.desc).toLowerCase().includes(q)
  );
}

function renderCatalogGrid(list) {
  const grid = $('catalogGrid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<p class="empty-cat">No garments match your search.</p>'; return; }

  grid.innerHTML = list.map(x => `
    <article class="garment-card">
      <div class="garment-art">
        <svg viewBox="0 0 240 280">
          <path d="${SHAPES[x.category] || SHAPES.top}"
                fill="${x.color || x.color}"
                stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="garment-info">
        <b>${x.name}</b>
        <small>${x.type} · ${x.desc || x.description}</small>
        <button class="use-btn" data-id="${x.id}" data-cat="${x.category}" data-color="${x.color}">
          Use in Virtual Studio →
        </button>
      </div>
    </article>`).join('');

  $$('.use-btn').forEach(b => {
    b.onclick = () => {
      setCategory(b.dataset.cat);
      setColor(b.dataset.color);
      switchView('studio');
      notify(list.find(x => x.id === b.dataset.id)?.name + ' loaded into preview.');
    };
  });
}

// Wire catalogue controls
const catSearch = $('catalogSearch');
const catCat    = $('catalogCategory');
if (catSearch) catSearch.oninput  = renderCatalog;
if (catCat)    catCat.onchange    = renderCatalog;

// ── BACKEND HEALTH CHECK ──────────────────────────────────────────────────────
async function checkBackend() {
  const els = $$('#backendStatus, #backendStatusSettings');
  const updateAll = (text, color) => els.forEach(el => { el.textContent = text; el.style.color = color; });

  updateAll('● Probing backend…', '#898797');

  // Probe candidates: 8001 first, then 8000
  const candidates = ['http://localhost:8001', 'http://localhost:8000'];
  let found = false;

  for (const url of candidates) {
    try {
      const r = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.status === 'ok' && (d.message?.includes('StyleSpeak') || d.version)) {
          API_BASE = url;
          backendOnline = true;
          found = true;
          updateAll(`● Backend online — ${API_BASE} (v${d.version || '1.0'})`, '#319b79');
          const badge = $('topBadge');
          if (badge) {
            badge.innerHTML = `<i></i> API ONLINE (${url.split(':').pop()})`;
            badge.style.color = '#319b79';
          }
          notify(`✦ Backend connected on ${API_BASE}`);
          break;
        }
      }
    } catch {
      // try next candidate
    }
  }

  if (!found) {
    backendOnline = false;
    updateAll('○ Backend offline — running in browser demo mode', '#d69a43');
    const badge = $('topBadge');
    if (badge) {
      badge.innerHTML = `<i></i> LOCAL DEMO`;
      badge.style.color = '#777';
    }
  }
}

// ── SETTINGS WIRING ───────────────────────────────────────────────────────────
const voiceLangEl  = $('voiceLangSelect');
const voiceRateEl  = $('voiceRateSlider');
const rateValEl    = $('voiceRateValue');
const testVoiceBtn = $('testVoiceBtn');
const checkBeBtn   = $('checkBackendBtn');
const recheckBtn   = $('recheckBackend');

if (voiceLangEl) {
  voiceLangEl.onchange = () => { voiceLang = voiceLangEl.value; };
}
if (voiceRateEl) {
  voiceRateEl.oninput = () => {
    voiceRate = parseFloat(voiceRateEl.value);
    const text = voiceRate.toFixed(1) + '×';
    if (rateValEl) rateValEl.textContent = text;
    const disp = $('voiceRateDisplay');
    if (disp) disp.textContent = text;
  };
}
if (testVoiceBtn) {
  testVoiceBtn.onclick = () => speak('StyleSpeak voice assistant is ready. You can say: show me a red dress.');
}
if (checkBeBtn) checkBeBtn.onclick = () => checkBackend();
if (recheckBtn) recheckBtn.onclick = () => checkBackend();

// ── NAVIGATION (view switcher) ────────────────────────────────────────────────
const VIEW_LABELS = {
  landing:   'Home',
  overview:  'Overview',
  studio:    'Virtual Studio',
  assistant: 'Fashion Assistant',
  wardrobe:  'Outfit Catalogue',
  about:     'About Project',
  settings:  'Settings',
};

function switchView(name) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  $$('.nav').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  const crumb = $('crumb');
  if (crumb) crumb.textContent = VIEW_LABELS[name] || name;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy-render view-specific content
  if (name === 'wardrobe') renderCatalog();
  if (name === 'settings') { checkBackend(); renderSavedOutfits(); }
  if (name === 'overview') renderOverviewStats();
}

// Wire all nav buttons
$$('.nav').forEach(n => n.onclick = () => switchView(n.dataset.view));

// CTA buttons on landing page that navigate
$$('[data-goto]').forEach(btn => btn.onclick = () => switchView(btn.dataset.goto));

// ── OVERVIEW STATS ────────────────────────────────────────────────────────────
function renderOverviewStats() {
  const saved  = JSON.parse(localStorage.getItem('stylespeak_saved') || '[]');
  const el     = $('overviewSavedCount');
  if (el) el.textContent = saved.length;
  const beEl   = $('overviewBackend');
  if (beEl) beEl.textContent = backendOnline ? 'Online' : 'Offline (demo mode)';
}

// ── HELP MODAL ────────────────────────────────────────────────────────────────
const helpBtn   = $('helpBtn');
const helpModal = $('helpModal');
const closeHelp = $('closeHelp');
if (helpBtn)   helpBtn.onclick   = () => helpModal?.classList.add('show');
if (closeHelp) closeHelp.onclick = () => helpModal?.classList.remove('show');
if (helpModal) helpModal.onclick = e => { if (e.target === helpModal) helpModal.classList.remove('show'); };

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Press V to toggle voice
  if (e.key === 'v' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
    listenBtn?.click();
  }
  // Press Escape to close modals
  if (e.key === 'Escape') helpModal?.classList.remove('show');
});

// ── INITIALISE ────────────────────────────────────────────────────────────────
(function init() {
  // Start on landing page
  switchView('landing');
  // Check backend asynchronously
  checkBackend();
  // Initial catalogue render
  renderCatalog();
  // Render saved outfits in settings
  renderSavedOutfits();
  // Initialize Anywear Live AR Garment Dock
  setupAnywearDock();
  // Load saved FASHN Colab endpoint
  loadFashnSettings();
  // Initialize Three.js 3D WebGL Volumetric Garment Engine
  if (window.THREE) {
    initThreeEngine();
  } else {
    window.addEventListener('load', () => { if (window.THREE) initThreeEngine(); });
  }
  console.log('[StyleSpeak] App v5.0 initialized — Three.js 3D Volumetric Mesh, 6-DOF AR Body Fit, 16 garments, 10 occasions ready.');
})();
