<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, Plus, Trash2, Save, Eye, Download, Upload } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let deckName = '';
	let deckDescription = '';
	let mainDeck = [];
	let extraDeck = [];
	let sideDeck = [];
	let searchQuery = '';
	let searchResults = [];
	let activeTab = 'main';
	let showSearch = false;

	$: mainDeckCount = mainDeck.length;
	$: extraDeckCount = extraDeck.length;
	$: sideDeckCount = sideDeck.length;
	$: totalCards = mainDeckCount + extraDeckCount + sideDeckCount;
	$: isValidDeck = mainDeckCount >= 40 && mainDeckCount <= 60 && extraDeckCount <= 15 && sideDeckCount <= 15;

	async function searchCards(query) {
		if (!query || query.length < 2) {
			searchResults = [];
			return;
		}
		
		try {
			const response = await fetch(`/api/cards?search=${encodeURIComponent(query)}`);
			const result = await response.json();
			searchResults = result.cards || [];
		} catch (err) {
			console.error('Error searching cards:', err);
		}
	}

	function addCardToDeck(card, location) {
		const cardData = {
			id: card.id,
			name: card.name,
			image: card.cardImages?.find(img => img.imageType === 'small')?.imageUrl,
			type: card.type,
		};

		if (location === 'main' && mainDeckCount < 60) {
			mainDeck = [...mainDeck, cardData];
		} else if (location === 'extra' && extraDeckCount < 15) {
			extraDeck = [...extraDeck, cardData];
		} else if (location === 'side' && sideDeckCount < 15) {
			sideDeck = [...sideDeck, cardData];
		}
	}

	function removeCardFromDeck(index, location) {
		if (location === 'main') {
			mainDeck = mainDeck.filter((_, i) => i !== index);
		} else if (location === 'extra') {
			extraDeck = extraDeck.filter((_, i) => i !== index);
		} else if (location === 'side') {
			sideDeck = sideDeck.filter((_, i) => i !== index);
		}
	}

	async function saveDeck() {
		if (!deckName.trim()) {
			alert('Please enter a deck name');
			return;
		}

		try {
			const response = await fetch('/api/decks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: deckName,
					description: deckDescription,
					mainDeck,
					extraDeck,
					sideDeck,
				}),
			});

			if (response.ok) {
				alert('Deck saved successfully!');
				goto('/decks');
			} else {
				alert('Error saving deck');
			}
		} catch (err) {
			console.error('Error saving deck:', err);
			alert('Error saving deck');
		}
	}

	function getCardCount(cardId, deck) {
		return deck.filter(c => c.id === cardId).length;
	}
</script>

