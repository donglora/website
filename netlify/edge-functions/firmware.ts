// Proxies firmware binary downloads from GitHub Releases to avoid CORS restrictions.
// URL: /api/firmware/:owner/:repo/:tag/:filename
// Example: /api/firmware/donglora/firmware/v0.2.1/donglora-heltec_v4-v0.2.1.bin

export default async (request: Request) => {
  const url = new URL(request.url);
  const match = url.pathname.match(
    /^\/api\/firmware\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/,
  );

  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const [, owner, repo, tag, filename] = match;
  const ghUrl = `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`;

  const resp = await fetch(ghUrl);
  if (!resp.ok) {
    return new Response(`GitHub returned ${resp.status}`, { status: resp.status });
  }

  return new Response(resp.body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = {
  path: "/api/firmware/*",
};
