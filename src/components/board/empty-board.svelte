<script>
	// `mode` is decided by the parent board; this component is a pure visual
	// lookup with no state logic of its own. Each idle state gets its own copy +
	// accent so a glance tells you whether we're starting up, genuinely quiet, or
	// have lost the live feed.
	const COPY = {
		connecting: {
			kicker: 'AWAITING SIGNAL',
			head: 'CONNECTING',
			sub: 'Retrieving real-time arrivals…',
			chip: 'ESTABLISHING CONNECTION',
			accent: 'var(--sched)'
		},
		empty: {
			kicker: 'ALL CLEAR',
			head: 'NO DEPARTURES',
			sub: 'No scheduled service for this stop right now',
			chip: 'MONITORING FOR UPDATES',
			accent: 'var(--ontime)'
		},
		stale: {
			kicker: 'SIGNAL INTERRUPTED',
			head: 'NO LIVE DATA',
			sub: 'Real-time feed unavailable — retrying',
			chip: 'ATTEMPTING TO RECONNECT',
			accent: 'var(--late)'
		}
	};

	let { mode = 'connecting', rowCount = 5 } = $props();

	const copy = $derived(COPY[mode] ?? COPY.connecting);

	// 60 ticks (majors every 5) plus the single sweep arm below — but no
	// hour/minute hands, so it reads as "waiting" rather than a real clock.
	const ticks = Array.from({ length: 60 }, (_, i) => i);
	const ghosts = Array.from({ length: rowCount }, (_, i) => i);
</script>

<div style:position="relative" style:min-height="0" style:height="100%">
	<!-- Ghost rows keep the board's row rhythm so the screen never reads as broken -->
	<div
		style:position="absolute"
		style:inset="0"
		style:display="grid"
		style:grid-template-rows="repeat({rowCount}, 1fr)"
		style:gap="6px"
		aria-hidden="true"
	>
		{#each ghosts as i (i)}
			<div style:border-bottom="1px dashed var(--rule)" style:opacity="0.5"></div>
		{/each}
	</div>

	<!-- Idle plate -->
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
			<!-- Station-clock mark: no hour/minute hands, one slow sweeping arm -->
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
