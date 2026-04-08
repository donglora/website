import type { Release, ReleaseAsset } from "./types";

const REPO = "donglora/firmware";
const API_BASE = `https://api.github.com/repos/${REPO}/releases`;
// Bump CACHE_VERSION when the cached data shape changes to invalidate stale entries
const CACHE_VERSION = 2;
const CACHE_KEY = `donglora-releases-v${CACHE_VERSION}`;
const ETAG_KEY = `donglora-releases-etag-v${CACHE_VERSION}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TIMESTAMP_KEY = `donglora-releases-ts-v${CACHE_VERSION}`;

interface CachedData {
  releases: Release[];
  timestamp: number;
  etag: string | null;
}

function getCached(): CachedData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const ts = sessionStorage.getItem(TIMESTAMP_KEY);
    const etag = sessionStorage.getItem(ETAG_KEY);
    if (!raw || !ts) return null;
    return { releases: JSON.parse(raw), timestamp: Number(ts), etag };
  } catch {
    return null;
  }
}

function setCache(releases: Release[], etag: string | null): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(releases));
    sessionStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
    if (etag) sessionStorage.setItem(ETAG_KEY, etag);
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

function parseRelease(raw: GitHubRelease): Release {
  const tag = raw.tag_name;
  const version = tag.startsWith("v") ? tag.slice(1) : tag;
  return {
    tag,
    version,
    name: raw.name || tag,
    date: raw.published_at?.split("T")[0] ?? "",
    body: raw.body ?? "",
    prerelease: raw.prerelease,
    assets: raw.assets.map(
      (a): ReleaseAsset => ({
        name: a.name,
        downloadUrl: a.browser_download_url,
        fetchUrl: `/api/firmware/${REPO}/${tag}/${a.name}`,
        size: a.size,
      }),
    ),
  };
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  body: string | null;
  prerelease: boolean;
  assets: { name: string; browser_download_url: string; url: string; size: number }[];
}

export async function fetchReleases(): Promise<Release[]> {
  const cached = getCached();

  // Return fresh cache without hitting the network
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.releases;
  }

  // Try conditional request with ETag
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (cached?.etag) {
    headers["If-None-Match"] = cached.etag;
  }

  try {
    const resp = await fetch(API_BASE, { headers });

    if (resp.status === 304 && cached) {
      // Not modified — refresh timestamp, return cached
      setCache(cached.releases, cached.etag);
      return cached.releases;
    }

    if (resp.status === 403 || resp.status === 429) {
      // Rate limited — return cached if available
      if (cached) return cached.releases;
      throw new Error("GitHub API rate limit exceeded. Try again later.");
    }

    if (!resp.ok) {
      throw new Error(`GitHub API error: ${resp.status}`);
    }

    const data: GitHubRelease[] = await resp.json();
    const releases = data.map(parseRelease);
    const etag = resp.headers.get("etag");
    setCache(releases, etag);
    return releases;
  } catch (err) {
    // Network error — return cached if available
    if (cached) return cached.releases;
    throw err;
  }
}

export function getDownloadUrl(release: Release, assetName: string): string | undefined {
  return release.assets.find((a) => a.name === assetName)?.url;
}

export function releasesPageUrl(): string {
  return `https://github.com/${REPO}/releases`;
}
