<script lang="ts">
	import type { Style } from '$lib/classes/VideoStyle.svelte.js';

	let {
		style,
		bindedValue = $bindable(),
		onValueChange
	}: {
		style: Style;
		bindedValue: string | number | boolean;
		onValueChange: (value: string | number | boolean) => void;
	} = $props();
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2">
		<span class="material-icons text-accent text-sm">{style.icon}</span>
		<span class="text-xs font-medium text-primary flex-1 truncate">{style.name}</span>
	</div>
	<div class="flex items-center gap-2">
		<div class="relative">
			<input
				type="color"
				bind:value={bindedValue}
				class="w-8 h-8 rounded border border-[var(--border-color)]/50 cursor-pointer bg-transparent overflow-hidden"
				onchange={() => onValueChange(bindedValue)}
			/>
			<div
				class="absolute inset-0 border border-[var(--border-color)]/30 rounded pointer-events-none"
			></div>
		</div>
		<input
			type="text"
			bind:value={bindedValue}
			class="flex-1 px-2 py-1.5 bg-accent/30 border border-[var(--border-color)]/50 rounded text-primary text-xs
			       focus:border-accent-primary focus:outline-none focus:bg-accent/50 transition-all"
			placeholder="#ffffff"
			oninput={() => onValueChange(bindedValue)}
		/>
	</div>
	<p class="text-xs text-secondary leading-relaxed">{style.description}</p>
</div>
