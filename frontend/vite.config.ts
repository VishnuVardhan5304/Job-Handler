import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail instead of silently moving to 5174+ (avoids CORS / wrong-URL confusion).
    strictPort: true,
    host: true,
  },
});
