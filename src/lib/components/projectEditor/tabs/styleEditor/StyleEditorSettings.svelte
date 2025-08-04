<script lang="ts">
	import { globalState } from '$lib/runes/main.svelte';
	import Section from '$lib/components/projectEditor/Section.svelte';
	import StyleInput from './inputs/StyleInput.svelte';
	import type { StylesData, StyleTarget } from '$lib/classes/VideoStyle.svelte.js';

	const videoStyle = $derived(() => {
		return globalState.currentProject!.content.videoStyle;
	});

	const styles = $derived(() => {
		return videoStyle().styles;
	});

	// Cible actuelle pour les modifications de style
	let currentTarget = $state<StyleTarget>('global');

	// Options disponibles pour le sélecteur
	const targetOptions = $derived(() => {
		const options = [
			{ value: 'global', label: 'Global (All Elements)' },
			{ value: 'arabic', label: 'Arabic Text' }
		]; // Ajoute les traductions du projet
		const translations = globalState.getProjectTranslation.addedTranslationEditions;
		for (const translation of translations) {
			options.push({
				value: translation.name,
				label: `Translation: ${translation.name}`
			});
		}

		return options;
	});

	function handleStyleChange(
		categoryName: string,
		styleName: string,
		value: string | number | boolean
	) {
		videoStyle().updateSpecificStyleValue(currentTarget, categoryName, styleName, value);
	}

	function getCurrentStyleValue(
		categoryName: string,
		styleName: string
	): string | number | boolean {
		return videoStyle().getStyleValue(currentTarget, categoryName, styleName);
	}

	function hasSpecificOverride(categoryName: string, styleName: string): boolean {
		return videoStyle().hasSpecificStyle(currentTarget, categoryName, styleName);
	}

	async function resetToDefaults() {
		await videoStyle().resetToDefaults();
	}
</script>

<div
	class="bg-secondary h-full flex flex-col border border-color rounded-lg py-6 px-2 space-y-6 relative overflow-y-auto"
>
	<!-- En-tête avec icône -->
	<div class="flex gap-x-2 items-center justify-center">
		<span class="material-icons text-accent text-xl">auto_fix_high</span>
		<h2 class="text-xl font-bold text-primary">Video Style</h2>
	</div>

	<!-- Sélecteur de cible -->
	<div class="px-4">
		<div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
			<div class="block text-sm font-medium text-gray-300 mb-2">
				<span class="material-icons text-lg text-indigo-400 mr-2">target</span>
				Style Target
			</div>
			<select
				bind:value={currentTarget}
				class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:border-indigo-500 focus:outline-none"
			>
				{#each targetOptions() as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<p class="text-xs text-gray-500 mt-2">
				{#if currentTarget === 'global'}
					Editing global styles that apply to all elements
				{:else if currentTarget === 'arabic'}
					Editing styles specific to Arabic text
				{:else}
					Editing styles specific to "{currentTarget}" translation
				{/if}
			</p>
		</div>
	</div>

	<!-- Bouton de réinitialisation -->
	<div class="flex justify-center px-4">
		<button
			onclick={resetToDefaults}
			class="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white text-sm transition-colors flex items-center gap-2"
		>
			<span class="material-icons text-sm">refresh</span>
			Reset to Defaults
		</button>
	</div>
	<!-- Styles par catégories -->
	<div class="space-y-4 px-2 max-h-[calc(100vh-200px)]">
		{#each Object.entries(styles()) as [categoryName, category]}
			<Section name={category.name} icon={category.icon}>
				<div class="space-y-4 p-4 bg-gray-800/50 rounded-lg">
					<p class="text-sm text-gray-400 mb-4">{category.description}</p>
					{#each Object.entries(category.styles) as [styleName, style]}
						{@const isOverridden = hasSpecificOverride(categoryName, styleName)}

						<div
							class="p-3 bg-gray-900/50 rounded border border-gray-700 {isOverridden &&
							currentTarget !== 'global'
								? 'border-indigo-500/50 bg-indigo-900/10'
								: ''}"
						>
							{#if isOverridden && currentTarget !== 'global'}
								<div class="flex items-center gap-1 mb-2">
									<span class="material-icons text-xs text-indigo-400">override</span>
									<span class="text-xs text-indigo-400">Overridden for {currentTarget}</span>
								</div>
							{/if}
							<StyleInput
								style={{ ...style, value: getCurrentStyleValue(categoryName, styleName) }}
								onValueChange={(value) => handleStyleChange(categoryName, styleName, value)}
							/>
						</div>
					{/each}
				</div>
			</Section>
		{/each}
	</div>
</div>
