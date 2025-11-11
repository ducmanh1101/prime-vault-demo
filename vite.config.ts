import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
// import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // plugins: [react(), tailwindcss(), mkcert()],
  // server: {
  //   host: "myapp.local", // 👈 domain tùy chỉnh
  //   port: 5173,
  //   https: true,
  // },
});
