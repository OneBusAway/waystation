<script>
	import * as t from '$lib/paraglide/messages.js';

	let { mode = 'connecting', rowCount = 4 } = $props();

	const ACCENTS = {
		connecting: 'var(--sched)',
		empty: 'var(--ontime)',
		stale: 'var(--late)',
		error: 'var(--late)'
	};

	const copy = $derived.by(() => {
		const m = mode in ACCENTS ? mode : 'connecting';
		return {
			kicker: t[`board_empty_${m}_kicker`](),
			head: t[`board_empty_${m}_head`](),
			sub: t[`board_empty_${m}_sub`](),
			chip: t[`board_empty_${m}_chip`](),
			accent: ACCENTS[m]
		};
	});

	const ticks = Array.from({ length: 60 }, (_, i) => i);
	const ghosts = $derived(Array.from({ length: rowCount }, (_, i) => i));
</script>

<div style:position="relative" style:min-height="0" style:height="100%">
	<div
		style:position="absolute"
		style:inset="0"
		style:display="grid"
		style:grid-template-rows="repeat({rowCount}, minmax(0, 1fr))"
		style:gap="6px"
		aria-hidden="true"
	>
		{#each ghosts as i (i)}
			<div style:border-bottom="1px dashed var(--rule)" style:opacity="0.5"></div>
		{/each}
	</div>

	<div style:position="absolute" style:inset="0" style:display="grid" style:place-items="center">
		<div
			role="status"
			aria-live="polite"
			style:display="flex"
			style:flex-direction="column"
			style:align-items="center"
			style:text-align="center"
			style:gap="6px"
		>
			<svg
				class="board-empty-rise"
				width="128"
				height="128"
				viewBox="0 0 200 200"
				fill="none"
				aria-hidden="true"
				style:margin-bottom="30px"
			>
				<circle cx="100" cy="100" r="92" stroke="var(--rule-strong)" stroke-width="2" />
				{#each ticks as i (i)}
					{@const major = i % 5 === 0}
					<line
						x1="100"
						y1="12"
						x2="100"
						y2={major ? 24 : 18}
						stroke={major ? 'var(--ink-mute)' : 'var(--rule)'}
						stroke-width={major ? 3 : 1.5}
						transform="rotate({i * 6} 100 100)"
					/>
				{/each}
				<g class="board-empty-sweep">
					<line
						x1="100"
						y1="100"
						x2="100"
						y2="30"
						stroke={copy.accent}
						stroke-width="3"
						stroke-linecap="round"
					/>
					<circle cx="100" cy="30" r="4.5" fill={copy.accent} />
				</g>
				<circle cx="100" cy="100" r="6" fill="var(--ink-mute)" />
			</svg>

			<div
				class="sc board-empty-rise"
				style:font-size="18px"
				style:letter-spacing="0.32em"
				style:color={copy.accent}
				style:animation-delay="0.08s"
			>
				{copy.kicker}
			</div>

			<div
				class="display board-empty-rise"
				style:font-size="72px"
				style:font-weight="700"
				style:line-height="1"
				style:letter-spacing="-0.01em"
				style:color="var(--ink)"
				style:animation-delay="0.16s"
			>
				{copy.head}
			</div>

			<div
				class="board-empty-rise"
				style:font-size="26px"
				style:color="var(--ink-dim)"
				style:margin-top="2px"
				style:animation-delay="0.24s"
			>
				{copy.sub}
			</div>

			<div
				class="sc tnum board-empty-rise"
				style:display="inline-flex"
				style:align-items="center"
				style:gap="12px"
				style:margin-top="26px"
				style:font-size="15px"
				style:letter-spacing="0.18em"
				style:color="var(--ink-mute)"
				style:animation-delay="0.32s"
			>
				<span
					class="board-empty-pulse"
					style:width="10px"
					style:height="10px"
					style:border-radius="50%"
					style:background={copy.accent}
				></span>
				<span>{copy.chip}</span>
			</div>
		</div>
	</div>
</div>
