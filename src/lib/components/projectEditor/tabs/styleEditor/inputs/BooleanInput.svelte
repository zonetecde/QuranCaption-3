<script lang="ts">
	import type { Style } from '$lib/classes/VideoStyle.svelte.js';

	let {
		style,
		bindedValue = $bindable(),
		onValueChange
	}: {
		style: Style;
		bindedValue: boolean;
		onValueChange: (value: boolean) => void;
	} = $props();
</script>

<div class="space-y-2">
	<label class="flex items-center gap-2 cursor-pointer group">
		<div class="relative">
			<input
				type="checkbox"
				onchange={() => onValueChange(bindedValue)}
				bind:checked={bindedValue}
				class="sr-only"
			/>
			<div
				class="w-10 h-5 bg-accent/50 rounded-full border border-[var(--border-color)]/50 transition-all group-hover:border-accent/70
			            {bindedValue ? 'bg-accent-primary border-accent-primary' : ''}"
			>
				<div
					class="w-4 h-4 bg-primary rounded-full transition-transform translate-x-0.5 translate-y-0.5
				            {bindedValue ? 'translate-x-5' : ''}"
				></div>
			</div>
		</div>
		<span class="material-icons text-accent text-sm">{style.icon}</span>
		<span class="text-xs font-medium text-primary flex-1">{style.name}</span>
		<span
			class="text-xs px-2 py-0.5 rounded {bindedValue
				? 'text-accent-primary bg-accent-primary/20'
				: 'text-thirdly bg-accent/20'}"
		>
			{bindedValue ? 'ON' : 'OFF'}
		</span>
	</label>
	<p class="text-xs text-secondary leading-relaxed ml-12">{style.description}</p>
</div>
