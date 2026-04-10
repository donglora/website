<script lang="ts">
  import type { BoardDef } from "../lib/types";
  import { boards } from "../lib/boards";

  interface Props {
    selected: BoardDef | null;
    onselect: (board: BoardDef) => void;
  }

  let { selected, onselect }: Props = $props();

  const espBoards = boards.filter((b) => b.family === "esp32s3");
  const rpBoards = boards.filter((b) => b.family === "rp2040");
  const nrfBoards = boards.filter((b) => b.family === "nrf52840");

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
</script>

<div>
  <h3 class="font-mono text-sm text-text-muted mb-3 uppercase tracking-wider">Select Board</h3>

  <p class="text-xs text-text-dim mb-2 font-mono">ESP32-S3</p>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
    {#each espBoards as board}
      <button
        class="text-left bg-bg-card border p-4 rounded transition-all cursor-pointer
          {selected?.id === board.id
          ? 'border-accent shadow-[0_0_12px_oklch(from_var(--color-accent)_l_c_h_/_0.15)]'
          : 'border-border hover:border-border-bright'}"
        onclick={() => onselect(board)}
      >
        <div class="font-mono font-medium text-text text-sm">{board.name}</div>
        <div class="text-xs text-text-muted mt-1">{board.mcu} &middot; {board.radio}</div>
        <div class="text-xs {badgeColor(board)} mt-2 font-mono">{badgeText(board)}</div>
      </button>
    {/each}
  </div>

  <p class="text-xs text-text-dim mb-2 font-mono">RP2040</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
    {#each rpBoards as board}
      <button
        class="text-left bg-bg-card border p-4 rounded transition-all cursor-pointer
          {selected?.id === board.id
          ? 'border-accent shadow-[0_0_12px_oklch(from_var(--color-accent)_l_c_h_/_0.15)]'
          : 'border-border hover:border-border-bright'}"
        onclick={() => onselect(board)}
      >
        <div class="font-mono font-medium text-text text-sm">{board.name}</div>
        <div class="text-xs text-text-muted mt-1">{board.mcu} &middot; {board.radio}</div>
        <div class="text-xs {badgeColor(board)} mt-2 font-mono">{badgeText(board)}</div>
      </button>
    {/each}
  </div>

  <p class="text-xs text-text-dim mb-2 font-mono">nRF52840</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each nrfBoards as board}
      <button
        class="text-left bg-bg-card border p-4 rounded transition-all cursor-pointer
          {selected?.id === board.id
          ? 'border-accent shadow-[0_0_12px_oklch(from_var(--color-accent)_l_c_h_/_0.15)]'
          : 'border-border hover:border-border-bright'}"
        onclick={() => onselect(board)}
      >
        <div class="font-mono font-medium text-text text-sm">{board.name}</div>
        <div class="text-xs text-text-muted mt-1">{board.mcu} &middot; {board.radio}</div>
        <div class="text-xs {badgeColor(board)} mt-2 font-mono">{badgeText(board)}</div>
      </button>
    {/each}
  </div>
</div>
