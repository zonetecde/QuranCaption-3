<script lang="ts">
	import type { Style } from '$lib/classes/VideoStyle.svelte.js';
	import { globalState } from '$lib/runes/main.svelte';

	let {
		style,
		bindedValue = $bindable(),
		onValueChange
	}: {
		style: Style;
		bindedValue: boolean | number | string;
		onValueChange: (value: boolean | number | string) => void;
	} = $props();
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2">
		<span class="material-icons text-accent text-sm">{style.icon}</span>
		<span class="text-xs font-medium text-primary flex-1 truncate">{style.name}</span>
		{#if style.valueMin !== undefined && style.valueMax !== undefined}
			<span class="text-xs text-thirdly">{style.valueMin}-{style.valueMax}</span>
		{/if}
	</div>

	<div class="space-y-2">
		{#if style.valueMin !== undefined && style.valueMax !== undefined}
			<input
				type="range"
				min={style.valueMin}
				max={style.valueMax}
				step={style.step || 1}
				bind:value={bindedValue}
				class="w-full h-2 bg-accent/30 rounded-lg appearance-none cursor-pointer
				       slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4
				       slider-thumb:bg-accent-primary slider-thumb:rounded-full slider-thumb:cursor-pointer"
				style="background: linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) {(((bindedValue as number) -
					(style.valueMin || 0)) /
					((style.valueMax || 100) - (style.valueMin || 0))) *
					100}%, var(--bg-accent) {(((bindedValue as number) - (style.valueMin || 0)) /
					((style.valueMax || 100) - (style.valueMin || 0))) *
					100}%, var(--bg-accent) 100%)"
				oninput={(e) => {
					//@ts-ignore
					onValueChange(Number(e.target.value));
				}}
			/>
		{/if}

		<div class="flex items-center gap-2">
			<input
				type="number"
				min={style.valueMin}
				max={style.valueMax}
				step={style.step || 1}
				bind:value={bindedValue}
				oninput={(e) => {
					//@ts-ignore
					onValueChange(Number(e.target.value));
				}}
				class="flex-1 px-2 py-1.5 bg-accent/30 border border-[var(--border-color)]/50 rounded text-primary text-xs
				       focus:border-accent-primary focus:outline-none focus:bg-accent/50 transition-all"
			/>
			{#if style.valueMin !== undefined && style.valueMax !== undefined}
				<span class="text-xs text-accent px-2 py-1 bg-accent/20 rounded">
					{Math.round(
						(((bindedValue as number) - (style.valueMin || 0)) /
							((style.valueMax || 100) - (style.valueMin || 0))) *
							100
					)}%
				</span>
			{/if}
		</div>
	</div>

	<p class="text-xs text-secondary leading-relaxed">{style.description}</p>
</div>
