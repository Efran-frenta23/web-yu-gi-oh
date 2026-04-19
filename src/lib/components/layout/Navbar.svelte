<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Search } from 'lucide-svelte';
	import SearchBar from '$lib/components/layout/SearchBar.svelte';

	let scrolled = false;

	function handleScroll(event: Event) {
		scrolled = window.scrollY > 10;
	}
</script>

<svelte:window on:scroll={handleScroll} />

<nav class="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 {scrolled ? 'shadow-md' : ''}">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center gap-4">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
					<span class="text-lg font-bold text-white">Y</span>
				</div>
				<span class="hidden text-xl font-bold md:block">
					<span class="text-primary">Yu-Gi-Oh!</span>
					<span class="text-accent"> Deck Builder</span>
				</span>
			</a>

			<!-- Navigation Links -->
			<div class="flex items-center gap-2 ml-4">
				<Button variant="ghost" asChild>
					<a href="/">Home</a>
				</Button>
				<Button variant="ghost" asChild>
					<a href="/cards">Cards</a>
				</Button>
				<Button variant="ghost" asChild>
					<a href="/decks">Decks</a>
				</Button>
			</div>

			<!-- Search Bar -->
			<div class="flex-1">
				<SearchBar />
			</div>
		</div>
	</div>
</nav>
