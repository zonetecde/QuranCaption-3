import { globalState } from '$lib/runes/main.svelte';
import toast from 'svelte-5-french-toast';
import { CustomTextClip, SubtitleClip } from '.';
import { TrackType } from './enums';
import { SerializableBase } from './misc/SerializableBase';
import { Utilities } from './misc/Utilities';
import { CustomTextTrack } from './Track.svelte';
import type { a } from 'vitest/dist/chunks/suite.d.FvehnV49.js';
import QPCV2FontProvider from '$lib/services/FontProvider';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, readTextFile } from '@tauri-apps/plugin-fs';

export type StyleValueType =
	| 'color'
	| 'number'
	| 'select'
	| 'boolean'
	| 'text'
	| 'time'
	| 'composite'
	| 'reciter';

// Types spécifiques pour les catégories de styles
export type StyleCategoryName =
	| 'text'
	| 'positioning'
	| 'background'
	| 'shadow'
	| 'outline'
	| 'border'
	| 'effects'
	| 'animation'
	| 'general'
	| 'overlay'
	| 'surah-name'
	| 'creator-text';

// Types spécifiques pour chaque catégorie de styles
export type GeneralStyleName = 'show-subtitles' | 'show-verse-number' | 'verse-number-separator';

export type TextStyleName =
	| 'text-color'
	| 'font-size'
	| 'font-family'
	| 'font-weight'
	| 'text-transform'
	| 'letter-spacing'
	| 'word-spacing'
	| 'line-height'
	| 'max-line'
	| 'reactive-font-size';

export type PositioningStyleName =
	| 'vertical-position'
	| 'horizontal-position'
	| 'width'
	| 'horizontal-text-alignment'
	| 'vertical-text-alignment';

export type BackgroundStyleName =
	| 'background-enable'
	| 'background-color'
	| 'background-opacity'
	| 'border-radius'
	| 'padding';

export type ShadowStyleName =
	| 'shadow-enable'
	| 'text-shadow'
	| 'text-shadow-color'
	| 'box-shadow'
	| 'box-shadow-color';

export type OutlineStyleName = 'outline-enable' | 'text-outline' | 'text-outline-color';

export type BorderStyleName = 'border-enable' | 'border-width' | 'border-color' | 'border-style';

export type EffectsStyleName = 'opacity' | 'blur' | 'brightness' | 'contrast';

export type AnimationStyleName = 'fade-duration' | 'scale' | 'rotation';

export type OverlayStyleName =
	| 'overlay-enable'
	| 'overlay-color'
	| 'overlay-opacity'
	| 'overlay-blur';

export type SurahNameStyleName =
	| 'show-surah-name'
	| 'surah-name-format'
	| 'surah-show-arabic'
	| 'surah-name-vertical-position'
	| 'surah-name-horizontal-position'
	| 'surah-show-latin'
	| 'surah-size'
	| 'surah-opacity'
	| 'surah-latin-spacing'
	| 'surah-latin-text-style';

export type ReciterNameStyleName =
	| 'show-reciter-name'
	| 'reciter-name-format'
	| 'reciter-show-arabic'
	| 'reciter-name-vertical-position'
	| 'reciter-name-horizontal-position'
	| 'reciter-show-latin'
	| 'reciter-size'
	| 'reciter-opacity'
	| 'reciter-latin-spacing'
	| 'reciter-latin-text-style';

// Nouvelle définition pour les styles du Creator Text
export type CreatorTextStyleName = 'creator-text' | 'creator-text-composite';

export type CustomTextStyleName =
	| 'time-appearance'
	| 'time-disappearance'
	| 'text'
	| 'always-show'
	| 'custom-text-composite';

// Union type pour tous les noms de styles
export type StyleName =
	| GeneralStyleName
	| TextStyleName
	| PositioningStyleName
	| BackgroundStyleName
	| ShadowStyleName
	| OutlineStyleName
	| BorderStyleName
	| EffectsStyleName
	| AnimationStyleName
	| OverlayStyleName
	| SurahNameStyleName
	| ReciterNameStyleName
	| CreatorTextStyleName
	| CustomTextStyleName;

export class Style extends SerializableBase {
	id: string = $state('');
	name: string = '';
	description: string = '';
	value: string | number | boolean | Style[] = $state('');
	valueType: StyleValueType = 'text';
	valueMin?: number;
	valueMax?: number;
	step?: number;
	options?: string[];
	css: string = '';
	tailwind?: boolean;
	tailwindClass?: string;
	icon: string = '';

