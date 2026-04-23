<script lang="ts">
  import type { BoardDef, Release, FlashProgress } from "../lib/types";
  import { findAsset, getAssetName } from "../lib/boards";
  import { isWebSerialSupported, connect, flash, disconnect } from "../lib/esptool";
  import ProgressBar from "./ProgressBar.svelte";
  import FlashLog from "./FlashLog.svelte";

  interface Props {
    board: BoardDef;
    release: Release;
  }

  let { board, release }: Props = $props();

  let state: "prep" | "ready" | "connecting" | "downloading" | "flashing" | "done" | "error" = $state("prep");
  let progress: FlashProgress = $state({ phase: "", percent: 0, message: "" });
  let logLines: string[] = $state([]);
  let errorMessage: string = $state("");

  const webSerialSupported = isWebSerialSupported();
  const asset = $derived(findAsset(board, release.version, release.assets));
  const assetName = $derived(getAssetName(board, release.version));

  function addLog(msg: string) {
    logLines = [...logLines, msg];
  }

  async function startFlash() {
    state = "connecting";
    logLines = [];
    errorMessage = "";
    progress = { phase: "Connecting", percent: 0, message: "Waiting for port selection..." };

    const callbacks = {
      onProgress: (p: FlashProgress) => { progress = p; },
      onLog: addLog,
    };

    let session;
    try {
      session = await connect(callbacks, board.family === "esp32" ? "esp32" : "esp32s3");
    } catch (err) {
      const msg = err instanceof DOMException && err.name === "NotFoundError"
        ? "Port selection cancelled."
        : `Connection failed: ${err instanceof Error ? err.message : err}`;
      errorMessage = msg;
      addLog(`Error: ${msg}`);
      state = "error";
      return;
    }

    // Download firmware
    state = "downloading";
    progress = { phase: "Downloading", percent: 0, message: "Fetching firmware..." };
    addLog(`Downloading ${board.name} firmware v${release.version}...`);

    if (!asset) {
      errorMessage = `Firmware binary not found for ${board.name} v${release.version}. The .bin file may not be available in this release yet.`;
      addLog(`Error: ${errorMessage}`);
      await disconnect(session);
      state = "error";
      return;
    }

    let firmware: Uint8Array;
    try {
      const resp = await fetch(asset.fetchUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      firmware = new Uint8Array(await resp.arrayBuffer());
      addLog(`Downloaded ${(firmware.length / 1024).toFixed(1)} KB`);
    } catch (err) {
      errorMessage = `Failed to download firmware: ${err instanceof Error ? err.message : err}`;
      addLog(`Error: ${errorMessage}`);
      await disconnect(session);
      state = "error";
      return;
    }

    // Flash
    state = "flashing";
    try {
      await flash(session, firmware, callbacks);
      state = "done";
      addLog("Flash complete! Device has been reset.");
    } catch (err) {
      errorMessage = `Flash failed: ${err instanceof Error ? err.message : err}`;
      addLog(`Error: ${errorMessage}`);
      state = "error";
    } finally {
      await disconnect(session);
    }
  }
</script>

<div class="space-y-4">
  <!-- Web Flash section -->
  {#if board.flashMethod === "web-serial"}
    {#if !webSerialSupported}
      <div class="bg-bg-card border border-warn/30 rounded p-4">
        <p class="text-warn text-sm font-medium mb-2">Web Serial not supported</p>
        <p class="text-text-muted text-sm">
          Your browser doesn't support Web Serial. Use
          <strong class="text-text">Chrome</strong>,
          <strong class="text-text">Edge</strong>, or
          <strong class="text-text">Opera</strong> (version 89+) for web flashing.
          You can still download the firmware below and flash with the CLI.
        </p>
      </div>
    {:else}
      {#if state === "prep"}
        <div class="bg-bg-card border border-border rounded p-5">
          <h4 class="font-mono text-sm font-medium text-text mb-4">Enter Download Mode</h4>
          <p class="text-sm text-text-muted mb-4">
            Before flashing, your {board.name} must be in download mode:
          </p>
          <ol class="space-y-3 text-sm mb-5">
            <li class="flex gap-3">
              <span class="font-mono text-accent font-bold shrink-0">1.</span>
              <p class="text-text">
                Plug in your {board.name} via USB
              </p>
            </li>
            <li class="flex gap-3">
              <span class="font-mono text-accent font-bold shrink-0">2.</span>
              <p class="text-text">
                Hold the <code class="font-mono text-accent bg-bg-elevated px-1.5 py-0.5 rounded">PRG</code> button
              </p>
            </li>
            <li class="flex gap-3">
              <span class="font-mono text-accent font-bold shrink-0">3.</span>
              <p class="text-text">
                While holding <code class="font-mono text-accent bg-bg-elevated px-1.5 py-0.5 rounded">PRG</code>, tap <code class="font-mono text-accent bg-bg-elevated px-1.5 py-0.5 rounded">RST</code> and release both
              </p>
            </li>
            <li class="flex gap-3">
              <span class="font-mono text-accent font-bold shrink-0">4.</span>
              <p class="text-text">
                The display should go blank — the board is now in download mode
              </p>
            </li>
          </ol>
          <button
            onclick={() => { state = "ready"; }}
            class="bg-accent text-bg font-mono font-medium px-6 py-3 rounded hover:bg-accent-bright transition-colors cursor-pointer"
          >
            Ready — Connect &amp; Flash
          </button>
        </div>
      {/if}

      {#if state === "ready"}
        <button
          onclick={startFlash}
          class="bg-accent text-bg font-mono font-medium px-6 py-3 rounded hover:bg-accent-bright transition-colors cursor-pointer"
        >
          Connect &amp; Flash
        </button>
        <p class="text-xs text-text-dim">
          Your browser will ask you to select a serial port.
        </p>
      {/if}

      {#if state === "connecting" || state === "downloading" || state === "flashing"}
        <ProgressBar percent={progress.percent} label={progress.phase} />
        <div class="flex items-center gap-2">
          <p class="text-sm text-text-muted font-mono">{progress.message}</p>
          {#if progress.percent === 100}
            <svg class="animate-spin h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
        </div>
        {#if progress.percent === 100}
          <p class="text-xs text-text-dim">Finishing up — please don't disconnect the device...</p>
        {/if}
      {/if}

      {#if state === "done"}
        <div class="bg-accent/10 border border-accent/30 rounded p-4">
          <p class="text-accent font-mono font-medium">Flash successful!</p>
          <p class="text-text-muted text-sm mt-1">
            Your {board.name} is now running DongLoRa v{release.version}.
          </p>
          <p class="text-text-dim text-xs mt-2">
            If the board doesn't restart automatically, press the <code class="font-mono text-accent bg-bg-elevated px-1 rounded">RST</code> button to reboot it.
          </p>
        </div>
      {/if}

      {#if state === "error"}
        <div class="bg-error/10 border border-error/30 rounded p-4">
          <p class="text-error font-mono font-medium text-sm">{errorMessage}</p>
          <button
            onclick={() => { state = "prep"; }}
            class="mt-3 text-sm text-accent hover:text-accent-bright font-mono cursor-pointer"
          >
            Try again
          </button>
        </div>
      {/if}

      {#if state !== "ready"}
        <FlashLog lines={logLines} />
      {/if}
    {/if}
  {:else if board.flashMethod === "download-only"}
    <div class="bg-bg-card border border-warn/30 rounded p-4 mb-2">
      <p class="text-warn text-sm font-medium mb-1">CP2102 UART — web flashing not supported</p>
      <p class="text-text-muted text-sm">{board.notes}</p>
    </div>
  {/if}

  <!-- Download + CLI instructions (always shown) -->
  <div class="bg-bg-card border border-border rounded p-5 mt-2">
    <h4 class="font-mono text-sm font-medium text-text mb-3">Download &amp; Flash via CLI</h4>

    {#if asset}
      <a
        href={asset.downloadUrl}
        class="inline-block bg-bg-elevated border border-border text-accent font-mono text-sm px-4 py-2 rounded hover:border-accent transition-colors"
        download
      >
        Download {assetName}
      </a>
    {:else}
      <p class="text-warn text-sm mb-2">
        .bin file not available for this release.
        <a
          href="https://github.com/donglora/firmware/releases"
          class="text-accent hover:text-accent-bright"
          target="_blank"
          rel="noopener noreferrer"
        >
          Check GitHub releases
        </a>
      </p>
    {/if}

    <div class="mt-3 text-sm text-text-muted">
      <p class="mb-2">Flash with <a href="https://github.com/esp-rs/espflash" class="text-accent hover:text-accent-bright" target="_blank" rel="noopener noreferrer">espflash</a>:</p>
      <pre class="font-mono text-xs text-accent bg-bg-elevated p-3 rounded overflow-x-auto">cargo install espflash
espflash flash {assetName}</pre>
    </div>
  </div>
</div>