<svelte:head>
	<title>Deck Builder - Yu-Gi-Oh! Deck Builder</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Deck Builder</h1>
			<p class="text-muted-foreground">Create and customize your Yu-Gi-Oh! deck</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline">
				<Download class="mr-2 h-4 w-4" />
				Import
			</Button>
			<Button variant="outline">
				<Upload class="mr-2 h-4 w-4" />
				Export
			</Button>
			<Button on:click={saveDeck} disabled={!isValidDeck}>
				<Save class="mr-2 h-4 w-4" />
				Save Deck
			</Button>
		</div>
	</div>

	<!-- Deck Info -->
	<Card class="p-4">
		<div class="grid gap-3 md:grid-cols-2">
			<div>
				<label for="deck-name" class="mb-1 block text-sm font-medium">Deck Name</label>
				<Input 
					id="deck-name"
					bind:value={deckName} 
					placeholder="Enter deck name..." 
				/>
			</div>
			<div>
				<label for="deck-description" class="mb-1 block text-sm font-medium">Description (Optional)</label>
				<Input 
					id="deck-description"
					bind:value={deckDescription} 
					placeholder="Deck description..." 
				/>
			</div>
		</div>
	</Card>

	<!-- Deck Stats -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<Card class="p-3 text-center {mainDeckCount < 40 || mainDeckCount > 60 ? 'border-red-500' : 'border-green-500'} border-2">
			<div class="text-2xl font-bold {mainDeckCount >= 40 && mainDeckCount <= 60 ? 'text-green-600' : 'text-red-600'}">
				{mainDeckCount}
			</div>
			<div class="text-sm text-muted-foreground">Main Deck</div>
			<div class="text-xs text-muted-foreground">(40-60)</div>
		</Card>
		<Card class="p-3 text-center {extraDeckCount > 15 ? 'border-red-500' : 'border-green-500'} border-2">
			<div class="text-2xl font-bold {extraDeckCount <= 15 ? 'text-green-600' : 'text-red-600'}">
				{extraDeckCount}
			</div>
			<div class="text-sm text-muted-foreground">Extra Deck</div>
			<div class="text-xs text-muted-foreground">(0-15)</div>
		</Card>
		<Card class="p-3 text-center {sideDeckCount > 15 ? 'border-red-500' : 'border-green-500'} border-2">
			<div class="text-2xl font-bold {sideDeckCount <= 15 ? 'text-green-600' : 'text-red-600'}">
				{sideDeckCount}
			</div>
			<div class="text-sm text-muted-foreground">Side Deck</div>
			<div class="text-xs text-muted-foreground">(0-15)</div>
		</Card>
		<Card class="p-3 text-center">
			<div class="text-2xl font-bold text-primary">{totalCards}</div>
			<div class="text-sm text-muted-foreground">Total Cards</div>
		</Card>
	</div>

	{#if !isValidDeck}
		<Card class="border-amber-500 bg-amber-50 p-3 dark:bg-amber-950">
			<p class="text-sm text-amber-800 dark:text-amber-200">
				⚠️ Main deck must contain 40-60 cards
			</p>
		</Card>
	{/if}

	<!-- Search Cards -->
	<Card class="p-4">
		<div class="flex gap-2">
			<div class="flex-1">
				<Input
					type="search"
					placeholder="Search cards to add..."
					bind:value={searchQuery}
					on:input={() => searchCards(searchQuery)}
					on:focus={() => showSearch = true}
					on:blur={() => setTimeout(() => showSearch = false, 200)}
				/>
			</div>
		</div>

		{#if showSearch && searchResults.length > 0}
			<div class="mt-2 max-h-60 overflow-y-auto rounded-lg border bg-background p-2">
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
					{#each searchResults as result}
						<div class="space-y-1">
							<button 
								class="block w-full"
								on:click={() => addCardToDeck(result, activeTab)}
							>
								<div class="aspect-[2/3] overflow-hidden rounded">
									<img 
										src={result.cardImages?.find(img => img.imageType === 'small')?.imageUrl} 
										alt={result.name}
										class="h-full w-full object-cover"
									/>
								</div>
							</button>
							<p class="line-clamp-1 text-xs font-medium">{result.name}</p>
							<div class="flex gap-1">
								<Button size="sm" variant="ghost" class="h-5 w-full p-0 text-xs"
									on:click={() => addCardToDeck(result, 'main')}>Main</Button>
								<Button size="sm" variant="ghost" class="h-5 w-full p-0 text-xs"
									on:click={() => addCardToDeck(result, 'extra')}>Extra</Button>
								<Button size="sm" variant="ghost" class="h-5 w-full p-0 text-xs"
									on:click={() => addCardToDeck(result, 'side')}>Side</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</Card>

	<!-- Deck Tabs -->
	<Card>
		<div class="border-b">
			<div class="flex gap-2 p-4">
				<Button 
					variant={activeTab === 'main' ? 'default' : 'ghost'}
					on:click={() => activeTab = 'main'}
				>
					Main Deck ({mainDeckCount})
				</Button>
				<Button 
					variant={activeTab === 'extra' ? 'default' : 'ghost'}
					on:click={() => activeTab = 'extra'}
				>
					Extra Deck ({extraDeckCount})
				</Button>
				<Button 
					variant={activeTab === 'side' ? 'default' : 'ghost'}
					on:click={() => activeTab = 'side'}
				>
					Side Deck ({sideDeckCount})
				</Button>
			</div>
		</div>

		<!-- Deck Content -->
		<div class="min-h-[400px] p-4">
			{#if activeTab === 'main' && mainDeck.length === 0}
				<div class="flex h-64 flex-col items-center justify-center text-muted-foreground">
					<Plus class="mb-2 h-12 w-12 opacity-50" />
					<p>Search and add cards to your main deck</p>
				</div>
			{:else if activeTab === 'extra' && extraDeck.length === 0}
				<div class="flex h-64 flex-col items-center justify-center text-muted-foreground">
					<Plus class="mb-2 h-12 w-12 opacity-50" />
					<p>Search and add cards to your extra deck</p>
				</div>
			{:else if activeTab === 'side' && sideDeck.length === 0}
				<div class="flex h-64 flex-col items-center justify-center text-muted-foreground">
					<Plus class="mb-2 h-12 w-12 opacity-50" />
					<p>Search and add cards to your side deck</p>
				</div>
			{:else}
				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
					{#each (activeTab === 'main' ? mainDeck : activeTab === 'extra' ? extraDeck : sideDeck) as card, index}
						<div class="group relative">
							<img 
								src={card.image} 
								alt={card.name}
								class="aspect-[2/3] rounded object-cover"
							/>
							<button 
								class="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/90 group-hover:opacity-100"
								on:click={() => removeCardFromDeck(index, activeTab)}
							>
								<Trash2 class="h-3 w-3" />
							</button>
							<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
								<p class="line-clamp-1 text-xs text-white">{card.name}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</Card>
</div>
