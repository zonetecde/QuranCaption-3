import { SerializableBase } from './misc/SerializableBase';

export type StyleValueType = 'color' | 'number' | 'select' | 'boolean';

export type StyleTarget = 'global' | 'arabic' | string; // string pour les noms des traductions

export interface Style {
	name: string;
	description: string;
	value: string | number | boolean;
	valueType: StyleValueType;
	valueMin?: number;
	valueMax?: number;
	step?: number;
	options?: string[];
	css: string;
	applyGlobally: boolean;
	icon: string;
}

export interface Category {
	name: string;
	description: string;
	icon: string;
	styles: Record<string, Style>;
}

export type StylesData = Record<string, Category>;

export class VideoStyle extends SerializableBase {
	styles: StylesData = $state({});

	// Styles spécifiques pour chaque cible (arabic, nom des traductions)
	// Format: { [target: string]: StylesData }
	specificStyles: Record<string, StylesData> = $state({});

	lastUpdated: Date = $state(new Date());

	constructor(styles: StylesData = {}, lastUpdated: Date = new Date()) {
		super();
		this.styles = styles;
		this.lastUpdated = lastUpdated;
	}

	static async getDefaultVideoStyle(): Promise<VideoStyle> {
		const styles: StylesData = await (await fetch('./styles.json')).json();

		if (styles) {
			return new VideoStyle(styles, new Date());
		}

		return new VideoStyle();
	}

	/**
	 * Obtient une catégorie de styles par son nom
	 */
	getCategory(categoryName: string): Category | undefined {
		return this.styles[categoryName];
	}

	/**
	 * Obtient un style spécifique dans une catégorie
	 */
	getStyle(categoryName: string, styleName: string): Style | undefined {
		const category = this.getCategory(categoryName);
		return category?.styles[styleName];
	}
	/**
	 * Met à jour la valeur d'un style global
	 */
	updateStyleValue(
		categoryName: string,
		styleName: string,
		value: string | number | boolean
	): boolean {
		const style = this.getStyle(categoryName, styleName);
		if (style) {
			style.value = value;
			this.lastUpdated = new Date();
			return true;
		}
		return false;
	}

	/**
	 * Met à jour la valeur d'un style spécifique pour une cible donnée
	 */
	updateSpecificStyleValue(
		target: StyleTarget,
		categoryName: string,
		styleName: string,
		value: string | number | boolean
	): boolean {
		if (target === 'global') {
			return this.updateStyleValue(categoryName, styleName, value);
		}

		// Initialise la structure si elle n'existe pas
		if (!this.specificStyles[target]) {
			this.specificStyles[target] = {};
		}
		if (!this.specificStyles[target][categoryName]) {
			// Clone la catégorie globale comme base
			const globalCategory = this.getCategory(categoryName);
			if (globalCategory) {
				this.specificStyles[target][categoryName] = JSON.parse(JSON.stringify(globalCategory));
			} else {
				return false;
			}
		}

		const specificStyle = this.specificStyles[target][categoryName]?.styles[styleName];
		if (specificStyle) {
			specificStyle.value = value;
			this.lastUpdated = new Date();
			return true;
		}
		return false;
	}

	/**
	 * Obtient la valeur d'un style pour une cible spécifique (avec fallback sur global)
	 */
	getStyleValue(
		target: StyleTarget,
		categoryName: string,
		styleName: string
	): string | number | boolean {
		// Si c'est global ou si pas de style spécifique, utilise le global
		if (target === 'global' || !this.specificStyles[target]?.[categoryName]?.styles[styleName]) {
			const globalStyle = this.getStyle(categoryName, styleName);
			return globalStyle?.value || '';
		}

		// Retourne la valeur spécifique
		return this.specificStyles[target][categoryName].styles[styleName].value;
	}

	/**
	 * Vérifie si un style spécifique existe pour une cible
	 */
	hasSpecificStyle(target: StyleTarget, categoryName: string, styleName: string): boolean {
		return !!(
			target !== 'global' && this.specificStyles[target]?.[categoryName]?.styles[styleName]
		);
	}