	constructor(init?: Partial<Style>) {
		super();
		if (!init) return;
		Object.assign(this, init);
	}

	/**
	 * Méthode utile uniquement si valueType est composite.
	 * Génère le CSS d'un style composite
	 * @returns Le CSS de ce style composite
	 */
	generateCSSForComposite() {
		// Récupère tous les styles composites pour un style donné
		const compositeStyles = this.value as Style[];

		let css = '';
		for (let i = 0; i < compositeStyles.length; i++) {
			const element = compositeStyles[i];

			if (!element.id || (element.id.includes('enable') && !element.value)) {
				// Si on désactive le style, on ne génère pas le CSS (c'est toute la partie outline là qui est concernée)
				break;
			}

			css += element.css.replaceAll('{value}', String(element.value)) + '\n';
		}

		return css;
	}

	/**
	 * Méthode utile uniquement si valueType est composite.
	 * @param styleId Le nom du style
	 * @param value La nouvelle valeur à appliquer
	 */
	setCompositeStyleValue(styleId: StyleName, value: string | number | boolean) {
		if (this.valueType === 'composite') {
			const style = this.getCompositeStyle(styleId);
			if (style) {
				style.value = value;
			}
		}
	}

	/**
	 * Méthode utile uniquement si valueType est composite.
	 * Récupère un style composite par son ID
	 * @param styleId L'ID du style à récupérer
	 * @returns Le style composite correspondant ou undefined
	 */
	getCompositeStyle(styleId: StyleName): Style | undefined {
		if (this.valueType === 'composite' && this.value instanceof Array) {
			return (this.value as Style[]).find((s) => s.id === styleId);
		} else {
			// Le style composite n'a toujours pas été chargé
			return new Style({ id: styleId, value: 0 });
		}
	}
}

export class Category extends SerializableBase {
	id: string = $state('');
	name: string = '';
	description: string = '';
	icon: string = '';
	styles: Style[] = $state([]);

	constructor(init?: Partial<Category>) {
		super();
		if (!init) return;
		// assign simples
		const { styles, ...rest } = init as any;
		Object.assign(this, rest);

		// s'assurer que les styles sont des instances de Style
		if (Array.isArray(styles)) {
			this.styles = styles.map((s) => (s instanceof Style ? s : new Style(s)));
		}
	}

	getStyle(styleId: StyleName): Style | undefined {
		return this.styles.find((style) => style.id === styleId);
	}

	getCompositeStyle(): Style | undefined {
		for (const style of this.styles) {
			if (style.valueType === 'composite') {
				return style;
			}
		}
		return undefined;
	}

	/**
	 * Si la catégorie contient un style composite, le load avec
	 * ses valeurs par défaut.
	 */
	async loadCompositeStyle() {
		for (const style of this.styles) {
			if (style.valueType === 'composite' && !(style.value instanceof Array)) {
				// Charge les styles composites (JSON brut)
				const raw: any[] = await (await fetch('./styles/compositeStyles.json')).json();
				// Transforme chaque entrée en véritable instance de Style
				style.value = raw.map((s) => (s instanceof Style ? s : new Style(s)));

				if (style.id === 'surah-latin-text-style' || style.id === 'reciter-latin-text-style') {
					style.setCompositeStyleValue('font-size', 30);
				}
			}
		}
	}
}

export class StylesData extends SerializableBase {
	categories: Category[] = $state([]);
	target: 'global' | 'arabic' | string = $state('');

	// Overrides spécifiques aux clips sélectionnés
	overrides: { [clipId: number]: { [styleId in StyleName]?: string | number | boolean } } = $state(
		{}
	);

	constructor(target: 'global' | 'arabic' | string, categories: Category[] = []) {
		super();
		this.target = target;
		// S'assurer que chaque élément passé est bien une instance de Category
		// (les JSON importés depuis les fichiers contiennent seulement les attributs)
		this.categories = (categories || []).map((c: any) =>
			c instanceof Category ? c : new Category(c)
		);
	}

