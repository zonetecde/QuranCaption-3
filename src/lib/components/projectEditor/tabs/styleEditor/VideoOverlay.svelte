<script lang="ts">
	import { PredefinedSubtitleClip, TrackType, Translation } from '$lib/classes';
	import { globalState } from '$lib/runes/main.svelte';
	import { untrack } from 'svelte';

	const fadeDuration = 500;

	let getTimelineSettings = $derived(() => {
		return globalState.currentProject!.projectEditorState.timeline;
	});

	let currentSubtitle = $derived(() => {
		const _ = getTimelineSettings().cursorPosition;
		return untrack(() => {
			return globalState.getSubtitleTrack.getCurrentSubtitleToDisplay();
		});
	});

	let currentSubtitleTranslations = $derived(() => {
		if (!currentSubtitle()) return [];
		return currentSubtitle()!.translations;
	});

	// Calcul de l'opacité des sous-titres
	let subtitleOpacity = $derived(() => {
		const subtitle = currentSubtitle();
		if (!subtitle) return 0;

		const currentTime = getTimelineSettings().cursorPosition;
		const endTime = subtitle.endTime;
		const timeLeft = endTime - currentTime;
		const halfFade = fadeDuration / 2;

		if (timeLeft <= halfFade) {
			return Math.max(0, timeLeft / halfFade);
		}

		const startTime = subtitle.startTime;
		const timeSinceStart = currentTime - startTime;

		if (timeSinceStart <= halfFade) {
			return Math.min(1, timeSinceStart / halfFade);
		}

		return 1;
	});
	let videoStyle = $derived(() => {
		return globalState.currentProject!.content.videoStyle;
	});

	// CSS pour le texte arabe
	let arabicCSS = $derived(() => {
		return videoStyle().generateCSSForTarget('arabic');
	});

	// CSS pour les traductions (par édition)
	function getTranslationCSS(edition: string): string {
		return videoStyle().generateCSSForTarget(edition);
	}

	$inspect(getTranslationCSS('eng-mustafakhattaba'));
</script>

<div class="w-full h-full">
	<div class="absolute inset-0 flex flex-col items-center justify-center" id="subtitles-container">
		{#if currentSubtitle() && currentSubtitle()!.id}
			{@const arabicCss = arabicCSS()}
			<p
				class={'arabic absolute ' + (arabicCss.includes('Hafs') ? 'hafs' : '')}
				style="opacity: {subtitleOpacity()}; {arabicCss.replace(
					`font-family: 'Hafs', sans-serif;`,
					``
				)};"
			>
				{currentSubtitle()!.text}
			</p>

			{#each Object.keys(currentSubtitleTranslations()!) as edition}
				{@const translation = (currentSubtitleTranslations()! as Record<string, Translation>)[
					edition
				]}

				<p
					class="translation absolute"
					style="opacity: {subtitleOpacity()}; {getTranslationCSS(edition)}; "
				>
					{translation.text}
				</p>
			{/each}
		{/if}
	</div>
</div>
