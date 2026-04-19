<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Search } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let searchTerm = '';

	function handleSearch(event: KeyboardEvent) {
		if (event.key === 'Enter' && searchTerm.trim()) {
			goto(`/cards?search=${encodeURIComponent(searchTerm.trim())}`);
		}
	}

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (searchTerm.trim()) {
			goto(`/cards?search=${encodeURIComponent(searchTerm.trim())}`);
		}
	}
</script>

<form on:submit={handleSubmit} class="relative">
	<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
	<Input
		type="search"
		bind:value={searchTerm}
		placeholder="Search cards..."
		class="pl-10"
		on:keydown={handleSearch}
	/>
</form>