	/**
	 * Génère le CSS pour tous les styles actifs (fusion globale + overrides clip si fournis)
	 */
	generateCSS(clipId?: number): string {
		let css = '';

		for (const category of this.categories) {
			let skipCategory = false;

			for (const style of category.styles) {
				const effectiveValue = this.getEffectiveValue(style.id as StyleName, clipId);

				// Pour les catégories de styles qui peuvent être désactivées (border, outline, ...),
				// si la propriété d'activation est false, on ne génère pas le CSS des autres styles
				if (style.valueType === 'boolean' && style.id.includes('enable')) {
					if (!Boolean(effectiveValue)) {
						skipCategory = true;
						break;
					} else {
						continue; // ne pas générer la règle pour le flag lui-même
					}
				}

				if (skipCategory) break;

				// Propriétés spécifiques à ignorer
				if (style.id === 'font-family' && String(effectiveValue) === 'Hafs') continue; // Gérer par une classe Tailwind
				if (style.id === 'max-height' && String(effectiveValue) === 'none') break; // Ignore les propriétés après qui dépendent de max-height

				if (style.tailwind) continue; // Ignore les styles Tailwind, qui sont appliqués différemment

				// Cas particulier: pour la police d'écriture Mushaf, alors on met la bonne
				// police d'écriture en fonction du verset
				if (style.id === 'font-family' && String(effectiveValue) === 'Mushaf' && clipId) {
					const subtitleClip = globalState.getSubtitleTrack.getClipById(clipId);
					let fontname = 'QCF2BSML'; // Par défaut on met le font contenant tout les glyphes spéciaux du Coran
					// (notamment si subtitleClip instanceof PredefinedSubtitle alors pour la basmala ce sera le bon font)

					if (subtitleClip instanceof SubtitleClip) {
						fontname = QPCV2FontProvider.getFontNameForVerse(
							subtitleClip.surah,
							subtitleClip.verse
						);
					}

					css += `font-family: ${fontname};\n`;
					continue;
				}

				// Cas particulier pour l'alignement vertical/horizontal du texte
				if (style.id === 'vertical-text-alignment' || style.id === 'horizontal-text-alignment') {
					// @ts-ignore: style.css peut être un objet map
					css += style.css[effectiveValue as any] + '\n';
					continue;
				}

				// Cas particulier pour background-color
				if (style.id === 'background-color') {
					// Il faut convertir la couleur de l'hex en rgb
					if (typeof effectiveValue === 'string' && effectiveValue.startsWith('#')) {
						const r = parseInt(effectiveValue.slice(1, 3), 16);
						const g = parseInt(effectiveValue.slice(3, 5), 16);
						const b = parseInt(effectiveValue.slice(5, 7), 16);
						let valeur = `rgba(${r}, ${g}, ${b}, var(--background-opacity))`;

						css += 'background-color: ' + valeur + ';\n';
					}
				}

				// Cas particulier pour `show-subtitles`
				if (style.id === 'show-subtitles') {
					if (!Boolean(effectiveValue)) {
						return 'display: none;';
					}
				}

				// Remplace {value} par la valeur effective
				let cssRule = '';

				// Cas spécifique: certains styles sont différents pour l'arabe, comme par ex
				// le contour du texte (outline) qui nécessite du CSS différent.
				if (this.target === 'arabic' && 'cssarabic' in style) {
					//@ts-ignore
					cssRule = style.cssarabic.replaceAll(/{value}/g, String(effectiveValue));
				} else {
					cssRule = style.css.replaceAll(/{value}/g, String(effectiveValue));
				}

				if (cssRule.trim()) {
					css += cssRule + '\n';
				}
			}
		}

		return css;
	}

	/**
	 * Génère les classes Tailwind pour tous les styles actifs
	 * @returns Une chaîne de classes Tailwind
	 */
	generateTailwind(): string {
		let tailwindClasses = '';

		for (const category of this.categories) {
			for (const style of category.styles) {
				if (style.id === 'font-family' && style.value === 'Hafs') {
					// Utilise la police Hafs pour les styles de texte
					tailwindClasses += 'arabic ';
					continue;
				}

				// Ignore les styles qui ne sont pas des classes Tailwind
				if (!style.tailwind || !style.tailwindClass) continue;

				// Remplace {value} par la valeur actuelle
				let tailwindClass = style.tailwindClass.replaceAll(/{value}/g, String(style.value));

				if (tailwindClass.trim()) {
					tailwindClasses += tailwindClass + ' ';
				}
			}
		}

		return tailwindClasses.trim();
	}

