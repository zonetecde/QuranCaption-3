<script lang="ts">
	import type { Style } from '$lib/classes/VideoStyle.svelte.js';
	import ColorInput from './ColorInput.svelte';
	import NumberInput from './NumberInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import BooleanInput from './BooleanInput.svelte';

	let {
		style,
		bindedValue = $bindable(),
		onValueChange
	}: {
		style: Style;
		bindedValue?: string | number | boolean;
		onValueChange: (value: string | number | boolean) => void;
	} = $props();

	function handleChange(value: string | number | boolean) {
		if (bindedValue !== undefined) {
			bindedValue = value;
		}
		onValueChange?.(value);
	}
</script>

{#if style.valueType === 'color'}
	<ColorInput {style} bind:bindedValue={bindedValue as string} onValueChange={handleChange} />
{:else if style.valueType === 'number'}
	<NumberInput {style} bind:bindedValue={bindedValue as number} onValueChange={handleChange} />
{:else if style.valueType === 'select'}
	<SelectInput {style} bind:bindedValue={bindedValue as string} onValueChange={handleChange} />
{:else if style.valueType === 'boolean'}
	<BooleanInput {style} bind:bindedValue={bindedValue as boolean} onValueChange={handleChange} />
{/if}
