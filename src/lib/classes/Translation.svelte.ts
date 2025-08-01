import { globalState } from '$lib/runes/main.svelte';
import type { SubtitleClip } from './Clip.svelte';
import type { Edition } from './Edition';
import { SerializableBase } from './misc/SerializableBase';

export type TranslationStatus =
	| 'completed by default'
	| 'automatically trimmed'
	| 'ai trimmed'
	| 'to review'
	| 'reviewed'
	| 'ai error'
	| 'undefined';

export class Translation extends SerializableBase {
	// Le texte de la traduction
	text: string = $state('');

	// Status
	status: TranslationStatus = $state('undefined');

	// Type de la traduction
	type: 'verse' | 'predefined' | 'other' = 'other';

	constructor(text: string, status: TranslationStatus) {
		super();
		this.text = text;
		this.status = status;
	}

	isStatusComplete(): boolean {
		return (
			this.status === 'completed by default' ||
			this.status === 'reviewed' ||
			this.status === 'automatically trimmed' ||
			this.status === 'ai trimmed'
		);
	}
}

export class VerseTranslation extends Translation {
	// L'indice du mot de début de la traduction dans le texte original
	startWordIndex: number = $state(0);

	// L'indice du mot de fin de la traduction dans le texte original
	endWordIndex: number = $state(0);

	// Indique si la traduction ne se base pas sur la traduction originale
	isBruteForce: boolean = $state(false);

	constructor(text: string, status: TranslationStatus) {
		super(text, status);

		if (text === undefined) return; // déserialisation

		this.startWordIndex = 0;
		this.endWordIndex = text.split(' ').length - 1;
		this.isBruteForce = false;
		this.type = 'verse';
	}
}

export class PredefinedSubtitleTranslation extends Translation {
	constructor(text: string) {
		super(text, 'completed by default');

		if (text === undefined) return; // déserialisation

		if (text.length > 0) {
			this.type = 'predefined';
		} else {
			this.type = 'other';
		}
	}
}
