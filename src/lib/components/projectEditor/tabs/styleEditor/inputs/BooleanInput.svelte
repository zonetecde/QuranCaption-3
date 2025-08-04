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

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<label class="flex items-center gap-2 cursor-pointer">
			<input
				type="checkbox"
				onchange={() => onValueChange(bindedValue)}
				bind:checked={bindedValue}
				class="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
			/>
			<span class="material-icons text-lg text-gray-400">{style.icon}</span>
			<span class="text-sm font-medium text-gray-300">{style.name}</span>
		</label>
	</div>
	<p class="text-xs text-gray-500 ml-6">{style.description}</p>
</div>
