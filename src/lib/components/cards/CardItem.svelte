<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let card: {
		id: number;
		name: string;
		type: string;
		frameType: string;
		desc: string;
		race: string;
		archetype?: string | null;
		atk?: number | null;
		def?: number | null;
		level?: number | null;
		attribute?: string | null;
		cardImages: { imageUrl: string; imageType: string }[];
	};

	export let size: 'small' | 'medium' | 'large' = 'medium';

	$: cardImage = card.cardImages?.find(img => img.imageType === 'small')?.imageUrl || '/placeholder-card.png';
	$: isMonster = card.type.includes('Monster');
	$: isSpell = card.type.includes('Spell');
	$: isTrap = card.type.includes('Trap');

	$: frameColor = isMonster 
		? 'border-amber-400' 
		: isSpell 
			? 'border-emerald-400' 
			: 'border-purple-400';

	$: stars = Array(card.level || 0).fill('⭐').join('');

	function getAttributeColor(attr: string): string {
		const colors: Record<string, string> = {
			'DARK': '#8b5cf6',
			'LIGHT': '#fbbf24',
			'FIRE': '#ef4444',
			'WATER': '#3b82f6',
			'WIND': '#10b981',
			'EARTH': '#854d0e',
			'DIVINE': '#ec4899'
		};
		return colors[attr] || '#6b7280';
	}
</script>

<a href="/cards/{card.id}" class="block transition-transform hover:scale-105">
	<Card class="overflow-hidden {frameColor} border-2">
		<!-- Card Image -->
		<div class="relative aspect-[2/3] overflow-hidden bg-gray-900">
			<img src={cardImage} alt={card.name} class="h-full w-full object-cover" loading="lazy" />
			{#if card.level}
				<div class="absolute top-1 right-1 flex gap-0.5">
					{#each Array(Math.min(card.level, 12)) as _}
						<div class="h-2 w-2 rounded-full bg-yellow-400"></div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Card Info -->
		<div class="p-2">
			<h3 class="line-clamp-1 text-xs font-semibold">{card.name}</h3>
			
			{#if isMonster}
				<div class="mt-1 space-y-1">
					{#if card.attribute || card.level}
						<div class="flex items-center gap-1 text-xs text-muted-foreground">
							{#if card.attribute}
								<span class="font-medium" style="color: {getAttributeColor(card.attribute)}">
									{card.attribute}
								</span>
							{/if}
							{#if card.level}
								<span>•</span>
								<span>Level {card.level}</span>
							{/if}
						</div>
					{/if}
					
					{#if card.atk !== null || card.def !== null}
						<div class="flex gap-2 text-xs font-medium">
							{#if card.atk !== null}
								<span class="text-primary">ATK/{card.atk}</span>
							{/if}
							{#if card.def !== null}
								<span class="text-primary">DEF/{card.def}</span>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			{#if card.archetype}
				<Badge variant="secondary" class="mt-1 text-[10px]">
					{card.archetype}
				</Badge>
			{/if}
		</div>
	</Card>
</a>
