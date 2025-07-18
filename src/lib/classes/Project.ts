import { projectService } from '$lib/services/ProjectService';
import { ProjectContent, ProjectDetail, ProjectEditorState } from '.';
import { SerializableBase } from './misc/SerializableBase';

export class Project extends SerializableBase {
	detail: ProjectDetail;
	content: ProjectContent;
	projectEditorState: ProjectEditorState; // État de l'éditeur de projet

	/**
	 * Crée une nouvelle instance de projet
	 * @param detail Détails du projet
	 * @param content Contenu du projet, par défaut un contenu vide
	 */
	constructor(detail: ProjectDetail, content: ProjectContent = new ProjectContent()) {
		super();
		this.detail = detail;
		this.content = content;
		this.projectEditorState = new ProjectEditorState();
	}

	/**
	 * Sauvegarde le projet sur l'ordinateur
	 */
	async save(): Promise<void> {
		this.detail.updateTimestamp();
		await projectService.save(this);
	}
}

// Enregistre les classes enfants pour la désérialisation automatique
SerializableBase.registerChildClass(Project, 'detail', ProjectDetail);
SerializableBase.registerChildClass(Project, 'content', ProjectContent);
SerializableBase.registerChildClass(Project, 'projectEditorState', ProjectEditorState);
