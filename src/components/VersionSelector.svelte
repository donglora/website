<script lang="ts">
  import type { Release } from "../lib/types";
  import { marked } from "marked";

  interface Props {
    releases: Release[];
    selected: Release | null;
    onselect: (release: Release) => void;
    loading: boolean;
    error: string | null;
  }

  let { releases, selected, onselect, loading, error }: Props = $props();

  // Tag Keep-a-Changelog section headings so CSS can color-code them
  // (Added → green, Changed → yellow, Fixed → blue, etc.).
  function renderBody(body: string): string {
    const html = marked.parse(body) as string;
    return html.replace(
      /<h3>(Added|Changed|Fixed|Removed|Deprecated|Security)<\/h3>/g,
      (_, text) => `<h3 data-section="${text.toLowerCase()}">${text}</h3>`,
    );
  }

  let changelogHtml = $derived(selected?.body ? renderBody(selected.body) : "");

  function handleChange(e: Event) {
    const tag = (e.target as HTMLSelectElement).value;
    const release = releases.find((r) => r.tag === tag);
    if (release) onselect(release);
  }
</script>

<div>
  <h3 class="font-mono text-sm text-text-muted mb-3 uppercase tracking-wider">Select Version</h3>

  {#if loading}
    <div class="text-text-dim text-sm font-mono">Loading releases...</div>
  {:else if error}
    <div class="text-error text-sm">
      {error}
      <a
        href="https://github.com/donglora/firmware/releases"
        class="text-accent hover:text-accent-bright ml-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub
      </a>
    </div>
  {:else}
    <div class="relative">
    <select
      class="w-full bg-bg-card border border-border rounded px-4 py-2 pr-10 font-mono text-sm text-text
        focus:outline-none focus:border-accent appearance-none cursor-pointer"
      value={selected?.tag ?? ""}
      onchange={handleChange}
    >
      <option value="" disabled>Choose a version...</option>
      {#each releases as release}
        <option value={release.tag}>
          {release.version}
          {release.prerelease ? "(pre-release)" : ""}
          — {release.date}
        </option>
      {/each}
    </select>
    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
    </div>

    {#if selected && changelogHtml}
      <div class="mt-4 bg-bg-card border border-border rounded p-5">
        <h4 class="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">Changelog</h4>
        <!-- Styles live in src/styles/global.css — Svelte component <style>
             scoping wasn't being emitted into the prod CSS bundle. -->
        <div class="changelog text-sm text-text-muted">
          {@html changelogHtml}
        </div>
      </div>
    {/if}
  {/if}
</div>
