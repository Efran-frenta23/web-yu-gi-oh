<script lang="ts">
	import type { PageData } from './$types';
	import CardItem from '$lib/components/cards/CardItem.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	export let data: PageData;

	let searchQuery = data.search || '';
	let selectedType = data.type || '';
	let selectedAttribute = data.attribute || '';
	let selectedArchetype = data.archetype || '';
	let selectedRace = data.race || '';
	let viewMode: 'grid' | 'list' = 'grid';
	let currentPage = data.page || 1;

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (selectedType) params.set('type', selectedType);
		if (selectedAttribute) params.set('attribute', selectedAttribute);
		if (selectedArchetype) params.set('archetype', selectedArchetype);
		if (selectedRace) params.set('race', selectedRace);
		params.set('page', '1');
		goto(`/cards?${params.toString()}`);
	}

	function goToPage(page: number) {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (selectedType) params.set('type', selectedType);
		if (selectedAttribute) params.set('attribute', selectedAttribute);
		if (selectedArchetype) params.set('archetype', selectedArchetype);
		if (selectedRace) params.set('race', selectedRace);
		params.set('page', page.toString());
		goto(`/cards?${params.toString()}`);
	}

	function clearFilters() {
		goto('/cards');
	}

	const hasActiveFilters = searchQuery || selectedType || selectedAttribute || selectedArchetype || selectedRace;
</script>

<svelte:head>
	<title>Card Database - Yu-Gi-Oh! Deck Builder</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold">Card Database</h1>
			<p class="text-muted-foreground">
				{data.totalCards} cards found
				{#if hasActiveFilters}
					(showing filtered results)
				{/if}
			</p>
		</div>

		<!-- View Toggle -->
		<div class="flex gap-2">
			<Button 
				variant={viewMode === 'grid' ? 'default' : 'outline'} 
				size="sm"
				on:click={() => viewMode = 'grid'}
			>
				<Grid class="h-4 w-4" />
			</Button>
			<Button 
				variant={viewMode === 'list' ? 'default' : 'outline'} 
				size="sm"
				on:click={() => viewMode = 'list'}
			>
				<List class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<!-- Search and Filters -->
	<Card class="p-4">
		<div class="space-y-4">
			<!-- Search Input -->
			<div class="flex gap-2">
				<div class="flex-1">
					<Input
						type="search"
						placeholder="Search by card name..."
						bind:value={searchQuery}
						on:keydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
				</div>
				<Button on:click={handleSearch}>
					<Search class="mr-2 h-4 w-4" />
					Search
				</Button>
				{#if hasActiveFilters}
					<Button variant="outline" on:click={clearFilters}>
						Clear All
					</Button>
				{/if}
			</div>

			<!-- Filter Dropdowns -->
			<div class="grid grid-cols-2 gap-3 md:grid-cols-5">
				<select 
					bind:value={selectedType}
					on:change={handleSearch}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">All Types</option>
					{#each data.cardTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>

				<select 
					bind:value={selectedAttribute}
					on:change={handleSearch}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">All Attributes</option>
					{#each data.attributes as attr}
						<option value={attr}>{attr}</option>
					{/each}
				</select>

				<select 
					bind:value={selectedRace}
					on:change={handleSearch}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">All Races</option>
					{#each data.races as race}
						<option value={race}>{race}</option>
					{/each}
				</select>

				<select 
					bind:value={selectedArchetype}
					on:change={handleSearch}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">All Archetypes</option>
					{#each data.archetypes.slice(0, 50) as arch}
						<option value={arch}>{arch}</option>
					{/each}
				</select>

				<Button variant="outline" on:click={handleSearch}>
					<Filter class="mr-2 h-4 w-4" />
					Apply Filters
				</Button>
			</div>

			<!-- Active Filters -->
			{#if hasActiveFilters}
				<div class="flex flex-wrap gap-2">
					{#if searchQuery}
						<Badge variant="secondary">
							Search: {searchQuery}
							<button class="ml-2" on:click={() => { searchQuery = ''; handleSearch(); }}>×</button>
						</Badge>
					{/if}
					{#if selectedType}
						<Badge variant="secondary">
							Type: {selectedType}
							<button class="ml-2" on:click={() => { selectedType = ''; handleSearch(); }}>×</button>
						</Badge>
					{/if}
					{#if selectedAttribute}
						<Badge variant="secondary">
							Attribute: {selectedAttribute}
							<button class="ml-2" on:click={() => { selectedAttribute = ''; handleSearch(); }}>×</button>
						</Badge>
					{/if}
					{#if selectedArchetype}
						<Badge variant="secondary">
							Archetype: {selectedArchetype}
							<button class="ml-2" on:click={() => { selectedArchetype = ''; handleSearch(); }}>×</button>
						</Badge>
					{/if}
					{#if selectedRace}
						<Badge variant="secondary">
							Race: {selectedRace}
							<button class="ml-2" on:click={() => { selectedRace = ''; handleSearch(); }}>×</button>
						</Badge>
					{/if}
				</div>
			{/if}
		</div>
	</Card>

	<!-- Cards Grid/List -->
	{#if viewMode === 'grid'}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each data.cards as card}
				<CardItem {card} size="medium" />
			{/each}
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.cards as card}
				<Card class="p-3">
					<a href="/cards/{card.id}" class="flex items-center gap-4">
						<img 
							src={card.cardImages.find(img => img.imageType === 'small')?.imageUrl || '/placeholder-card.png'} 
							alt={card.name}
							class="h-16 w-12 rounded object-cover"
						/>
						<div class="flex-1">
							<h3 class="font-semibold">{card.name}</h3>
							<p class="text-sm text-muted-foreground">{card.type}</p>
							<p class="line-clamp-1 text-sm text-muted-foreground">{card.desc}</p>
						</div>
						<div class="text-right">
							{#if card.atk !== null}
								<div class="text-sm font-medium">ATK/{card.atk}</div>
							{/if}
							{#if card.def !== null}
								<div class="text-sm text-muted-foreground">DEF/{card.def}</div>
							{/if}
						</div>
					</a>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			<Button 
				variant="outline" 
				size="sm" 
				disabled={currentPage <= 1}
				on:click={() => goToPage(currentPage - 1)}
			>
				<ChevronLeft class="h-4 w-4" />
				Previous
			</Button>

			<div class="flex gap-1">
				{#each Array(Math.min(data.totalPages, 10)) as _, i}
					{#if i + 1 === currentPage}
						<Button variant="default" size="sm">{i + 1}</Button>
					{:else if i + 1 <= 10}
						<Button variant="outline" size="sm" on:click={() => goToPage(i + 1)}>{i + 1}</Button>
					{/if}
				{/each}
				{#if data.totalPages > 10}
					<span class="px-2">...</span>
					<Button variant="outline" size="sm" on:click={() => goToPage(data.totalPages)}>
						{data.totalPages}
					</Button>
				{/if}
			</div>

			<Button 
				variant="outline" 
				size="sm" 
				disabled={currentPage >= data.totalPages}
				on:click={() => goToPage(currentPage + 1)}
			>
				Next
				<ChevronRight class="h-4 w-4" />
			</Button>
		</div>
	{/if}
</div>
