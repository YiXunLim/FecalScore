# FecalScore

Web app for capturing and scoring swine fecal samples (score 0–3) with a phone camera.
Built by Yi Xun Lim for Felipe · Funded by Dr. Rosero, Iowa State University · Hosted by Ethan.

```
FecalScore/
  frontend/   the website (React + TypeScript + Vite)
  backend/    the server (Python + FastAPI); saves data to backend/data/
```

## One-time setup (Windows)

You need **Node.js 20 or newer** (https://nodejs.org, "LTS") and **Python 3.10 or newer** (https://python.org).
Check them in a terminal: `node -v` and `python --version`.

**Frontend**
```
cd frontend
npm install
```

**Backend**
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run it (two terminals)

**Terminal 1 — backend**
```
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
Check it: open http://127.0.0.1:8000/api/health (should show `{"status":"ok"}`).

**Terminal 2 — frontend**
```
cd frontend
npm run dev
```
Open http://localhost:5173 in your browser.

## Test on your phone

Phones only allow the camera on **HTTPS** pages, so use the phone mode:

```
cd frontend
npm run dev:phone
```

1. The terminal prints a `Network:` address like `https://192.168.1.23:5173`.
2. Connect your phone to the **same Wi-Fi** as your computer and open that address.
3. You'll see a security warning (the certificate is self-made for testing).
   - iPhone (Safari): tap **Show Details → visit this website**.
   - Android (Chrome): tap **Advanced → Proceed**.
4. If it doesn't load, allow Node.js through Windows Firewall when Windows asks
   (or in Windows Security → Firewall → Allow an app).

## Where to change things

| What | File |
|---|---|
| Credits, tagline, score definitions | `frontend/src/config.ts` |
| ISU colors, fonts, sizes | `frontend/src/styles/theme.css` |
| Camera template shape and size | `frontend/src/features/capture/template.ts` |
| Pages | `frontend/src/pages/` |
| Backend endpoints | `backend/app/main.py` |

## Progress

- [x] Phase 1 — setup, ISU theme, Home page
- [x] Phase 2 — camera, template, capture/retake, save to phone
- [x] Phase 3 — sample form, projects, saving samples + photos (backend)
- [x] Phase 4 — saved samples, project pages, search, editing, CSV/Excel/PDF export
- [ ] Phase 5 — offline saving and sync
- [ ] Phase 6 — real-phone testing, deploy to Ethan's server
- [ ] Phase 7 — ML model
