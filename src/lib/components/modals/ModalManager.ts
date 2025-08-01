import { mount, unmount } from 'svelte';
import Confirm from './Confirm.svelte';
import Input from './Input.svelte';
import Error from './Error.svelte';

export default class ModalManager {
	static async confirmModal(text: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			// Créer un conteneur pour le modal
			const container = document.createElement('div');
			container.classList.add('modal-wrapper');
			document.body.appendChild(container);

			// Monter le composant Svelte 5
			const confirm = mount(Confirm, {
				target: container,
				props: {
					text: text,
					resolve: (result: boolean) => {
						// Nettoyer et résoudre
						unmount(confirm);
						document.body.removeChild(container);
						resolve(result);
					}
				}
			});
		});
	}

	static async errorModal(title: string, message: string, logs: string): Promise<void> {
		return new Promise<void>((resolve) => {
			// Créer un conteneur pour le modal
			const container = document.createElement('div');
			container.classList.add('modal-wrapper');
			document.body.appendChild(container);
			// Monter le composant Svelte 5
			const confirm = mount(Error, {
				target: container,
				props: {
					title: title,
					message: message,
					logs: logs,
					resolve: () => {
						// Nettoyer et résoudre
						unmount(confirm);
						document.body.removeChild(container);
						resolve();
					}
				}
			});
		});
	}

	static async inputModal(
		text: string,
		defaultText: string = '',
		maxlength: number = 100,
		placeholder: string = 'Enter text here'
	): Promise<string> {
		return new Promise<string>((resolve) => {
			// Supprime l'ancien modal s'il existe
			const existingModal = document.querySelector('.modal-wrapper');
			if (existingModal) {
				document.body.removeChild(existingModal);
			}

			// Créer un conteneur pour le modal
			const container = document.createElement('div');
			container.className = 'modal-wrapper';
			document.body.appendChild(container);

			// Monter le composant Svelte 5
			const input = mount(Input, {
				target: container,
				props: {
					text: text,
					defaultText: defaultText,
					maxlength: maxlength,
					placeholder: placeholder,
					resolve: (result: string) => {
						// Nettoyer et résoudre
						unmount(input);
						document.body.removeChild(container);
						resolve(result);
					}
				}
			});
		});
	}
}
