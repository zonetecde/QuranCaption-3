import { Timeline } from './Timeline.js';
import { Asset } from './Asset.js';
import { ProjectSettings } from './ProjectSettings.js';
import { SubtitleTrack, Track } from './Track.js';
import { AssetType, TrackType } from './enums.js';
import { SerializableBase } from './misc/SerializableBase.js';
import toast from 'svelte-5-french-toast';

export class ProjectContent extends SerializableBase {
	timeline: Timeline;
	assets: Asset[];
	projectSettings: ProjectSettings;

	/**
	 * Crée une instance de ProjectContent.
	 * @param timeline La timeline du projet, par défaut une nouvelle Timeline vide.
	 * @param assets La liste des assets du projet, par défaut un tableau vide.
	 * @param projectSettings Les paramètres du projet, par défaut les paramètres par défaut d'un projet.
	 */
	constructor(
		timeline: Timeline = new Timeline(),
		assets: Asset[] = [],
		projectSettings: ProjectSettings = new ProjectSettings()
	) {
		super();

		this.timeline = $state(timeline);
		this.assets = $state(assets);
		this.projectSettings = $state(projectSettings);
	}

	/**
	 * Retourne le contenu par défaut d'un projet, avec une timeline contenant
	 * une piste de sous-titres, une piste vidéo et une piste audio.
	 * @returns Le contenu par défaut d'un projet
	 */
	static getDefaultProjectContent(): ProjectContent {
		return new ProjectContent(
			new Timeline([
				new SubtitleTrack('arabic'),
				new Track(TrackType.Video),
				new Track(TrackType.Audio)
			]),
			[],
			ProjectSettings.getDefaultProjectSettings()
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
		} else {
			toast.error('Asset not found in the project content.');
		}
	}
}

// Enregistre les classes enfants pour la désérialisation automatique
SerializableBase.registerChildClass(ProjectContent, 'timeline', Timeline);
SerializableBase.registerChildClass(ProjectContent, 'assets', Asset);
SerializableBase.registerChildClass(ProjectContent, 'projectSettings', ProjectSettings);
