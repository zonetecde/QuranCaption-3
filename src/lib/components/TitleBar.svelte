<script>
	import { globalState } from '$lib/runes/main.svelte';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import EditableText from './misc/EditableText.svelte';

	async function minimizeButtonClick() {
		(await getCurrentWindow()).minimize();
	}

	async function maximalizeButtonClick() {
		const currentWindow = await getCurrentWindow();
		if (await currentWindow.isMaximized()) {
			await currentWindow.unmaximize();
		} else {
			await currentWindow.maximize();
		}
	}

	async function closeButtonClick() {
		const currentWindow = await getCurrentWindow();
		if (await currentWindow.isDecorated()) {
			await currentWindow.setDecorations(false);
		}
		await currentWindow.close();
	}
</script>

<header
	data-tauri-drag-region
	class="bg-titlebar shadow-md p-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 max-h-10"
>
	<div class="flex items-center space-x-5">
		<button
			class="flex space-x-2 cursor-pointer"
			onclick={async () => {
				// go home
				await globalState.currentProject?.save();
				globalState.currentProject = null;
			}}
		>
			<img class="text-indigo-400 w-8 pb-0.25" alt="Logo" src="favicon.png" />
			<h1 class="text-lg font-semibold text-gray-100 pt-0.75">Quran Caption</h1>
		</button>
		{#if globalState.currentProject}
			<button
				class="bg-green-700 hover:bg-green-800 duration-100 text-white text-sm px-2 py-1 rounded-md flex items-center space-x-2 cursor-pointer"
				type="button"
			>
				<span class="material-icons text-[20px]!">save</span>
				<span>Autosave</span>
			</button>

			<EditableText
				bind:value={globalState.currentProject.detail.name}
				text={'Project Name'}
				parentClasses="absolute left-1/2 -translate-x-1/2 pr-[18px]"
			></EditableText>
		{/if}
	</div>
	<div class="flex items-center space-x-2">
		<button class="w-10 cursor-pointer rounded-full hover:bg-gray-700" type="button">
			<span class="material-icons pt-2">settings</span>
		</button>
		<button
			class="w-10 cursor-pointer rounded-full hover:bg-gray-700"
			onclick={async () => {
				await openUrl('https://qurancaption-project.vercel.app/documentation');
			}}
			type="button"
		>
			<span class="material-icons pt-2">help_outline</span>
		</button>
		<button
			class="w-10 cursor-pointer rounded-full hover:bg-gray-700"
			type="button"
			onclick={minimizeButtonClick}
		>
			<span class="material-icons pt-2">minimize</span>
		</button>
		<button
			class="w-10 cursor-pointer rounded-full hover:bg-gray-700"
			type="button"
			onclick={maximalizeButtonClick}
		>
			<span class="material-icons pt-2">crop_square</span>
		</button>
		<button
			class="w-10 cursor-pointer rounded-full hover:bg-red-600"
			type="button"
			onclick={closeButtonClick}
		>
			<span class="material-icons pt-2">close</span>
		</button>
	</div>
</header>
