# Virtual Herbal Garden – AYUSH & Vastu Garden Planner

A modern, responsive, nature-inspired web application combining **AYUSH medicinal plant education**, **traditional Vastu Shastra home plant placement**, **camera-assisted room scanning**, **compass direction detection**, **length & width measurement**, **3D / AR virtual plant placement**, **user accounts**, and **interactive quizzes**.

---

## 🌟 Key Features

### 1. Landing Page & Digital Herbal Sanctuary
- Immersive hero section: *"Discover. Learn. Grow. Design Your Herbal Garden."*
- Real-time interactive 3D botanical viewer using Three.js WebGL rendering (Sacred Tulsi model with procedural leaves, square nodes, blossom spires, pot, and orbit controls).
- AYUSH 5 pillars overview: **Ayurveda, Yoga & Naturopathy, Unani, Siddha, and Homeopathy**.
- Curated featured plants showcase with direct details exploration.
- 4-step guided workflow preview and Vastu directional energy matrix.
- PWA install banner with offline service-worker caching.

### 2. User Authentication & Dashboard
- Secure JWT authentication with bcrypt password hashing.
- Signup, Login, Remember Me, Forgot Password, and one-click **Demo Login** (`demo@ayushgarden.org` / `garden123`).
- Personalized user dashboard displaying:
  - Welcome greeting: *"Welcome back, [Name] 🌿"*
  - Live statistics: Plants explored, plants saved, garden designs, quiz score.
  - Quick action cards & live user activity timeline.

### 3. AYUSH Herbal Plant Database (22+ Medicinal Species)
- Search by common name, botanical genus, or therapeutic use.
- Multi-dimensional filters: AYUSH category, sunlight level, watering frequency, indoor/outdoor suitability, and sorting.
- Clear distinction between traditional classical uses and scientific clinical evidence.
- Plant detail view featuring:
  - Botanical taxonomy (family, appearance, height, growth habit, soil, sunlight, water).
  - Traditional uses, plant parts used, and traditional preparation arts (Kashayam, Phanta, Swarasa).
  - Safety precautions and contraindications.
  - Vastu directional placement & cultural explanation.
  - Interactive 3D botanical model viewer.
  - Quick buttons: *Add to My Plants*, *Add to Garden*, *Visualize in Room (3D/AR)*.

### 4. Plan My Home Garden (Multi-Step Guided Wizard)
1. **Space Type**: Name your layout and choose between Balcony, Living Room, Terrace, Windowsill, Courtyard, or Kitchen Garden.
2. **Room & Surface Scanner**: Uses browser `getUserMedia` camera preview with floor grid reticle and tap-to-mark placement boundaries, or interactive simulated room fallback.
3. **Direction Detection & Calibration**: Live mobile compass sensor (`deviceorientation`), North indicator, and manual 8-cardinal direction calibration dial (N, NE, E, SE, S, SW, W, NW).
4. **Room Measurement Mode**:
   - *Mode A*: Manual input (length × width in ft) with automatic square footage calculation.
   - *Mode B*: Camera/AR-assisted tap-to-measure simulation with distance estimation.
5. **Growing Environment Analysis**: User-specified sunlight (Low, Medium, High), watering frequency, and maintenance preferences.
6. **Vastu + Plant Recommendation Engine**: Smart scoring algorithm evaluating sunlight fit, space volume, and traditional Vastu quadrant compatibility. Outputs a ranked list with a detailed *"Why Recommended"* checklist and ethical traditional guidance disclaimers.
7. **Virtual Garden Layout Designer**:
   - **Top-Down 2D Grid**: Drag & drop plants across Vastu quadrants, rotate 360°, scale 0.5x–2.0x, delete, and view layout dimensions.
   - **AR Camera Overlay**: Real camera video background with virtual 3D plant placement, large touch controls for mobile (Move, Rotate, Scale, Delete, Add Plant), and plant info badges.
8. **Save Garden Design**: Save to server with room dimensions, facing direction, coordinates, and notes.

### 5. My Gardens & Saved Plants
- Review, duplicate, edit, or delete saved home layouts.
- Manage handpicked favorite medicinal species with one-click garden planning.

### 6. Learning Center & Interactive Quizzes
- Educational modules covering AYUSH philosophy, botanical identification, traditional preparation methods, Vastu spatial harmony, and ethical plant care.
- 10 interactive quiz questions spanning multiple-choice, plant identification photos, and true/false.
- Instant feedback with educational explanations, score tracking, and confetti celebration!

### 7. Progressive Web App (PWA) & Mobile First Design
- Standalone installable PWA with `manifest.json` and service worker offline caching.
- Bottom mobile navigation bar (Home, Plants, Plan, My Garden, Profile).
- Fullscreen responsive camera and touch controls.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Three.js, Canvas Confetti.
- **Backend**: Node.js, Express.js, REST API, JWT authentication, bcryptjs.
- **Database**: Dual-engine architecture (connects to MongoDB via Mongoose, with automatic persistent local JSON fallback store so it works 100% out of the box with zero database installation required).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### 1. Install Dependencies
```bash
# In client directory
cd client
npm install

# In server directory
cd ../server
npm install
```

### 2. Run the Development Servers
From the root directory:
```bash
# Start both client and server:
node start-dev.js
```
Or run individually in separate terminals:
```bash
# Terminal 1 - Backend:
cd server
npm start

# Terminal 2 - Frontend:
cd client
npm run dev
```

The application will be live at:
- **Frontend**: `http://localhost:5173/`
- **Backend API**: `http://localhost:5000/api/`

---

## 🔑 Demo Account Credentials
- **Email**: `demo@ayushgarden.org`
- **Password**: `garden123`
*(Or click the "Demo Login" button on the Sign In page for instant access!)*

---

## 🛡️ Ethical Disclaimers & Regulatory Notice
1. **Educational Context**: Information regarding traditional medicinal uses of AYUSH plants is educational and cultural. It is not intended to diagnose, treat, prevent, or cure any disease, nor replace professional clinical care.
2. **Traditional Vastu Guidance**: Recommendations based on Vastu Shastra reflect traditional Indian cultural spatial planning and aesthetics, not empirical medical physics.
3. **Camera & AR Measurements**: Distance estimation and room scanning rely on standard browser camera inputs and are sensor-dependent approximations.