	/**
	 * Définit la valeur d'un style
	 * @param styleId L'ID du style à modifier
	 * @param value La nouvelle valeur à appliquer
	 */
	setStyle(styleId: StyleName, value: string | number | boolean): void {
		// Trouve le style
		const style = this.findStyle(styleId);
		if (style) {
			style.value = value;
		}
	}

	/**
	 * Trouve un style par son ID
	 * @param styleId L'ID du style à trouver
	 * @returns Le style correspondant ou undefined s'il n'est pas trouvé
	 */
	findStyle(styleId: StyleName): Style | undefined {
		for (const category of this.categories) {
			const style = category.styles.find((s) => s.id === styleId);
			if (style) return style;
		}
		return undefined;
	}

	/**
	 * Définit un style pour un ou plusieurs clips sélectionnés (override partiel)
	 */
	setStyleForClips(clipIds: number[], styleId: StyleName, value: string | number | boolean) {
		// Les styles du target 'global' sont uniques et ne peuvent pas être individualisés
		if (this.target === 'global') {
			return; // Il n'y a pas de style individuel pour les styles globaux
		}

		for (const clipId of clipIds) {
			// Créez un nouvel objet d'override pour le clip s'il n'existe pas
			if (!this.overrides[clipId]) this.overrides[clipId] = {} as any;

			// Regarde si pour la valeur qu'on veut appliquer à ce style pour ces clip
			// si c'est la valeur par déjà du style
			if (this.findStyle(styleId)?.value === value) {
				// Enlève l'override pour ce style, car c'est la valeur déjà de son parent
				delete this.overrides[clipId][styleId];
			} else {
				// Applique l'override avec la valeur
				this.overrides[clipId][styleId] = value;
			}
		}
	}

	/**
	 * Supprime l'override pour un style donné sur une liste de clips
	 * @param clipIds L'ID des clips à modifier
	 * @param styleId L'ID du style à supprimer
	 */
	clearStyleForClips(clipIds: number[], styleId: StyleName): void {
		// Aucun override à supprimer pour 'global'
		if (this.target === 'global') {
			return;
		}

		for (const clipId of clipIds) {
			const byClip = this.overrides[clipId];
			if (!byClip) continue;

			// Supprime l'override pour ce style sur ce clip
			if (byClip[styleId] !== undefined) {
				delete byClip[styleId];
			}

			// Nettoyage de l'objet clip s'il est vide
			if (Object.keys(byClip).length === 0) {
				delete this.overrides[clipId];
			}
		}
	}

	/**
	 * Retourne la valeur effective (override clip si présent, sinon valeur du StylesData)
	 * @param styleId L'ID du style à récupérer
	 * @param clipId L'ID du clip à vérifier
	 * @returns La valeur effective du style
	 */
	getEffectiveValue(styleId: StyleName, clipId?: number): string | number | boolean {
		const style = this.findStyle(styleId);

		// Si target est 'global', on ignore toujours les overrides
		if (this.target === 'global') {
			return style ? (style.value as string | number | boolean) : '';
		}

		// Structure des overrides pour StylesData : overrides[clipId][styleId] = value
		if (
			clipId !== undefined &&
			this.overrides[clipId] &&
			this.overrides[clipId][styleId] !== undefined
		) {
			return this.overrides[clipId][styleId]!;
		}

		return style ? (style.value as string | number | boolean) : '';
	}

	/**
	 * Vérifie si un clip a un override pour un style donné
	 * @param clipIds L'ID du clip à vérifier
	 * @param styleId L'ID du style à vérifier
	 * @returns true si le clip a un override pour le style, false sinon
	 */
	hasOverrideForAny(clipIds: number[], styleId: StyleName): boolean {
		// Jamais d'override pour 'global'
		if (this.target === 'global') return false;

		return clipIds.some((clipId) => {
			const byClip = this.overrides[clipId];
			return !!(byClip && byClip[styleId] !== undefined);
		});
	}

	/**
	 * Indique si un clip possède au moins un override de style.
	 * @param clipId L'ID du clip à vérifier
	 * @returns true si le clip a au moins un override de style, false sinon
	 */
	hasAnyOverrideForClip(clipId: number): boolean {
		const byClip = this.overrides?.[clipId];
		if (!byClip) return false;

		// Chaque override pour un clip est un objet plat { styleId: value },
		// donc il suffit de vérifier s'il y a au moins une clé.
		return Object.keys(byClip).length > 0;
	}

