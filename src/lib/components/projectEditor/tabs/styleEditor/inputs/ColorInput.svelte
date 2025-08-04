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

<div class="flex flex-col gap-2">
	<div class="text-sm font-medium text-gray-300 flex items-center gap-2">
		<span class="material-icons text-lg text-gray-400">{style.icon}</span>
		{style.name}
	</div>
	<div class="flex items-center gap-2">
		<input
			type="color"
			bind:value={bindedValue}
			class="w-12 h-8 rounded border border-gray-600 cursor-pointer bg-transparent"
			onchange={() => onValueChange(bindedValue)}
		/>
		<input
			type="text"
			bind:value={bindedValue}
			class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-indigo-500 focus:outline-none"
			placeholder="#ffffff"
			oninput={() => onValueChange(bindedValue)}
		/>
	</div>
	<p class="text-xs text-gray-500">{style.description}</p>
</div>
