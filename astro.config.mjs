import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Dev-only middleware that proxies /api/firmware/* to GitHub releases,
// following redirects server-side to avoid CORS issues.
function firmwareProxy() {
  return {
    name: "firmware-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(
          /^\/api\/firmware\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
        );
        if (!match) return next();

        const [, owner, repo, tag, filename] = match;
        const ghUrl = `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`;

        try {
          const resp = await fetch(ghUrl, { redirect: "follow" });
          if (!resp.ok) {
            res.writeHead(resp.status);
            res.end(`GitHub returned ${resp.status}`);
            return;
          }
          res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Access-Control-Allow-Origin": "*",
          });
          const buffer = Buffer.from(await resp.arrayBuffer());
          res.end(buffer);
        } catch (err) {
          res.writeHead(502);
          res.end(`Proxy error: ${err}`);
        }
      });
    },
  };
}

export default defineConfig({
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss(), firmwareProxy()],
  },
});
