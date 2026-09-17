<script>
	import { formatDate } from '$lib/formatters.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let { now, hour12 } = $props();

	// `now` is bumped every second by the page, but nothing this component renders changes more
	// than once a minute. Truncating to the minute means the derivations below re-run ~1,440
	// times a day instead of ~86,400 to produce the same string — worth it on a kiosk that stays
	// open for days, where constructing an Intl.DateTimeFormat is the costly part. This has to
	// be a primitive: $derived compares with ===, so a truncated Date object would be a fresh
	// reference every tick and would invalidate its dependents once a second regardless.
	const minuteMs = $derived(Math.floor(now.getTime() / 60_000) * 60_000);

	const dateText = $derived(formatDate(new Date(minuteMs)));

	// Force Latin numerals via Unicode extension (ar-u-nu-latn) and keep the numeric group
	// (hour, separator, minute) LTR while the meridiem stays locale-ordered. Seconds are gone:
	// the footer already reports the update time to the second, and the meridiem landing after
	// a ticking seconds group made the clock parse as three unrelated numbers.
	const timeParts = $derived.by(() => {
		const latinLocale = `${getLocale()}-u-nu-latn`;
		const parts = new Intl.DateTimeFormat(latinLocale, {
			hour: 'numeric',
			minute: '2-digit',
			hour12
		}).formatToParts(new Date(minuteMs));
		// The separator is the literal that sits between the hour and the minute, not simply the
		// first literal: locales that lead with the day period (ko, zh-Hant) put a space there.
		const hourIndex = parts.findIndex((p) => p.type === 'hour');
		const next = hourIndex === -1 ? undefined : parts[hourIndex + 1];
		return {
			hour: parts.find((p) => p.type === 'hour')?.value ?? '',
			separator: next?.type === 'literal' ? next.value : ':',
			minute: parts.find((p) => p.type === 'minute')?.value ?? '',
			meridiem: parts.find((p) => p.type === 'dayPeriod')?.value ?? ''
		};
	});

	const isRTL = $derived(getLocale() === 'ar');
</script>

<div style:text-align="right">
	<div
		class="sc"
		style:font-size="18px"
		style:letter-spacing="0.22em"
		style:color="var(--ink-mute)"
		style:margin-bottom="4px"
	>
		{dateText}
	</div>
	<div
		data-testid="clock"
		class="mono display tnum"
		style:font-size="52px"
		style:font-weight="600"
		style:line-height="1"
		style:letter-spacing="-0.02em"
		style:color="var(--accent)"
		style:white-space="nowrap"
		style:display="flex"
		style:align-items="baseline"
		style:justify-content="flex-end"
		style:gap="8px"
	>
		{#if isRTL && timeParts.meridiem}
			<span style:color="var(--ink-dim)" style:font-weight="400" style:font-size="28px"
				>{timeParts.meridiem}</span
			>
		{/if}
		<span dir="ltr"
			>{timeParts.hour}<span
				data-testid="clock-separator"
				style:margin="0 -0.04em"
				style:display="inline-block">{timeParts.separator}</span
			>{timeParts.minute}</span
		>
		{#if !isRTL && timeParts.meridiem}
			<span style:color="var(--ink-dim)" style:font-weight="400" style:font-size="28px"
				>{timeParts.meridiem}</span
			>
		{/if}
	</div>
</div>
