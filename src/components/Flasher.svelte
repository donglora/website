<script lang="ts">
  import type { BoardDef, Release } from "../lib/types";
  import { fetchReleases } from "../lib/github";
  import BoardSelector from "./BoardSelector.svelte";
  import VersionSelector from "./VersionSelector.svelte";
  import EspFlashFlow from "./EspFlashFlow.svelte";
  import Uf2DownloadFlow from "./Uf2DownloadFlow.svelte";

  let selectedBoard: BoardDef | null = $state(null);
  let selectedRelease: Release | null = $state(null);

  let releases: Release[] = $state([]);
  let releasesLoading = $state(true);
  let releasesError: string | null = $state(null);

  // Fetch releases on mount
  $effect(() => {
    fetchReleases()
      .then((data) => {
        releases = data;
        releasesLoading = false;
        // Auto-select latest stable release
        const stable = data.find((r) => !r.prerelease);
        if (stable) selectedRelease = stable;
      })
      .catch((err) => {
        releasesError = err instanceof Error ? err.message : "Failed to load releases";
        releasesLoading = false;
      });
  });

  function handleBoardSelect(board: BoardDef) {
    selectedBoard = board;
  }

  function handleVersionSelect(release: Release) {
    selectedRelease = release;
  }
</script>

<div class="space-y-8">
  <!-- Step 1: Board Selection -->
  <BoardSelector selected={selectedBoard} onselect={handleBoardSelect} />

  <!-- Step 2: Version Selection (shown after board selected) -->
  {#if selectedBoard}
    <div class="border-t border-border pt-8">
      <VersionSelector
        {releases}
        selected={selectedRelease}
        onselect={handleVersionSelect}
        loading={releasesLoading}
        error={releasesError}
      />
    </div>
  {/if}

  <!-- Step 3: Flash/Download (shown after both selected) -->
  {#if selectedBoard && selectedRelease}
    <div class="border-t border-border pt-8">
      <h3 class="font-mono text-sm text-text-muted mb-3 uppercase tracking-wider">
        {#if (selectedBoard.family === "esp32" || selectedBoard.family === "esp32s3")}
          Flash Firmware
        {:else}
          Download Firmware
        {/if}
      </h3>

      {#if selectedBoard.notes}
        <div class="bg-bg-elevated border border-border rounded p-3 mb-4">
          <p class="text-xs text-text-muted">{selectedBoard.notes}</p>
        </div>
      {/if}

      {#if (selectedBoard.family === "esp32" || selectedBoard.family === "esp32s3")}
        <EspFlashFlow board={selectedBoard} release={selectedRelease} />
      {:else}
        <Uf2DownloadFlow board={selectedBoard} release={selectedRelease} />
      {/if}
    </div>
  {/if}
</div>