	/**
	 * Créer les styles composites s'ils n'existent pas déjà
	 */
	async loadCompositeStyles() {
		for (const category of this.categories) {
			category.loadCompositeStyle();
		}
	}

	/**
	 * Get - et créer si nécessaire - les styles composites pour un style donné
	 * @param compositeStyleId L'identifiant du style composite
	 */
	getCompositeStyles(compositeStyleId: StyleName): Style[] {
		// Try catch au cas où le style composite n'a toujours pas été créé
		const style = this.findStyle(compositeStyleId);

		if (style) {
			if (style.value instanceof Array) return style.value as Style[];
			// Style par défaut non encore créé si on arrive là.
		}

		// Si non trouvé, alors cherche parmis les textes composites des customs text
		return globalState.getVideoStyle.getCustomTextCompositeStyles(compositeStyleId);
	}
}

// Stockage des overrides par clip
export type ClipStyleOverrides = {
	[clipId: number]: {
		[target: string]: {
			[categoryId in StyleCategoryName]?: {
				[styleId in StyleName]?: string | number | boolean;
			};
		};
	};
};

export class VideoStyle extends SerializableBase {
	styles: StylesData[] = $state([]);

	lastUpdated: Date = $state(new Date());

	constructor() {
		super();
	}

	/**
	 * Retourne les styles par défaut d'un projet
	 * @returns Les styles par défaut d'une vidéo
	 */
	static async getDefaultVideoStyle(): Promise<VideoStyle> {
		// Créer un nouveau objet VideoStyle
		const videoStyle = new VideoStyle();

		// Ajoute les styles par défaut pour chaque target
		videoStyle.styles.push(
			new StylesData('global', await (await fetch('./styles/globalStyles.json')).json())
		);
		videoStyle.styles.push(
			new StylesData('arabic', await (await fetch('./styles/styles.json')).json())
		);

		// Set les styles par défaut pour l'arabe
		videoStyle.getStylesOfTarget('arabic').setStyle('font-family', 'Mushaf');
		videoStyle.getStylesOfTarget('arabic').setStyle('font-size', 90);
		videoStyle.getStylesOfTarget('arabic').setStyle('vertical-position', -100);

		// Load les styles composites
		videoStyle.getStylesOfTarget('global').loadCompositeStyles();

		return videoStyle;
	}

	/**
	 * Obtient les styles d'une cible spécifique
	 * @param target La cible à interroger (global, arabic, ou une traduction)
	 * @returns Les styles de la cible
	 */
	getStylesOfTarget(target: 'global' | 'arabic' | string): StylesData {
		const styles = this.styles.find((s) => s.target === target);
		return styles ? styles : new StylesData(target);
	}

	/**
	 * Update la valeur d'un style d'un custom text (depuis la track Custom Text)
	 * @param customTextId L'ID du texte custom
	 * @param styleId L'ID du style à obtenir
	 * @param value La nouvelle valeur à appliquer
	 */
	setCustomTextStyle(
		customTextId: StyleCategoryName,
		styleId: StyleName,
		value: string | number | boolean
	): void {
		console.log(customTextId);

		// Trouve donc le clip correspondant pour update sa valeur
		const clip = globalState.getCustomTextTrack.clips.find(
			(c) => (c as CustomTextClip).category?.id === customTextId
		) as CustomTextClip | undefined;
		if (clip) {
			clip.setStyle(styleId, value);
		}
	}

	doesTargetStyleExist(target: string): boolean {
		return this.styles.find((style) => style.target === target) !== undefined;
	}

	async addStylesForEdition(translationEdition: string) {
		if (this.doesTargetStyleExist(translationEdition)) return;

		const defaultStyles = await (await fetch('./styles/styles.json')).json();

		const stylesData = new StylesData(translationEdition, defaultStyles);

		// Styles par défaut pour les traductions
		stylesData.setStyle('font-family', 'Georgia'); // Définit la police par défaut
		stylesData.setStyle('font-size', 60); // Définit la taille de police par défaut
		stylesData.setStyle('vertical-position', 100); // Définit la hauteur de ligne par défaut

		this.styles.push(stylesData);
	}

