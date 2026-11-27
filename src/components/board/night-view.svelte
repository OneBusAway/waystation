<script>
	import * as t from '$lib/paraglide/messages.js';
	import { formatTime } from '$lib/formatters.js';
	import RouteBadge from '$components/board/route-badge.svelte';

	let { stopName = '', arrivals = [], now, hourCycle } = $props();

	const visible = $derived(arrivals.slice(0, 2));
</script>

<div class="night-view" data-testid="night-view">
	<div class="night-header">
		<span class="night-stop">{stopName}</span>
		<span class="night-clock mono">{formatTime(now, hourCycle)}</span>
	</div>

	{#if visible.length === 0}
		<div class="night-empty">{t.controller_unavailable()}</div>
	{:else}
		<ul class="night-list">
			{#each visible as a (a.tripId ?? a.route + a.departureAt)}
				<li class="night-row">
					<RouteBadge route={a.route} />
					<span class="night-dest display">{a.dest || a.name}</span>
					<span class="night-min">
						{#if a.min <= 0}
							<span class="night-num display">{t.board_now()}</span>
						{:else}
							<span class="night-num display">{a.min}</span>
							<small class="mono">{t.board_min()}</small>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.night-view {
		width: 1920px;
		height: 1080px;
		background: #000;
		color: #9aa0a6;
		display: flex;
		flex-direction: column;
		padding: 80px 120px;
		box-sizing: border-box;
	}
	.night-header {
		display: flex;
		justify-content: space-between;
		font-size: 48px;
		margin-bottom: 80px;
	}
	.night-list {
		list-style: none;
		margin: 0;
		/* Bottom padding offsets the header so the rows sit at the optical center. */
		padding: 0 0 128px;
		flex: 1;
		justify-content: center;
		display: flex;
		flex-direction: column;
		gap: 64px;
	}
	.night-row {
		display: flex;
		align-items: center;
		gap: 48px;
	}
	.night-dest {
		flex: 1;
		font-size: 96px;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.night-min {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.night-num {
		font-size: 140px;
		font-weight: 800;
		line-height: 1;
	}
	.night-min small {
		font-size: 44px;
		letter-spacing: 0.06em;
	}
	.night-empty {
		font-size: 72px;
		margin: auto;
	}
</style>
