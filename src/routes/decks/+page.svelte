<script lang="ts">
	import type { PageData } from './$types';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Swords, Eye, Trash2, Edit } from 'lucide-svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>Decks - Yu-Gi-Oh! Deck Builder</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">My Decks</h1>
			<p class="text-muted-foreground">Browse and manage your saved decks</p>
		</div>
		<Button asChild>
			<a href="/decks/builder">
				<Plus class="mr-2 h-4 w-4" />
				Create New Deck
			</a>
		</Button>
	</div>

	<!-- Decks Grid -->
	{#if data.decks && data.decks.length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.decks as deck}
				<Card class="p-4">
					<div class="mb-3">
						<h3 class="text-lg font-semibold">{deck.name}</h3>
						{#if deck.description}
							<p class="line-clamp-2 text-sm text-muted-foreground">{deck.description}</p>
						{/if}
					</div>

					<div class="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
						<div class="rounded bg-muted p-2">
							<div class="font-semibold">{deck.mainDeck?.length || 0}</div>
							<div class="text-xs text-muted-foreground">Main</div>
						</div>
						<div class="rounded bg-muted p-2">
							<div class="font-semibold">{deck.extraDeck?.length || 0}</div>
							<div class="text-xs text-muted-foreground">Extra</div>
						</div>
						<div class="rounded bg-muted p-2">
							<div class="font-semibold">{deck.sideDeck?.length || 0}</div>
							<div class="text-xs text-muted-foreground">Side</div>
						</div>
					</div>

					<div class="mb-3 text-xs text-muted-foreground">
						Created: {new Date(deck.createdAt).toLocaleDateString()}
					</div>

					<div class="flex gap-2">
						<Button variant="outline" size="sm" class="flex-1">
							<Eye class="mr-1 h-3 w-3" />
							View
						</Button>
						<Button variant="outline" size="sm" class="flex-1">
							<Edit class="mr-1 h-3 w-3" />
							Edit
						</Button>
						<Button variant="destructive" size="sm">
							<Trash2 class="h-3 w-3" />
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	{:else}
		<Card class="p-12">
			<div class="flex flex-col items-center justify-center text-center">
				<Swords class="mb-4 h-16 w-16 text-muted-foreground" />
				<h2 class="mb-2 text-2xl font-semibold">No Decks Yet</h2>
				<p class="mb-4 text-muted-foreground">Create your first deck to get started!</p>
				<Button asChild>
					<a href="/decks/builder">
						<Plus class="mr-2 h-4 w-4" />
						Create Deck
					</a>
				</Button>
			</div>
		</Card>
	{/if}
</div>