	async getDefaultCustomTextCategory(): Promise<Category> {
		// Récupère le JSON brut
		const raw = await (await fetch('./styles/customText.json')).json();
		// Instancie correctement la catégorie (ce constructeur instancie aussi les Style internes)
		const category = new Category(raw);
		// Ajoute un suffixe unique pour éviter collisions lorsque plusieurs custom texts sont ajoutés
		const randomId = Utilities.randomId();
		category.id += '-' + randomId;
		const composite = category.getStyle('custom-text-composite')!;
		composite.id += '-' + randomId;

		category.loadCompositeStyle();

		return category;
	}

	/**
	 * Ajoute un texte personnalisé au projet dans les styles globaux
	 */
	async addCustomText() {
		// Ajoute la track Custom Text si non existante
		if (!globalState.currentProject!.content.timeline.doesTrackExist(TrackType.CustomText)) {
			globalState.currentProject!.content.timeline.addTrack(new CustomTextTrack());
		}

		// Si on a la hauteur de section du hauter par défaut (68), alors ajouter la track
		// `custom text` rendra invisible la track `audio`. Augmente donc la hauteur de la
		// timeline afin qu'elle soit visible
		if (globalState.currentProject!.projectEditorState.upperSectionHeight === 68) {
			globalState.currentProject!.projectEditorState.upperSectionHeight = 60;
		}

		// Ajoute le custom text au projet
		const customTextCategory = await this.getDefaultCustomTextCategory();
		globalState.getCustomTextTrack.addCustomText(customTextCategory);

		setTimeout(() => {
			globalState.updateVideoPreviewUI();
		}, 10); // 10ms nécessaire
	}

	/**
	 * Recherche parmis tout les targets qu'on a s'il existe un override pour
	 * un clip donné
	 * @param id L'ID du clip à vérifier
	 */
	hasAnyOverrideForClip(id: number): any {
		for (const stylesData of this.styles) {
			if (stylesData.hasAnyOverrideForClip(id)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Retourne les styles du style composite d'un custom text
	 * @param customTextId L'id du customText
	 * @returns
	 */
	getCustomTextCompositeStyles(customTextId: string): any {
		for (const clip of globalState.getCustomTextTrack.clips) {
			if (!(clip instanceof CustomTextClip)) continue;
			const style = clip.category!.getStyle(customTextId as StyleName);
			if (style) return style.value as Style[];
		}
	}

	/**
	 * Exporte les styles vers un fichier
	 * @param includedExportClips Optionnellement, une liste des customs-text à inclure
	 * @return Les données exportées en format JSON
	 */
	exportStyles(includedExportClips: Set<number>): string {
		let exportData: videoStyleFileData = {
			videoStyle: JSON.parse(JSON.stringify(this)),
			customTextClips: []
		};
		// Enlève tout les overrides
		for (const style of exportData.videoStyle.styles) {
			style.overrides = {};
		}
		// Ajoute les customs texts clips
		for (const clip of globalState.getCustomTextTrack.clips) {
			if (includedExportClips.has(clip.id)) {
				const _clip = JSON.parse(JSON.stringify(clip));
				exportData.customTextClips.push(_clip);
			}
		}
		// Retourne le JSON
		return JSON.stringify(exportData, null, 2);
	}

	async importStylesFromFile() {
		// Open a dialog
		const file = await open({
			multiple: false,
			directory: false
		});

		if (!file) return;

		const json = JSON.parse((await readTextFile(file)).toString());
		globalState.getVideoStyle.importStyles(json);
	}

	async importStyles(json: videoStyleFileData) {
		// Crée une nouvelle instance VideoStyle à partir des données JSON
		const importedVideoStyle = VideoStyle.fromJSON(json.videoStyle);

		// Remplace les styles du projet actuel par les nouveaux
		globalState.currentProject!.content.videoStyle = importedVideoStyle;

		// Ajoute les customs text clips en créant des instances correctes
		for (const clipData of json.customTextClips) {
			clipData.id = Utilities.randomId(); // Assure qu'il a un ID unique

			// Crée une nouvelle instance CustomTextClip à partir des données JSON
			const clip = CustomTextClip.fromJSON(clipData);
			globalState.getCustomTextTrack.clips.push(clip);
		}
	}
}

interface videoStyleFileData {
	videoStyle: VideoStyle;
	customTextClips: CustomTextClip[];
}

SerializableBase.registerChildClass(VideoStyle, 'styles', StylesData);
SerializableBase.registerChildClass(StylesData, 'categories', Category);
SerializableBase.registerChildClass(Category, 'styles', Style);
