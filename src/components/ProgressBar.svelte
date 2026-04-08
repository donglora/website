<script lang="ts">
  interface Props {
    percent: number;
    label?: string;
  }

  let { percent, label }: Props = $props();
</script>

<div class="w-full">
  {#if label}
    <div class="flex justify-between text-xs font-mono text-text-muted mb-1">
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
  {/if}
  <div class="w-full h-2 bg-bg-elevated rounded overflow-hidden">
    <div
      class="h-full bg-accent rounded transition-all duration-200"
      style="width: {percent}%; box-shadow: 0 0 8px oklch(from var(--color-accent) l c h / 0.4);"
    ></div>
  </div>
</div>
