import { Timeline } from './Timeline.svelte.js';
import { Asset } from './Asset.svelte.js';
import { AssetTrack, SubtitleTrack, Track } from './Track.svelte.js';
import { AssetType, TrackType } from './enums.js';
import { SerializableBase } from './misc/SerializableBase.js';
import toast from 'svelte-5-french-toast';
import { ProjectTranslation } from './index.js';

export class ProjectContent extends SerializableBase {
	timeline: Timeline;
	assets: Asset[];
	projectTranslation: ProjectTranslation;

	/**
	 * Crée une instance de ProjectContent.
	 * @param timeline La timeline du projet, par défaut une nouvelle Timeline vide.
	 * @param assets La liste des assets du projet, par défaut un tableau vide.
	 */
	constructor(
		timeline: Timeline = new Timeline(),
		assets: Asset[] = [],
		projectTranslation: ProjectTranslation = new ProjectTranslation()
	) {
		super();

		this.timeline = $state(timeline);
		this.assets = $state(assets);
		this.projectTranslation = $state(projectTranslation);
	}

	/**
	 * Retourne le contenu par défaut d'un projet, avec une timeline contenant
	 * une piste de sous-titres, une piste vidéo et une piste audio.
	 * @returns Le contenu par défaut d'un projet
	 */
	static getDefaultProjectContent(): ProjectContent {
		return new ProjectContent(
			new Timeline([
				new SubtitleTrack(),
				new AssetTrack(TrackType.Video),
				new AssetTrack(TrackType.Audio)
			]),
			[]
		);
	}

	addAsset(filePath: string, youtubeUrl?: string): void {
		const asset = new Asset(filePath, youtubeUrl);
		if (asset.type === AssetType.Unknown) {
			toast.error('This file format is not supported.');
			return;
		}
		this.assets.unshift(asset);
	}

	removeAsset(asset: Asset): void {
		const index = this.assets.indexOf(asset);
		if (index !== -1) {
			this.assets.splice(index, 1);

			// Maintenant, supprime l'asset de la timeline
			this.timeline.removeAssetFromTracks(asset);
		} else {
			toast.error('Asset not found in the project content.');
		}
	}

	getAssetById(id: number) {
		return this.assets.find((x) => x.id === id)!;
	}
}

// Enregistre les classes enfants pour la désérialisation automatique
SerializableBase.registerChildClass(ProjectContent, 'timeline', Timeline);
SerializableBase.registerChildClass(ProjectContent, 'assets', Asset);
SerializableBase.registerChildClass(ProjectContent, 'projectTranslation', ProjectTranslation);
