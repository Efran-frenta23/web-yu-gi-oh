<script lang="ts">
	import type { PageData } from './$types';
	import CardItem from '$lib/components/cards/CardItem.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Sword, Shield, Sparkles, BookOpen, Search, Layers } from 'lucide-svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>Yu-Gi-Oh! Deck Builder - Home</title>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 via-primary to-accent/90 p-8 text-primary-foreground md:p-12">
	<div class="absolute inset-0 opacity-10">
		<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent"></div>
		<div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white"></div>
	</div>
	
	<div class="relative z-10">
		<h1 class="mb-4 text-4xl font-bold md:text-5xl">
			Build Your Ultimate Deck
		</h1>
		<p class="mb-6 text-lg opacity-90 md:text-xl">
			Explore thousands of Yu-Gi-Oh! cards, build custom decks, and dominate your duels!
		</p>
		<div class="flex flex-wrap gap-3">
			<Button size="lg" variant="secondary" asChild>
				<a href="/cards">
					<Search class="mr-2 h-5 w-5" />
					Browse Cards
				</a>
			</Button>
			<Button size="lg" asChild>
				<a href="/decks">
					<Layers class="mr-2 h-5 w-5" />
					Create Deck
				</a>
			</Button>
		</div>
	</div>
</section>

<!-- Stats Section -->
<section class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
	<Card class="p-4 text-center">
		<div class="text-2xl font-bold text-primary">{data.stats.totalCards}</div>
		<div class="text-sm text-muted-foreground">Total Cards</div>
	</Card>
	<Card class="p-4 text-center">
		<div class="text-2xl font-bold text-accent">{data.stats.totalMonsters}</div>
		<div class="text-sm text-muted-foreground">Monster Cards</div>
	</Card>
	<Card class="p-4 text-center">
		<div class="text-2xl font-bold text-emerald-500">{data.stats.totalSpells}</div>
		<div class="text-sm text-muted-foreground">Spell Cards</div>
	</Card>
	<Card class="p-4 text-center">
		<div class="text-2xl font-bold text-purple-500">{data.stats.totalTraps}</div>
		<div class="text-sm text-muted-foreground">Trap Cards</div>
	</Card>
</section>

<!-- Featured Cards -->
<section class="mt-12">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold">Featured Cards</h2>
		<Button variant="ghost" asChild>
			<a href="/cards">View All →</a>
		</Button>
	</div>
	
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
		{#each data.featuredCards as card}
			<CardItem {card} size="small" />
		{/each}
	</div>
</section>

<!-- Card Types -->
<section class="mt-12">
	<h2 class="mb-6 text-2xl font-bold">Card Types</h2>
	<div class="grid gap-4 md:grid-cols-3">
		<a href="/cards?type=Monster" class="block">
			<Card class="p-6 transition-all hover:shadow-lg">
				<div class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
						<Sword class="h-6 w-6 text-amber-600" />
					</div>
					<div>
						<h3 class="font-semibold">Monster Cards</h3>
						<p class="text-sm text-muted-foreground">Normal, Effect, Ritual, Fusion, Synchro, Xyz, Pendulum, Link</p>
					</div>
				</div>
			</Card>
		</a>
		
		<a href="/cards?type=Spell" class="block">
			<Card class="p-6 transition-all hover:shadow-lg">
				<div class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
						<Sparkles class="h-6 w-6 text-emerald-600" />
					</div>
					<div>
						<h3 class="font-semibold">Spell Cards</h3>
						<p class="text-sm text-muted-foreground">Normal, Continuous, Quick-Play, Ritual, Field, Equip</p>
					</div>
				</div>
			</Card>
		</a>
		
		<a href="/cards?type=Trap" class="block">
			<Card class="p-6 transition-all hover:shadow-lg">
				<div class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
						<Shield class="h-6 w-6 text-purple-600" />
					</div>
					<div>
						<h3 class="font-semibold">Trap Cards</h3>
						<p class="text-sm text-muted-foreground">Normal, Continuous, Counter</p>
					</div>
				</div>
			</Card>
		</a>
	</div>
</section>

<!-- Popular Archetypes -->
<section class="mt-12">
	<h2 class="mb-6 text-2xl font-bold">Popular Archetypes</h2>
	<div class="flex flex-wrap gap-2">
		{#each data.popularArchetypes as archetype}
			<Badge variant="outline" class="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
				<BookOpen class="mr-1 h-3 w-3" />
				<a href="/cards?archetype={archetype}">{archetype}</a>
			</Badge>
		{/each}
	</div>
</section>
