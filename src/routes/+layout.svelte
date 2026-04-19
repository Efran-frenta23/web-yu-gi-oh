<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/layout/Navbar.svelte';
</script>

<div class="min-h-screen bg-background">
	<Navbar />
	<main class="container mx-auto px-4 py-8">
		<slot />
	</main>
	<footer class="border-t bg-card py-6">
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			<p>Yu-Gi-Oh! Deck Builder - Card data provided by YGOProDeck API</p>
		</div>
	</footer>
</div>