	/**
	 * Vérifie si une catégorie est activée en cherchant un style de type boolean avec un nom contenant "enable"
	 */
	private isCategoryEnabled(category: Category): boolean {
		for (const styleName in category.styles) {
			const style = category.styles[styleName];
			// Cherche un style boolean avec "enable" dans le nom
			if (style.valueType === 'boolean' && styleName.includes('enable')) {
				return Boolean(style.value);
			}
		}
		// Si aucun booléen d'activation n'est trouvé, la catégorie est considérée comme activée
		return true;
	}
	/**
	 * Génère le CSS pour tous les styles actifs (global)
	 */
	generateCSS(): string {
		return this.generateCSSForTarget('global');
	}
	/**
	 * Génère le CSS pour une cible spécifique
	 */
	generateCSSForTarget(target: StyleTarget): string {
		let cssRules: Record<string, string[]> = {};
		let transformRules: string[] = [];
		let filterRules: string[] = [];

		// Utilise les styles globaux comme base
		for (const categoryName in this.styles) {
			const category = this.styles[categoryName];

			// Vérifie si la catégorie est activée (globalement)
			if (!this.isCategoryEnabled(category)) {
				continue;
			}

			for (const styleName in category.styles) {
				// Obtient la valeur pour la cible spécifique (avec fallback sur global)
				const value = this.getStyleValue(target, categoryName, styleName);
				const style = category.styles[styleName];

				// Pour les styles boolean, on n'applique le CSS que si la valeur est true
				if (style.valueType === 'boolean' && !value) {
					continue;
				}

				// Remplace {value} par la valeur actuelle
				let cssRule = style.css.replace(/{value}/g, String(value));

				if (cssRule.trim()) {
					// Traitement spécial pour les propriétés transform
					if (cssRule.includes('transform:')) {
						const transformMatch = cssRule.match(/transform:\s*([^;]+);?/);
						if (transformMatch) {
							const transformValue = transformMatch[1].trim();
							// Filtre les valeurs invalides comme "none" ou les valeurs vides
							if (
								transformValue &&
								transformValue !== 'none' &&
								transformValue !== 'initial' &&
								transformValue !== 'inherit'
							) {
								transformRules.push(transformValue);
							}
							continue;
						}
					}

					// Traitement spécial pour les propriétés filter
					if (cssRule.includes('filter:')) {
						const filterMatch = cssRule.match(/filter:\s*([^;]+);?/);
						if (filterMatch) {
							const filterValue = filterMatch[1].trim();
							// Filtre les valeurs invalides comme "none" ou les valeurs vides
							if (
								filterValue &&
								filterValue !== 'none' &&
								filterValue !== 'initial' &&
								filterValue !== 'inherit'
							) {
								filterRules.push(filterValue);
							}
							continue;
						}
					}

					// Pour les autres propriétés CSS normales
					const propertyMatch = cssRule.match(/([^:]+):\s*([^;]+);?/);
					if (propertyMatch) {
						const property = propertyMatch[1].trim();
						const propertyValue = propertyMatch[2].trim();

						if (!cssRules[property]) {
							cssRules[property] = [];
						}
						cssRules[property].push(propertyValue);
					}
				}
			}
		}

		// Construire le CSS final
		let css = '';

		// Ajouter les propriétés CSS normales
		for (const [property, values] of Object.entries(cssRules)) {
			// Pour la plupart des propriétés, on prend la dernière valeur
			css += `${property}: ${values[values.length - 1]};\n`;
		}

		// Ajouter les transforms combinés
		if (transformRules.length > 0) {
			css += `transform: ${transformRules.join(' ')};\n`;
		}

		// Ajouter les filters combinés
		if (filterRules.length > 0) {
			css += `filter: ${filterRules.join(' ')};\n`;
		}

		return css;
	}

	/**
	 * Génère le CSS pour une catégorie spécifique
	 */
	generateCategoryCSS(categoryName: string): string {
		const category = this.getCategory(categoryName);
		if (!category) return '';

		// Vérifie si la catégorie est activée
		if (!this.isCategoryEnabled(category)) {
			return '';
		}

		let cssRules: Record<string, string[]> = {};
		let transformRules: string[] = [];
		let filterRules: string[] = [];

		for (const styleName in category.styles) {
			const style = category.styles[styleName];

			// Pour les styles boolean, on n'applique le CSS que si la valeur est true
			if (style.valueType === 'boolean' && !style.value) {
				continue;
			}

			// Remplace {value} par la valeur actuelle
			let cssRule = style.css.replace(/{value}/g, String(style.value));

			if (cssRule.trim()) {
				// Traitement spécial pour les propriétés transform
				if (cssRule.includes('transform:')) {
					const transformMatch = cssRule.match(/transform:\s*([^;]+);?/);
					if (transformMatch) {
						const transformValue = transformMatch[1].trim();
						// Filtre les valeurs invalides comme "none" ou les valeurs vides
						if (
							transformValue &&
							transformValue !== 'none' &&
							transformValue !== 'initial' &&
							transformValue !== 'inherit'
						) {
							transformRules.push(transformValue);
						}
						continue;
					}
				}

				// Traitement spécial pour les propriétés filter
				if (cssRule.includes('filter:')) {
					const filterMatch = cssRule.match(/filter:\s*([^;]+);?/);
					if (filterMatch) {
						const filterValue = filterMatch[1].trim();
						// Filtre les valeurs invalides comme "none" ou les valeurs vides
						if (
							filterValue &&
							filterValue !== 'none' &&
							filterValue !== 'initial' &&
							filterValue !== 'inherit'
						) {
							filterRules.push(filterValue);
						}
						continue;
					}
				}

				// Pour les autres propriétés CSS normales
				const propertyMatch = cssRule.match(/([^:]+):\s*([^;]+);?/);
				if (propertyMatch) {
					const property = propertyMatch[1].trim();
					const propertyValue = propertyMatch[2].trim();

					if (!cssRules[property]) {
						cssRules[property] = [];
					}
					cssRules[property].push(propertyValue);
				}
			}
		}

		// Construire le CSS final
		let css = '';

		// Ajouter les propriétés CSS normales
		for (const [property, values] of Object.entries(cssRules)) {
			// Pour la plupart des propriétés, on prend la dernière valeur
			css += `${property}: ${values[values.length - 1]};\n`;
		}

		// Ajouter les transforms combinés
		if (transformRules.length > 0) {
			css += `transform: ${transformRules.join(' ')};\n`;
		}

		// Ajouter les filters combinés
		if (filterRules.length > 0) {
			css += `filter: ${filterRules.join(' ')};\n`;
		}

		return css;
	}

	/**
	 * Remet tous les styles à leurs valeurs par défaut
	 */
	async resetToDefaults(): Promise<void> {
		const defaultStyle = await VideoStyle.getDefaultVideoStyle();
		this.styles = defaultStyle.styles;
		this.specificStyles = defaultStyle.specificStyles;
		this.lastUpdated = new Date();
	}
}
