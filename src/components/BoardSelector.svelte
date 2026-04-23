<script lang="ts">
  import type { BoardDef } from "../lib/types";
  import { boards } from "../lib/boards";

  interface Props {
    selected: BoardDef | null;
    onselect: (board: BoardDef) => void;
  }

  let { selected, onselect }: Props = $props();

  let query = $state("");

  function badgeText(board: BoardDef): string {
    switch (board.flashMethod) {
      case "web-serial":
        return "Web Flash";
      case "uf2":
        return "UF2 Download";
      case "download-only":
        return "CLI Only";
    }
  }

  function badgeColor(board: BoardDef): string {
    switch (board.flashMethod) {
      case "web-serial":
        return "text-accent";
      case "uf2":
        return "text-info";
      case "download-only":
        return "text-warn";
    }
  }

  function matches(board: BoardDef, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
      board.name,
      board.mcu,
      board.radio,
      board.family,
      badgeText(board),
      board.notes ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  }

  const esp32Boards = $derived(boards.filter((b) => b.family === "esp32" && matches(b, query)));
  const espBoards = $derived(boards.filter((b) => b.family === "esp32s3" && matches(b, query)));
  const nrfBoards = $derived(boards.filter((b) => b.family === "nrf52840" && matches(b, query)));
  const rpBoards = $derived(boards.filter((b) => b.family === "rp2040" && matches(b, query)));

  const totalVisible = $derived(
    esp32Boards.length + espBoards.length + nrfBoards.length + rpBoards.length,
  );
  const isFiltering = $derived(query.trim().length > 0);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && query !== "") {
      query = "";
      e.preventDefault();
    }
  }
</script>

{#snippet boardCard(board: BoardDef)}
  <button
    class="flex flex-col h-full text-left bg-bg-card border p-4 rounded transition-all cursor-pointer
      {selected?.id === board.id
      ? 'border-accent shadow-[0_0_12px_oklch(from_var(--color-accent)_l_c_h_/_0.15)]'
      : 'border-border hover:border-border-bright'}"
    onclick={() => onselect(board)}
  >
    <div class="font-mono font-medium text-text text-sm">{board.name}</div>
    <div class="text-xs text-text-muted mt-1">{board.mcu} &middot; {board.radio}</div>
    <div class="text-xs {badgeColor(board)} mt-auto pt-2 font-mono">{badgeText(board)}</div>
  </button>
{/snippet}

{#snippet familySection(label: string, list: BoardDef[])}
  {#if list.length > 0}
    <p class="text-xs text-text-dim mb-2 font-mono">{label}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {#each list as board (board.id)}
        {@render boardCard(board)}
      {/each}
    </div>
  {/if}
{/snippet}

<div>
  <div class="flex items-baseline justify-between mb-3 gap-4">
    <h3 class="font-mono text-sm text-text-muted uppercase tracking-wider">Select Board</h3>
    {#if isFiltering}
      <p class="text-xs text-text-dim font-mono">
        {totalVisible} of {boards.length}
      </p>
    {/if}
  </div>

  <div class="relative mb-6">
    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7"></circle>
      <path d="m20 20-3.5-3.5"></path>
    </svg>
    <input
      type="text"
      bind:value={query}
      onkeydown={handleKeydown}
      placeholder="Filter by name, chip, radio…"
      aria-label="Filter boards"
      class="w-full bg-bg-card border border-border rounded pl-10 pr-10 py-2 font-mono text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
    />
    {#if query}
      <button
        type="button"
        onclick={() => {
          query = "";
        }}
        aria-label="Clear filter"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text cursor-pointer p-1 rounded"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12"></path>
        </svg>
      </button>
    {/if}
  </div>

  {#if totalVisible === 0}
    <div class="bg-bg-card border border-border rounded p-6 text-center">
      <p class="text-text-muted text-sm mb-3">
        No boards match "<span class="text-text font-mono">{query}</span>"
      </p>
      <button
        type="button"
        onclick={() => {
          query = "";
        }}
        class="text-accent hover:text-accent-bright text-sm font-mono cursor-pointer"
      >
        Clear filter
      </button>
    </div>
  {:else}
    {@render familySection("ESP32", esp32Boards)}
    {@render familySection("ESP32-S3", espBoards)}
    {@render familySection("nRF52840", nrfBoards)}
    {@render familySection("RP2040", rpBoards)}
  {/if}
</div>
