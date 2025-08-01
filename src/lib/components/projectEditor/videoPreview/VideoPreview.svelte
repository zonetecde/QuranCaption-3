<script lang="ts">
	import { Asset, ProjectEditorTabs, TrackType } from '$lib/classes';
	import { globalState } from '$lib/runes/main.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { mount, onDestroy, onMount, unmount, untrack } from 'svelte';
	import { Howl } from 'howler';
	import toast from 'svelte-5-french-toast';
	import ShortcutService, { SHORTCUTS } from '$lib/services/ShortcutService';
	import VideoPreviewControlsBar from './VideoPreviewControlsBar.svelte';

	let {
		showControls
	}: {
		showControls: boolean;
	} = $props();

	// === ÉTATS RÉACTIFS DÉRIVÉS ===
	// Récupère les paramètres de la timeline depuis l'état global
	let getTimelineSettings = $derived(() => {
		return globalState.currentProject!.projectEditorState.timeline;
	});

	// Récupère l'asset vidéo actuellement sous le curseur de la timeline
	// Seulement si movePreviewTo est défini (pour éviter les recalculs inutiles)
	let currentVideo = $derived(() => {
		if (getTimelineSettings().movePreviewTo)
			return untrack(() => {
				return globalState.currentProject!.content.timeline.getCurrentAssetOnTrack(TrackType.Video);
			});
	});

	// Récupère l'asset audio actuellement sous le curseur de la timeline
	let currentAudio = $derived(() => {
		if (getTimelineSettings().movePreviewTo)
			return untrack(() => {
				return globalState.currentProject!.content.timeline.getCurrentAssetOnTrack(TrackType.Audio);
			});
	});

	// === ÉTATS LOCAUX ===
	let videoElement = $state<HTMLVideoElement | null>(null); // Référence à l'élément <video> HTML

	// === EFFETS RÉACTIFS ===

	// Effect qui redimensionne la vidéo quand la hauteur de la prévisualisation change
	$effect(() => {
		if (globalState.currentProject?.projectEditorState.upperSectionHeight) {
			resizeVideoToFitScreen();
		}
	});

	// Effect qui recharge l'audio quand l'asset audio change
	$effect(() => {
		if (currentAudio()) {
			untrack(() => {
				setupAudio(); // Configure le nouveau fichier audio avec Howler
			});
		}
	});

	// Effect principal de synchronisation - se déclenche quand le curseur bouge
	$effect(() => {
		if (globalState.currentProject?.projectEditorState.timeline.movePreviewTo) {
			untrack(() => {
				const wasPlaying = isPlaying;
				pause(); // Met en pause pour synchroniser proprement

				// Synchronise la vidéo avec la position du curseur
				if (currentVideo()) {
					if (videoElement) {
						videoElement.currentTime = getCurrentVideoTimeToPlay();
					}
				}

				// La synchronisation audio se fait automatiquement dans le callback onplay de Howl

				if (wasPlaying) {
					play(); // Reprend la lecture si on était en train de lire
				}
			});
		}
	});

	// Effect pour que le scroll soit automatique afin de suivre le curseur dans la timeline
	$effect(() => {
		if (getTimelineSettings().cursorPosition) {
			untrack(() => {
				if (!isPlaying) return;

				// Scroll juqu'à la position du curseur
				const element = document.getElementById('cursor');
				const timeline = document.getElementById('timeline');

				if (element && timeline) {
					// Met le scroll à 0
					timeline.scrollLeft = 0;

					// Récupère la position du curseur par rapport à la timeline
					const cursorPositionRelativeToTimeline =
						element.getBoundingClientRect().left - timeline.getBoundingClientRect().left;

					const newScrollLeftPos = cursorPositionRelativeToTimeline - window.innerWidth / 2 + 300;

					// Scroll pour suivre le curseur
					timeline.scrollTo({
						left: newScrollLeftPos
					});
				}
			});
		}
	});

	// === FONCTIONS DE CALCUL DE TEMPS ===

	/**
	 * Calcule le temps à jouer dans l'audio en fonction de la position du curseur
	 * @returns Temps en secondes dans l'audio
	 */
	function getCurrentAudioTimeToPlay(): number {
		const currentClip = globalState.getAudioTrack.getCurrentClip();

		if (!currentClip) return 0;

		// Le temps dans l'audio = position du curseur - début du clip
		const timeInClip = getTimelineSettings().movePreviewTo - currentClip.startTime;
		return Math.max(0, timeInClip / 1000); // Convertit en secondes pour Howler
	}

	/**
	 * Calcule le temps à jouer dans la vidéo en fonction de la position du curseur
	 * @returns Temps en secondes dans la vidéo
	 */
	function getCurrentVideoTimeToPlay(): number {
		const currentClip = globalState.getVideoTrack.getCurrentClip();

		if (!currentClip) return 0;

		// Le temps dans la vidéo = position du curseur - début du clip
		const timeInClip = getTimelineSettings().movePreviewTo - currentClip.startTime;
		return Math.max(0, timeInClip / 1000); // Convertit en secondes pour l'élément video HTML
	}

	// === CYCLE DE VIE DU COMPOSANT ===
	onMount(() => {
		resizeVideoToFitScreen(); // Redimensionne initial
		window.addEventListener('resize', resizeVideoToFitScreen); // Écoute le redimensionnement de fenêtre

		// Force la synchronisation initiale vidéo/audio avec la position du curseur
		triggerVideoAndAudioToFitCursor();
		// Set les shortcuts pour le preview
		ShortcutService.registerShortcut({
			key: SHORTCUTS.VIDEO_PREVIEW.PLAY_PAUSE,
			onKeyDown: (e) => {
				togglePlayPause();
			}
		});

		ShortcutService.registerShortcut({
			key: SHORTCUTS.VIDEO_PREVIEW.MOVE_FORWARD,
			onKeyDown: (e) => {
				const currentTime = getTimelineSettings().cursorPosition;
				getTimelineSettings().cursorPosition = currentTime + 2000; // Avance de 2 secondes
				getTimelineSettings().movePreviewTo = currentTime + 2000;
			}
		});

		ShortcutService.registerShortcut({
			key: SHORTCUTS.VIDEO_PREVIEW.MOVE_BACKWARD,
			onKeyDown: (e) => {
				const currentTime = getTimelineSettings().cursorPosition;
				getTimelineSettings().cursorPosition = Math.max(1, currentTime - 2000); // Recule de 2 secondes
				getTimelineSettings().movePreviewTo = Math.max(1, currentTime - 2000);
			}
		});

		ShortcutService.registerShortcut({
			key: SHORTCUTS.VIDEO_PREVIEW.INCREASE_SPEED,
			onKeyDown: (e) => {
				setPlaybackSpeed(getSpeed() * 2);
			},
			onKeyUp: (e) => {
				setPlaybackSpeed(getSpeed());
			}
		});
	});

	function setPlaybackSpeed(speed: number) {
		audioSpeed = speed; // Met à jour la vitesse audio
		if (videoElement) {
			videoElement.playbackRate = speed;
		}
		if (audioHowl) {
			audioHowl.rate(speed);
		}
	}

	$effect(() => {
		const speed = getSpeed();
		untrack(() => {
			setPlaybackSpeed(speed);
		});
	});

	function getSpeed() {
		let speed = globalState.currentProject!.projectEditorState.subtitlesEditor.playbackSpeed;
		if (
			globalState.currentProject?.projectEditorState.currentTab !==
			ProjectEditorTabs.SubtitlesEditor
		) {
			speed = 1; // Réinitialise la vitesse si on n'est pas dans l'éditeur de sous-titres
		}
		return speed;
	}

	onDestroy(() => {
		pause(); // Met en pause la lecture pour éviter les fuites de mémoire

		// Enlève tout les shortcuts enregistrés
		ShortcutService.unregisterShortcut(SHORTCUTS.VIDEO_PREVIEW.PLAY_PAUSE);
		ShortcutService.unregisterShortcut(SHORTCUTS.VIDEO_PREVIEW.MOVE_FORWARD);
		ShortcutService.unregisterShortcut(SHORTCUTS.VIDEO_PREVIEW.MOVE_BACKWARD);
		ShortcutService.unregisterShortcut(SHORTCUTS.VIDEO_PREVIEW.INCREASE_SPEED);
	});

	// Effect pour s'assurer que l'événement ontimeupdate est toujours assigné à l'élément vidéo
	$effect(() => {
		if (videoElement) {
			videoElement.ontimeupdate = handleVideoTimeUpdate;
		}
	});

	/**
	 * Force le déclenchement de la synchronisation en modifiant movePreviewTo
	 * Trick pour déclencher l'effect de synchronisation
	 */
	function triggerVideoAndAudioToFitCursor() {
		getTimelineSettings().movePreviewTo = getTimelineSettings().cursorPosition + 1;
	}

	// === GESTION DES MISES À JOUR DE TEMPS ===

	/**
	 * Gestionnaire principal pour les mises à jour du curseur de la timeline
	 * Priorité à l'audio si disponible, sinon utilise la vidéo
	 */
	function handleVideoTimeUpdate() {
		if (audioUpdateInterval) {
			// Si on a un intervalle de mise à jour audio, on l'utilise car plus précis
			handleAudioTimeUpdate();
			return;
		}

		// Utilise la vidéo pour mettre à jour le curseur de la timeline
		if (videoElement && videoElement.currentTime !== undefined && isPlaying) {
			const currentVideoClip = globalState.getVideoTrack.getCurrentClip();

			if (currentVideoClip) {
				// La position du curseur = début du clip + temps écoulé dans la vidéo (en ms)
				const absolutePosition = currentVideoClip.startTime + videoElement.currentTime * 1000;
				getTimelineSettings().cursorPosition = absolutePosition;
			}
		}
	}

	/**
	 * Met à jour le curseur de la timeline basé sur la position de l'audio
	 * Plus précis que la vidéo pour la synchronisation
	 */
	function handleAudioTimeUpdate() {
		if (audioHowl && isPlaying) {
			const currentAudioClip = globalState.getAudioTrack?.getCurrentClip();

			if (currentAudioClip) {
				// .seek() retourne la position en secondes, on la convertit en ms
				const audioPositionMs = audioHowl.seek() * 1000;
				const absolutePosition = currentAudioClip.startTime + audioPositionMs;
				getTimelineSettings().cursorPosition = absolutePosition;
			}
		}
	}

	// === GESTION DU REDIMENSIONNEMENT ===

	/**
	 * Redimensionne la vidéo pour qu'elle s'adapte au conteneur sans déformation
	 * Utilise un système de mise à l'échelle avec ratio préservé
	 */
	function resizeVideoToFitScreen() {
		const previewContainer = document.getElementById('preview-container');
		const preview = document.getElementById('preview');

		if (previewContainer && preview) {
			// Configuration initiale : taille fixe 1920x1080 pour éviter les effets bizarres au chargement
			preview.style.width = '1920px';
			preview.style.height = '1080px';
			preview.style.minWidth = '1920px';
			preview.style.minHeight = '1080px';

			// Configuration du conteneur
			previewContainer.style.width = 'auto';
			previewContainer.style.height = 'calc(100%)';

			// Reset des transformations précédentes
			previewContainer.style.position = 'relative';
			previewContainer.style.zIndex = '0';
			previewContainer.style.transform = 'none';
			previewContainer.style.top = '0';
			previewContainer.style.left = '0';

			// Calcul des ratios pour le redimensionnement proportionnel
			const containerWidth = previewContainer.clientWidth;
			const containerHeight = previewContainer.clientHeight;
			const videoWidth = preview.clientWidth;
			const videoHeight = preview.clientHeight;
			const widthRatio = containerWidth / videoWidth;
			const heightRatio = containerHeight / videoHeight;

			// Utilise le plus petit ratio pour éviter l'étirement (letterboxing/pillarboxing)
			const scale = Math.min(widthRatio, heightRatio);

			// Application de la mise à l'échelle
			preview.style.transform = `scale(${scale})`;

			// Ajustement de la taille du conteneur à la nouvelle taille mise à l'échelle
			previewContainer.style.width = `${videoWidth * scale}px`;
			previewContainer.style.height = `${videoHeight * scale}px`;

			// Centrage horizontal et vertical du conteneur
			previewContainer.style.left = '50%';
			previewContainer.style.transform = 'translateX(-50%)';
			previewContainer.style.top = '50%';
			previewContainer.style.transform += ' translateY(-50%)';
		}
	}

	// === GESTION AUDIO AVEC HOWLER ===
	let audioHowl: Howl | null = null; // Instance Howler pour la lecture audio
	let isPlaying = $state(false); // État de lecture global
	let audioUpdateInterval: number | null = null; // Intervalle pour la mise à jour du curseur audio
	let audioSpeed = $state(1); // Vitesse de lecture audio
	let currentlyPlayingAudio: string = ''; // L'asset audio actuellement joué

	function togglePlayPause() {
		if (isPlaying) {
			pause();
		} else {
			play(true);
		}
	}

	/**
	 * Configure et initialise l'instance Howler pour l'audio actuel
	 */
	function setupAudio() {
		const audioAsset = currentAudio();

		// Nettoyage de l'instance précédente
		if (audioHowl) {
			audioHowl.unload();
			audioHowl = null;
		}
		if (audioUpdateInterval) {
			clearInterval(audioUpdateInterval);
			audioUpdateInterval = null;
		}

		if (audioAsset) {
			currentlyPlayingAudio = audioAsset.filePath; // Met à jour l'asset actuellement joué

			audioHowl = new Howl({
				src: [convertFileSrc(audioAsset.filePath)],
				html5: true, // Important pour les gros fichiers et le VBR (Variable Bit Rate)
				rate: audioSpeed, // Vitesse de lecture initiale
				onplay: () => {
					// Synchronise la position dans l'audio avec la position du curseur
					seekAudio(getCurrentAudioTimeToPlay());

					// Démarre la mise à jour régulière du curseur
					if (!audioUpdateInterval) {
						audioUpdateInterval = setInterval(handleAudioTimeUpdate, 10); // Mise à jour toutes les 10ms
					}
				},
				onpause: () => {
					// Arrête la mise à jour du curseur lors de la pause
					if (audioUpdateInterval) {
						clearInterval(audioUpdateInterval);
						audioUpdateInterval = null;
					}
				},
				onend: () => {
					// Nettoyage et passage au média suivant quand l'audio se termine
					if (audioUpdateInterval) {
						clearInterval(audioUpdateInterval);
						audioUpdateInterval = null;
					}
					goNextAudio();
				}
			});
		}
	}

	// === CONTRÔLES DE LECTURE ===

	/**
	 * Joue l'audio silencieux quand aucun média n'est disponible
	 * Simule la présence d'un asset et clip pour le bon fonctionnement
	 */
	function playSilentAudio() {
		// Nettoie l'instance audio précédente
		if (audioHowl) {
			audioHowl.unload();
			audioHowl = null;
		}

		// Crée une nouvelle instance Howl pour silent.ogg
		audioHowl = new Howl({
			src: ['/silent.ogg'], // Chemin vers le fichier silent.ogg dans static/
			html5: true,
			loop: true, // Répète en boucle pour simuler une lecture continue
			volume: 0, // Volume à 0 pour être réellement silencieux
			onplay: () => {
				isPlaying = true;
				globalState.currentProject!.projectEditorState.videoPreview.isPlaying = true;

				// Démarre la mise à jour du curseur
				if (!audioUpdateInterval) {
					audioUpdateInterval = setInterval(() => {
						// Avance le curseur manuellement de 10ms à chaque intervalle
						getTimelineSettings().cursorPosition += 10;
					}, 10);
				}
			},
			onpause: () => {
				// Arrête la mise à jour du curseur
				if (audioUpdateInterval) {
					clearInterval(audioUpdateInterval);
					audioUpdateInterval = null;
				}
			}
		});

		audioHowl.play();
	}

	/**
	 * Lance la lecture audio et vidéo
	 * @param fromButton - Indique si l'action vient du bouton play (pour afficher un toast si nécessaire)
	 */
	function play(fromButton: boolean = false) {
		// Vérification de la présence de médias
		if (!currentVideo() && !currentAudio()) {
			// Si aucun média, joue silent.ogg pour simuler une lecture
			playSilentAudio();
			return;
		}

		isPlaying = true;
		globalState.currentProject!.projectEditorState.videoPreview.isPlaying = true;

		// Lance la lecture audio et vidéo simultanément
		if (audioHowl) {
			audioHowl.play();
		}
		if (videoElement) {
			videoElement.play();
		}
	}

	/**
	 * Met en pause la lecture audio et vidéo
	 */
	function pause() {
		isPlaying = false;
		globalState.currentProject!.projectEditorState.videoPreview.isPlaying = false;

		// Pause audio et vidéo
		if (audioHowl) {
			audioHowl.pause();
		}
		if (videoElement) {
			videoElement.pause();
		}

		// Prépare la synchronisation pour la prochaine lecture
		getTimelineSettings().movePreviewTo = getTimelineSettings().cursorPosition;

		// Arrête la mise à jour du curseur audio
		if (audioUpdateInterval) {
			clearInterval(audioUpdateInterval);
			audioUpdateInterval = null;
		}
	}

	/**
	 * Navigue vers une position spécifique dans l'audio
	 * @param val - Position en secondes
	 */
	function seekAudio(val: number) {
		if (audioHowl) {
			audioHowl.seek(val);
		}
	}

	// === NAVIGATION ENTRE MÉDIAS ===
	/**
	 * Passe au prochain média quand une vidéo se termine
	 */
	function goNextVideo() {
		const currentTime = getTimelineSettings().cursorPosition;
		const videoTrack = globalState.getVideoTrack;

		// Cherche la prochaine vidéo uniquement
		if (videoTrack) {
			const nextVideoClip = videoTrack.clips.find((clip) => clip.startTime > currentTime - 1000);
			if (nextVideoClip) {
				// Avance le curseur au début de la prochaine vidéo
				getTimelineSettings().cursorPosition = nextVideoClip.startTime;
				triggerVideoAndAudioToFitCursor();
			}
			// Si aucune prochaine vidéo, ne fait rien (continue avec fond noir)
		}
	}

	/**
	 * Passe au prochain média quand un audio se termine
	 */
	function goNextAudio() {
		goToNextMedia(false, true);
	}

	/**
	 * Trouve et navigue vers le prochain média dans la timeline
	 * @param video - Inclure les pistes vidéo dans la recherche
	 * @param audio - Inclure les pistes audio dans la recherche
	 */
	function goToNextMedia(video: boolean = true, audio: boolean = true) {
		const currentTime = getTimelineSettings().cursorPosition;

		// Récupération des pistes vidéo et audio
		const videoTrack = globalState.getVideoTrack;
		const audioTrack = globalState.getAudioTrack;

		const nextClips: { clip: any; startTime: number }[] = [];

		// Recherche du prochain clip vidéo
		if (videoTrack && video) {
			const nextVideoClip = videoTrack.clips.find((clip) => clip.startTime > currentTime - 1000);
			if (nextVideoClip) {
				nextClips.push({ clip: nextVideoClip, startTime: nextVideoClip.startTime });
			}
		}

		// Recherche du prochain clip audio
		if (audioTrack && audio) {
			const nextAudioClip = audioTrack.clips.find((clip) => clip.startTime > currentTime - 1000);
			if (nextAudioClip) {
				nextClips.push({ clip: nextAudioClip, startTime: nextAudioClip.startTime });
			}
		}
		if (nextClips.length > 0) {
			// Trouve le clip qui commence le plus tôt
			const earliestClip = nextClips.reduce((earliest, current) =>
				current.startTime < earliest.startTime ? current : earliest
			);

			// Avance le curseur au début du prochain clip
			getTimelineSettings().cursorPosition = earliestClip.startTime;
			triggerVideoAndAudioToFitCursor();
		} else if (audio && !video) {
			// Seulement si on cherche de l'audio ET qu'on n'en trouve pas, joue silent
			playSilentAudio();
		}
		// Sinon ne fait rien (cas vidéo qui se termine sans prochaine vidéo)
	}
</script>

<section
	class="overflow-hidden min-h-0"
	id="video-preview-section"
	style={showControls
		? `height: ${globalState.currentProject!.projectEditorState.upperSectionHeight}%;`
		: ''}
>
	<div
		class="w-full h-full flex flex-col relative overflow-hidden background-primary"
		id="preview-container"
	>
		<!-- Conteneur de la prévisualisation vidéo avec mise à l'échelle -->
		<div class={'relative origin-top-left bg-black'} id="preview">
			{#if currentVideo()}
				<video
					bind:this={videoElement}
					src={convertFileSrc(currentVideo()!.filePath)}
					muted
					onended={goNextVideo}
				></video>
			{/if}
		</div>
	</div>
</section>

{#if showControls}
	<VideoPreviewControlsBar {togglePlayPause} />
{/if}

<style>
	/* Styles pour assurer un dimensionnement correct */
	#preview-container {
		height: 100%;
		min-height: 0;
	}
	#preview {
		height: 100%;
		min-height: 0;
	}
	video {
		height: 100% !important;
		width: 100% !important;
		min-height: 0 !important;
		display: block;
	}
</style>
