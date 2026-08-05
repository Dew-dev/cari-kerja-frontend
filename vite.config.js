import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";

// Unique per build so index.html bytes (and ETag) always change after deploy,
// even when only env/build metadata differs.
function htmlBuildIdPlugin() {
  const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: "html-build-id",
    transformIndexHtml(html) {
      return html.replace(
        /<head>/i,
        `<head>\n    <meta name="build-id" content="${buildId}" />`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), htmlBuildIdPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
