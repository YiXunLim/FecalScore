import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev`        -> http://localhost:5173 on this computer
// `npm run dev:phone`  -> https://<your-computer-ip>:5173 so a phone on the same Wi-Fi can open it.
//                         Phones only allow the camera on HTTPS pages, so this mode turns HTTPS on.
export default defineConfig(({ mode }) => {
  const phone = mode === 'phone';
  return {
    plugins: [react(), ...(phone ? [basicSsl()] : [])],
    server: {
      host: phone ? true : 'localhost',
      port: 5173,
      // Any request to /api/... is forwarded to the Python backend.
      proxy: {
        // xfwd tells the backend the real address, so links inside exports point to the right place.
        '/api': { target: 'http://127.0.0.1:8000', xfwd: true },
      },
    },
  };
});
