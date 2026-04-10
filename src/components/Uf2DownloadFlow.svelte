<script lang="ts">
  import type { BoardDef, Release } from "../lib/types";
  import { findAsset, getAssetName } from "../lib/boards";

  interface Props {
    board: BoardDef;
    release: Release;
  }

  let { board, release }: Props = $props();

  let downloaded = $state(false);

  const asset = $derived(findAsset(board, release.version, release.assets));
  const assetName = $derived(getAssetName(board, release.version));

  const driveName = $derived(
    board.id === "rak_wisblock_4631"
      ? "RAK4631"
      : board.id === "wio_tracker_l1"
        ? "WIO-L1"
        : board.id === "waveshare_rp2040_lora"
          ? "RPI-RP2"
          : "UF2BOOT",
  );

  function handleDownload() {
    downloaded = true;
  }
</script>

<div class="space-y-4">
  {#if asset}
    <a
      href={asset.downloadUrl}
      class="inline-block bg-accent text-bg font-mono font-medium px-6 py-3 rounded hover:bg-accent-bright transition-colors"
      download
      onclick={handleDownload}
    >
      Download Firmware (.uf2)
    </a>
  {:else}
    <div class="bg-warn/10 border border-warn/30 rounded p-4">
      <p class="text-warn text-sm">
        UF2 file not found for {board.name} v{release.version}.
        <a
          href="https://github.com/donglora/firmware/releases"
          class="text-accent hover:text-accent-bright"
          target="_blank"
          rel="noopener noreferrer"
        >
          Check GitHub releases
        </a>
      </p>
    </div>
  {/if}

  <!-- UF2 flashing instructions (always shown) -->
  <div class="bg-bg-card border border-border rounded p-5">
    <h4 class="font-mono text-sm font-medium text-text mb-4">UF2 Flashing Instructions</h4>
    <ol class="space-y-4 text-sm">
      <li class="flex gap-3">
        <span class="font-mono text-accent font-bold shrink-0">1.</span>
        <div>
          <p class="text-text">Double-tap the RESET button on your {board.name}</p>
          <p class="text-text-dim text-xs mt-1">Tap twice quickly (within 500ms). The board enters UF2 bootloader mode.</p>
        </div>
      </li>
      <li class="flex gap-3">
        <span class="font-mono text-accent font-bold shrink-0">2.</span>
        <div>
          <p class="text-text">
            A USB drive named <code class="font-mono text-accent bg-bg-elevated px-1 rounded">{driveName}</code> should appear on your computer
          </p>
          <p class="text-text-dim text-xs mt-1">If it doesn't appear, try a different USB cable or port.</p>
        </div>
      </li>
      <li class="flex gap-3">
        <span class="font-mono text-accent font-bold shrink-0">3.</span>
        <div>
          <p class="text-text">
            Drag the downloaded <code class="font-mono text-accent bg-bg-elevated px-1 rounded">{assetName}</code> file onto that drive
          </p>
        </div>
      </li>
      <li class="flex gap-3">
        <span class="font-mono text-accent font-bold shrink-0">4.</span>
        <div>
          <p class="text-text">Done! The board reboots automatically when flashing completes</p>
          <p class="text-text-dim text-xs mt-1">The USB drive will disappear and the board will restart with the new firmware.</p>
        </div>
      </li>
    </ol>
  </div>

  <!-- CLI alternative -->
  <div class="bg-bg-card border border-border rounded p-5">
    <h4 class="font-mono text-sm font-medium text-text mb-3">Alternative: Flash via CLI</h4>
    <div class="text-sm text-text-muted">
      <p class="mb-2">
        If you have a debug probe (J-Link, DAPLink), you can flash the .elf directly:
      </p>
      <pre class="font-mono text-xs text-accent bg-bg-elevated p-3 rounded overflow-x-auto">cargo install probe-rs-tools
probe-rs run --chip {board.family === "rp2040" ? "rp2040" : "nRF52840_xxAA"} donglora-{board.id}-v{release.version}.elf</pre>
    </div>
  </div>
</div>
