<script lang="ts">
	import { cn } from '$lib/utils';

	export let className = '';

	$: classes = cn('rounded-lg border bg-card text-card-foreground shadow-sm', className);
</script>

<div class={classes} {...$$restProps}>
	<slot />
</div>
