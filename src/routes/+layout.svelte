<script lang="ts">
	import DonationFloatingButton from '$lib/components/misc/DonationFloatingButton.svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import { globalState } from '$lib/runes/main.svelte';
	import { projectService } from '$lib/services/ProjectService';
	import { Toaster } from 'svelte-5-french-toast';
	import TitleBar from '$lib/components/TitleBar.svelte';
	import { initializeClassRegistry } from '$lib/classes/ClassRegistry';
	import { on } from 'svelte/events';

	let { children } = $props();

	onMount(() => {
		initializeClassRegistry();
	});
</script>

<Toaster />

<div class="flex flex-col h-screen overflow-hidden">
	<!-- Barre de titre fixe -->
	<TitleBar />

	<!-- Zone de contenu avec scroll -->
	<main class="flex-1 overflow-auto mt-10">
		{@render children()}
		<DonationFloatingButton />
	</main>
</div>
