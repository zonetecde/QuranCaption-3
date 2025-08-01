import type SubtitlesEditor from '$lib/components/projectEditor/tabs/subtitlesEditor/SubtitlesEditor.svelte';
import { ProjectEditorTabs } from './enums';
import { SerializableBase } from './misc/SerializableBase';

/**
 * État de l'éditeur de projet, utilisé pour gérer l'interface utilisateur et les interactions
 * dans l'éditeur de projet.
 */
export class ProjectEditorState extends SerializableBase {
	// L'onglet actuellement sélectionné dans l'éditeur de projet
	currentTab: ProjectEditorTabs = $state(ProjectEditorTabs.VideoEditor);

	// Indique si on montre ou non l'indication "Drop your files here"
	showDropScreen: boolean = $state(false);

	// Indique quelle(s) section(s) de l'éditeur sont étendues
	sections: {
		[name: string]: {
			extended: boolean;
		};
	} = $state({});

	// Timeline
	timeline: TimelineState = $state(new TimelineState());

	// Video preview
	videoPreview: VideoPreviewState = $state(new VideoPreviewState());

	// Subtitles editor
	subtitlesEditor: SubtitlesEditorState = $state(new SubtitlesEditorState());

	// Translations editor
	translationsEditor: TranslationsEditorState = $state(new TranslationsEditorState());

	// Hauteur de la section supérieure dans chaque onglet
	upperSectionHeight: number = $state(68);
}

/**
 * État de la timeline dans l'éditeur de projet.
 */
export class TimelineState extends SerializableBase {
	// Niveau de zoom de la timeline
	zoom: number = $state(29.25);

	// Position du curseur dans la timeline
	cursorPosition: number = $state(1);

	// Indique si on doit afficher ou non le curseur de la timeline
	showCursor: boolean = $state(true);

	// State permettant de trigger le changement du temps de la vidéo et de l'audio dans la preview
	movePreviewTo: number = $state(0);

	// Position du scroll
	scrollX: number = $state(0);

	// On montre ou non les wavesforms
	showWaveforms: boolean = $state(false);
}

/**
 * État de la prévisualisation vidéo dans l'éditeur de projet.
 */
export class VideoPreviewState extends SerializableBase {
	// Indique si la prévisualisation vidéo est en pause
	isPlaying: boolean = $state(false);
}

export class SubtitlesEditorState extends SerializableBase {
	// Indique la sourate actuellement sélectionnée dans l'éditeur de sous-titres
	selectedSurah: number = $state(1);

	// Indique le numéro du verset actuellement sélectionné dans l'éditeur de sous-titres
	selectedVerse: number = $state(1);

	// Indique l'index du premier mot actuellement sélectionné dans l'éditeur de sous-titres
	startWordIndex: number = $state(0);

	// Indique l'index du dernier mot actuellement sélectionné dans l'éditeur de sous-titres
	endWordIndex: number = $state(0);

	// Playback speed
	playbackSpeed: number = $state(1.0);

	// Affiche la traduction des mots
	showWordTranslation: boolean = $state(true);

	// Affiche la translittération des mots
	showWordTransliteration: boolean = $state(false);
}

export class TranslationsEditorState extends SerializableBase {
	// Indique si l'utilisateur montre les instructions pour utiliser l'IA
	showAIInstructions: boolean = $state(false);

	// Indique le filtre actuellement appliqué dans l'éditeur de traductions
	filters: { [statut: string]: boolean } = $state({
		'to review': true,
		'ai error': true,
		'ai trimmed': true,
		'automatically trimmed': true,
		reviewed: true,
		'completed by default': false
	});

	// Garde la position du scroll
	scrollPosition: number = $state(0);

	checkOnlyFilters(list: string[]) {
		for (const key in this.filters) {
			if (list.includes(key)) {
				this.filters[key] = true;
			} else {
				this.filters[key] = false;
			}
		}

		this.triggerReactivity();
	}

	triggerReactivity() {
		// Pour forcer la réactivité
		this.filters = {
			...this.filters
		};
	}
}

SerializableBase.registerChildClass(ProjectEditorState, 'timeline', TimelineState);
SerializableBase.registerChildClass(
	ProjectEditorState,
	'translationsEditor',
	TranslationsEditorState
);
SerializableBase.registerChildClass(ProjectEditorState, 'videoPreview', VideoPreviewState);
SerializableBase.registerChildClass(ProjectEditorState, 'subtitlesEditor', SubtitlesEditorState);
