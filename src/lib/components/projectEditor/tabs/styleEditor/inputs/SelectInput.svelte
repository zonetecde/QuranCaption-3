<script lang="ts">
	import type { Style } from '$lib/classes/VideoStyle.svelte.js';
	import { invoke } from '@tauri-apps/api/core';
	import { onMount } from 'svelte';

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
	<select
		bind:value={bindedValue}
		onchange={() => onValueChange(bindedValue)}
		class="w-full px-2 py-1.5 bg-accent/30 border border-[var(--border-color)]/50 rounded text-primary text-xs
		       focus:border-accent-primary focus:outline-none focus:bg-accent/50 transition-all"
	>
		{#if style.name === 'Font Family'}
			<option value="Hafs" class="bg-secondary text-primary"> Hafs (Quran font) </option>
			{#await invoke('get_system_fonts') then fonts: any}
				{#each Object.keys(fonts) as font}
					<option value={font} class="bg-secondary text-primary">{font}</option>
				{/each}
			{/await}
		{:else}
			{#each style.options || [] as option}
				<option value={option} class="bg-secondary text-primary">{option}</option>
			{/each}
		{/if}
	</select>
	<p class="text-xs text-secondary leading-relaxed">{style.description}</p>
</div>
