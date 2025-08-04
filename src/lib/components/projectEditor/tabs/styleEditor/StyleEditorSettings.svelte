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

	function hasValueOverride(categoryName: string, styleName: string): boolean {
		if (currentTarget === 'global') {
			// En mode global, vérifie s'il y a des overrides dans n'importe quelle cible
			const globalValue = videoStyle().getStyleValue('global', categoryName, styleName);

			// Vérifie arabic
			if (videoStyle().hasSpecificStyle('arabic', categoryName, styleName)) {
				const arabicValue = videoStyle().getStyleValue('arabic', categoryName, styleName);
				if (arabicValue !== globalValue) return true;
			}

			// Vérifie toutes les traductions
			const translations = globalState.getProjectTranslation.addedTranslationEditions;
			for (const translation of translations) {
				if (videoStyle().hasSpecificStyle(translation.name, categoryName, styleName)) {
					const translationValue = videoStyle().getStyleValue(
						translation.name,
						categoryName,
						styleName
					);
					if (translationValue !== globalValue) return true;
				}
			}

			return false;
		} else {
			// En mode spécifique, vérifie si la valeur est différente du global
			const globalValue = videoStyle().getStyleValue('global', categoryName, styleName);
			const currentValue = videoStyle().getStyleValue(currentTarget, categoryName, styleName);

			// Il faut qu'il y ait un override ET que la valeur soit différente
			return (
				videoStyle().hasSpecificStyle(currentTarget, categoryName, styleName) &&
				currentValue !== globalValue
			);
		}
	}

	async function resetToDefaults() {
		await videoStyle().resetToDefaults();
	}
</script>

<div
	class="bg-secondary h-full flex flex-col border border-color rounded-lg relative overflow-hidden"
>
	<!-- En-tête moderne compact -->
	<div class="bg-accent/30 border-b border-[var(--border-color)]/50 px-3 py-3">
		<div class="flex items-center gap-2">
			<div class="p-1.5 bg-accent-primary/20 rounded-md">
				<span class="material-icons text-accent text-lg">auto_fix_high</span>
			</div>
			<div class="flex-1 min-w-0">
				<h2 class="text-base font-bold text-primary truncate">Video Style</h2>
				<p class="text-xs text-secondary truncate">Customize appearance</p>
			</div>
		</div>
	</div>

	<!-- Sélecteur de cible compact -->
	<div class="p-3">
		<div class="bg-accent/40 border border-[var(--border-color)]/50 rounded-lg p-3">
			<div class="flex items-center gap-1.5 mb-2">
				<span class="material-icons text-accent text-sm">target</span>
				<label class="text-xs font-medium text-primary">Target</label>
			</div>
			<select
				bind:value={currentTarget}
				class="w-full px-2 py-2 bg-secondary border border-[var(--border-color)]/50 rounded text-primary text-xs
					       focus:border-accent-primary focus:outline-none transition-colors"
			>
				{#each targetOptions() as option}
					<option value={option.value} class="bg-secondary text-primary">{option.label}</option>
				{/each}
			</select>
			<div class="mt-2 p-2 bg-secondary/50 rounded border border-[var(--border-color)]/30">
				<p class="text-xs text-secondary">
					{#if currentTarget === 'global'}
						Global styles for all elements
					{:else if currentTarget === 'arabic'}
						Arabic text specific styles
					{:else}
						"{currentTarget}" translation styles
					{/if}
				</p>
			</div>
		</div>
	</div>

	<!-- Bouton reset compact -->
	<div class="px-3 py-2 border-b border-[var(--border-color)]/30">
		<button
			onclick={resetToDefaults}
			class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent/30 hover:bg-accent
				       border border-[var(--border-color)]/50 hover:border-accent-primary/50 rounded text-secondary
				       hover:text-primary transition-all duration-200 text-xs font-medium"
		>
			<span class="material-icons text-sm">refresh</span>
			Reset Defaults
		</button>
	</div>

	<!-- Contenu scrollable -->
	<div class="flex-1 overflow-y-auto">
		<!-- Styles par catégories compactes -->
		<div class="p-3 space-y-3">
			{#each Object.entries(styles()) as [categoryName, category]}
				<Section name={category.name} icon={category.icon}>
					<div class="space-y-2 p-3 bg-accent/20 border border-[var(--border-color)]/30 rounded-lg">
						{#each Object.entries(category.styles) as [styleName, style]}
							{@const isOverridden = hasValueOverride(categoryName, styleName)}

							<div
								class="p-2 bg-secondary/50 rounded border border-[var(--border-color)]/50 transition-all
								       {isOverridden ? 'border-accent-primary/50 bg-accent-primary/5' : 'hover:border-accent/50'}"
							>
								{#if isOverridden}
									<div
										class="flex items-center gap-1 mb-1 p-1 bg-accent-primary/10 rounded text-xs"
									>
										<span class="material-icons text-xs text-accent-primary">tune</span>
										<span class="text-accent-primary font-medium truncate">
											{#if currentTarget === 'global'}
												Has overrides
											{:else}
												Custom value
											{/if}
										</span>
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
</div>
