<script lang="ts">
  interface Props {
    lines: string[];
  }

  let { lines }: Props = $props();
  let container: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (lines.length && container) {
      // Scroll after DOM update
      queueMicrotask(() => {
        container!.scrollTop = container!.scrollHeight;
      });
    }
  });
</script>

<div
  bind:this={container}
  class="terminal-scroll bg-bg-card border border-border rounded font-mono text-xs p-4 h-48 overflow-y-auto"
>
  {#each lines as line}
    <div class="text-accent/80 leading-relaxed">{line}</div>
  {/each}
  {#if lines.length === 0}
    <div class="text-text-dim">Waiting for connection...</div>
  {/if}
</div>
