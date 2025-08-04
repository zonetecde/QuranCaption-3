<script lang="ts">
	import type { Style } from '$lib/classes/VideoStyle.svelte.js';

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

<div class="flex flex-col gap-2">
	<div class="text-sm font-medium text-gray-300 flex items-center gap-2">
		<span class="material-icons text-lg text-gray-400">{style.icon}</span>
		{style.name}
	</div>
	<div class="flex items-center gap-2">
		{#if style.valueMin !== undefined && style.valueMax !== undefined}
			<input
				type="range"
				min={style.valueMin}
				max={style.valueMax}
				step={style.step || 1}
				bind:value={bindedValue}
				class="flex-1 accent-indigo-500"
				oninput={(e) => {
					//@ts-ignore
					onValueChange(e.target.value);
				}}
			/>
		{/if}
		<input
			type="number"
			min={style.valueMin}
			max={style.valueMax}
			step={style.step || 1}
			bind:value={bindedValue}
			oninput={(e) => {
				//@ts-ignore
				onValueChange(e.target.value);
			}}
			class="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-indigo-500 focus:outline-none"
		/>
		{#if style.valueMin !== undefined && style.valueMax !== undefined}
			<span class="text-xs text-gray-500">{style.valueMin}-{style.valueMax}</span>
		{/if}
	</div>
	<p class="text-xs text-gray-500">{style.description}</p>
</div>
