<script lang="ts">
	type Props = {
		value: string;
		suggestions: string[];
		showEverything?: boolean;
		clearOnFocus?: boolean;
		placeholder?: string;
		maxlength?: number;
		label?: string;
		labelIcon?: string;
		icon: string;
		onEnterPress?: () => void;
	};

	let {
		value = $bindable(),
		suggestions,
		showEverything = false,
		clearOnFocus = false,
		placeholder = 'Start typing to search...',
		maxlength = NaN,
		label,
		labelIcon: icon,
		onEnterPress
	}: Props = $props();

	let filteredSuggestions: string[] = $state([]);
	let showSuggestions: boolean = $state(false);
	let selectedSuggestionIndex: number = $state(-1);
	function normalizeText(text: string): string {
		return text
			.toLowerCase()
			.replaceAll("'", '')
			.replaceAll(' ', '')
			.replaceAll('-', '')
			.replaceAll('.', '');
	}

	// Filter suggestions based on input
	function updateSuggestions() {
		if (!value.trim()) {
			if (showEverything) {
				filteredSuggestions = suggestions;
				showSuggestions = true;
				selectedSuggestionIndex = 0;
			} else {
				filteredSuggestions = [];
			}
			return;
		}

		const query = normalizeText(value);
		filteredSuggestions = suggestions.filter((s) => normalizeText(s).includes(query));

		showSuggestions = filteredSuggestions.length > 0;
		selectedSuggestionIndex = 0;
	}

	// Handle suggestion selection
	function selectSuggestion(suggestion: string) {
		value = suggestion;
		showSuggestions = false;
		selectedSuggestionIndex = 0;
	}

	// Handle keyboard navigation in suggestions
	function handleKeydown(event: KeyboardEvent) {
		if (!showSuggestions) {
			if (event.key === 'Enter' && onEnterPress) {
				onEnterPress();
			}
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedSuggestionIndex = Math.min(
					selectedSuggestionIndex + 1,
					filteredSuggestions.length - 1
				);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedSuggestionIndex >= 0) {
					selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
				} else if (onEnterPress) {
					onEnterPress();
				}
				break;
			case 'Escape':
				showSuggestions = false;
				selectedSuggestionIndex = -1;
				break;
		}
	}
</script>

<div class="space-y-2">
	{#if label}
		<label
			class="flex items-center gap-2 text-sm font-semibold text-primary"
			for="autocomplete-input"
		>
			{#if icon}
				<span class="material-icons text-accent-primary text-base">{icon}</span>
			{/if}
			{label}
		</label>
	{/if}

	<div class="relative">
		<input
			bind:value
			type="text"
			{maxlength}
			class="w-full"
			{placeholder}
			autocomplete="off"
			oninput={updateSuggestions}
			onkeydown={handleKeydown}
			onfocus={() => {
				if (clearOnFocus) {
					value = '';
				}
				updateSuggestions();
			}}
			onblur={() => {
				// Delay hiding to allow click on suggestions
				setTimeout(() => {
					showSuggestions = false;
				}, 150);
			}}
		/>

		{#if maxlength}
			<div class="absolute right-3 top-1/2 transform -translate-y-1/2">
				<span class="text-xs text-thirdly bg-bg-secondary px-2 py-1 rounded-md">
					{value.length}/{maxlength}
				</span>
			</div>
		{/if}
		<!-- Autocomplete Suggestions -->
		{#if showSuggestions && filteredSuggestions.length > 0}
			<div
				class="autocomplete-dropdown absolute top-full left-0 right-0 mt-1 bg-secondary border border-color rounded-lg shadow-2xl max-h-64 overflow-y-auto"
			>
				{#each filteredSuggestions as suggestion, index}
					<button
						class="w-full px-4 py-3 text-left hover:bg-accent transition-colors duration-200 flex items-center gap-3 border-b border-color last:border-b-0
						       {index === selectedSuggestionIndex ? 'bg-accent border-accent-primary' : ''}"
						onclick={() => selectSuggestion(suggestion)}
						type="button"
					>
						<span class="material-icons text-accent-primary text-sm">{icon}</span>
						<span class="text-primary font-medium">{suggestion}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Autocomplete suggestions styling */
	.autocomplete-dropdown {
		animation: slideDown 0.2s ease-out;
		z-index: 9999 !important;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Autocomplete scrollbar */
	.max-h-64::-webkit-scrollbar {
		width: 6px;
	}

	.max-h-64::-webkit-scrollbar-track {
		background: var(--bg-accent);
		border-radius: 3px;
	}

	.max-h-64::-webkit-scrollbar-thumb {
		background: var(--timeline-scrollbar);
		border-radius: 3px;
		transition: background 0.2s ease;
	}

	.max-h-64::-webkit-scrollbar-thumb:hover {
		background: var(--timeline-scrollbar-hover);
	}

	/* Override button hover for autocomplete suggestions */
	.autocomplete-dropdown button:hover {
		transform: none !important;
		box-shadow: none !important;
	}
</style>
