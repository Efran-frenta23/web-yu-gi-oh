<script lang="ts">
	import { cn } from '$lib/utils';

	export let className = '';
	export let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' = 'default';

	$: classes = cn(
		'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
		variant === 'default' && 'bg-primary text-primary-foreground',
		variant === 'secondary' && 'bg-secondary text-secondary-foreground',
		variant === 'destructive' && 'bg-destructive text-destructive-foreground',
		variant === 'outline' && 'border border-input bg-background',
		variant === 'ghost' && 'text-muted-foreground',
		className
	);
</script>

<span class={classes} {...$$restProps}>
	<slot />
</span>
