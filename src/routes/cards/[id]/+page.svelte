<script lang="ts">
	import type { PageData } from './$types';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Swords, Shield, Star, BookOpen, DollarSign } from 'lucide-svelte';

	export let data: PageData;

	$: card = data.card;
	$: cardImage = card?.cardImages?.find(img => img.imageType === 'large')?.imageUrl || 
	                card?.cardImages?.find(img => img.imageType === 'small')?.imageUrl || 
	                '/placeholder-card.png';
	$: isMonster = card?.type.includes('Monster');
	$: isSpell = card?.type.includes('Spell');
	$: isTrap = card?.type.includes('Trap');

	$: borderColor = isMonster 
		? 'border-amber-400' 
		: isSpell 
			? 'border-emerald-400' 
			: 'border-purple-400';

	function getAttributeColor(attr: string | null): string {
		const colors: Record<string, string> = {
			'DARK': '#8b5cf6',
			'LIGHT': '#fbbf24',
			'FIRE': '#ef4444',
			'WATER': '#3b82f6',
			'WIND': '#10b981',
			'EARTH': '#854d0e',
			'DIVINE': '#ec4899'
		};
		return colors[attr || ''] || '#6b7280';
	}
</script>

<svelte:head>
	<title>{card?.name || 'Card Detail'} - Yu-Gi-Oh! Deck Builder</title>
</svelte:head>

{#if card}
	<div class="space-y-6">
		<!-- Back Button -->
		<Button variant="ghost" asChild>
			<a href="/cards">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Cards
			</a>
		</Button>

		<div class="grid gap-6 md:grid-cols-3">
			<!-- Card Image -->
			<div class="md:col-span-1">
				<Card class="sticky top-24 overflow-hidden {borderColor} border-2">
					<div class="aspect-[2/3] overflow-hidden bg-gray-900">
						<img src={cardImage} alt={card.name} class="h-full w-full object-cover" />
					</div>
				</Card>
			</div>

			<!-- Card Info -->
			<div class="space-y-4 md:col-span-2">
				<Card class="p-6">
					<div class="mb-4">
						<div class="flex items-start justify-between">
							<div>
								<h1 class="text-3xl font-bold">{card.name}</h1>
								<Badge variant="outline" class="mt-2">{card.type}</Badge>
							</div>
							<div class="text-right">
								{#if card.attribute}
									<Badge 
										variant="outline" 
										class="text-lg font-semibold"
										style="color: {getAttributeColor(card.attribute)}; border-color: {getAttributeColor(card.attribute)}"
									>
										{card.attribute}
									</Badge>
								{/if}
							</div>
						</div>
					</div>

					<!-- Monster Stats -->
					{#if isMonster}
						<div class="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
							{#if card.level}
								<div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Star class="h-4 w-4" />
										Level
									</div>
									<div class="text-lg font-semibold">{card.level}</div>
								</div>
							{/if}
							{#if card.race}
								<div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<BookOpen class="h-4 w-4" />
										Type
									</div>
									<div class="text-lg font-semibold">{card.race}</div>
								</div>
							{/if}
							{#if card.atk !== null}
								<div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Swords class="h-4 w-4" />
										ATK
									</div>
									<div class="text-lg font-semibold text-primary">{card.atk}</div>
								</div>
							{/if}
							{#if card.def !== null}
								<div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Shield class="h-4 w-4" />
										DEF
									</div>
									<div class="text-lg font-semibold text-primary">{card.def}</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if !isMonster}
						<div class="mb-4 rounded-lg bg-muted p-4">
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<BookOpen class="h-4 w-4" />
								Card Type
							</div>
							<div class="text-lg font-semibold">{card.race}</div>
						</div>
					{/if}

					<!-- Description -->
					<div class="mb-4">
						<h3 class="mb-2 font-semibold">Card Text</h3>
						<p class="whitespace-pre-line rounded-lg bg-muted p-4 text-sm">{card.desc}</p>
					</div>

					<!-- Archetype -->
					{#if card.archetype}
						<div>
							<h3 class="mb-2 font-semibold">Archetype</h3>
							<Badge variant="secondary" class="text-base">
								<BookOpen class="mr-1 h-4 w-4" />
								{card.archetype}
							</Badge>
						</div>
					{/if}
				</Card>

				<!-- Prices -->
				{#if data.cardPrice}
					<Card class="p-6">
						<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
							<DollarSign class="h-5 w-5" />
							Card Prices
						</h2>
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							<div class="rounded-lg border p-3">
								<div class="text-sm text-muted-foreground">Cardmarket</div>
								<div class="text-xl font-bold text-primary">
									{data.cardPrice.cardmarket > 0 ? `$${data.cardPrice.cardmarket.toFixed(2)}` : 'N/A'}
								</div>
							</div>
							<div class="rounded-lg border p-3">
								<div class="text-sm text-muted-foreground">TCGPlayer</div>
								<div class="text-xl font-bold text-primary">
									{data.cardPrice.tcgplayer > 0 ? `$${data.cardPrice.tcgplayer.toFixed(2)}` : 'N/A'}
								</div>
							</div>
							<div class="rounded-lg border p-3">
								<div class="text-sm text-muted-foreground">eBay</div>
								<div class="text-xl font-bold text-primary">
									{data.cardPrice.ebay > 0 ? `$${data.cardPrice.ebay.toFixed(2)}` : 'N/A'}
								</div>
							</div>
							<div class="rounded-lg border p-3">
								<div class="text-sm text-muted-foreground">Amazon</div>
								<div class="text-xl font-bold text-primary">
									{data.cardPrice.amazon > 0 ? `$${data.cardPrice.amazon.toFixed(2)}` : 'N/A'}
								</div>
							</div>
							<div class="rounded-lg border p-3">
								<div class="text-sm text-muted-foreground">CoolStuffInc</div>
								<div class="text-xl font-bold text-primary">
									{data.cardPrice.coolstuffinc > 0 ? `$${data.cardPrice.coolstuffinc.toFixed(2)}` : 'N/A'}
								</div>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Related Cards (Same Archetype) -->
				{#if data.relatedCards && data.relatedCards.length > 0}
					<Card class="p-6">
						<h2 class="mb-4 text-xl font-semibold">Related Cards</h2>
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
							{#each data.relatedCards.slice(0, 8) as relatedCard}
								<a href="/cards/{relatedCard.id}" class="block">
									<Card class="overflow-hidden transition-shadow hover:shadow-md">
										<div class="aspect-[2/3] overflow-hidden bg-gray-900">
											<img 
												src={relatedCard.cardImages.find(img => img.imageType === 'small')?.imageUrl || '/placeholder-card.png'} 
												alt={relatedCard.name}
												class="h-full w-full object-cover"
												loading="lazy"
											/>
										</div>
										<div class="p-2">
											<p class="line-clamp-1 text-xs font-semibold">{relatedCard.name}</p>
											<p class="line-clamp-1 text-[10px] text-muted-foreground">{relatedCard.type}</p>
										</div>
									</Card>
								</a>
							{/each}
						</div>
					</Card>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-20">
		<h1 class="mb-2 text-4xl font-bold">Card Not Found</h1>
		<p class="mb-4 text-muted-foreground">The card you're looking for doesn't exist.</p>
		<Button asChild>
			<a href="/cards">Browse Cards</a>
		</Button>
	</div>
{/if}
