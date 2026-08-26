<script>
	import * as t from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { alertTone, formatAlertWindow, translate } from '$lib/formatters.js';
	import { ALERT_HEIGHT } from '$lib/board-layout.js';

	let { situation } = $props();

	const rawHeadline = $derived(situation?.summary?.value?.trim?.() ?? '');
	const rawBody = $derived(situation?.description?.value?.trim?.() ?? '');
	const activeWindow = $derived(situation?.activeWindows?.[0]);
	const windowStart = $derived(activeWindow?.from ? formatAlertWindow(activeWindow.from) : '');
	const windowEnd = $derived(activeWindow?.to ? formatAlertWindow(activeWindow.to) : '');
	const isRTL = $derived(getLocale() === 'ar');
	// Built as a single string rather than left to template whitespace: a `→` sitting on its
	// own line inside an {#if} has its leading whitespace collapsed by Svelte, which silently
	// produced "Aug 18→ Sep 5" (space after the arrow only, none before it).
	const windowLabel = $derived(
		windowStart && windowEnd ? `${windowStart} ${isRTL ? '←' : '→'} ${windowEnd}` : windowStart
	);
	// OBA's severity vocabulary does not match the three tones app.css paints; without this
	// mapping the class matched no rule and the severity bar never drew.
	const tone = $derived(alertTone(situation?.severity));

	let translated = $state({ headline: '', body: '' });

	$effect(() => {
		const locale = getLocale();
		const headline = rawHeadline;
		const body = rawBody;
		let cancelled = false;

		if (!headline || locale === 'en') {
			translated = { headline, body };
			return;
		}

		// Show the new alert's raw text while its translation is in flight rather
		// than the previous alert's translated text.
		translated = { headline: '', body: '' };

		Promise.all([translate(headline, locale), body ? translate(body, locale) : ''])
			.then(([h, b]) => {
				if (!cancelled) translated = { headline: h, body: b };
			})
			.catch(() => {
				if (!cancelled) translated = { headline, body };
			});

		return () => {
			cancelled = true;
		};
	});

	const headline = $derived(translated.headline || rawHeadline);
	const body = $derived(translated.body || rawBody);
</script>

<div
	class="alert-badge alert-{tone}"
	style:display="grid"
	style:grid-template-columns="auto 1fr auto"
	style:gap="22px"
	style:align-items="center"
	style:height="{ALERT_HEIGHT}px"
	style:padding="10px 20px"
	style:border-radius="var(--radius-container)"
>
	<div
		class="alert-glyph"
		style:width="44px"
		style:height="44px"
		style:display="grid"
		style:place-items="center"
		style:border="2px solid currentColor"
		style:border-radius="var(--radius-chip)"
	>
		<span style:font-size="26px" style:font-weight="800" style:line-height="1">!</span>
	</div>

	<div
		style:min-width="0"
		style:direction={isRTL ? 'rtl' : 'ltr'}
		style:text-align={isRTL ? 'right' : 'left'}
	>
		<div
			data-testid="alert-eyebrow"
			class="sc"
			style:font-size="12px"
			style:letter-spacing="0.10em"
			style:color="var(--ink-mute)"
			style:margin-bottom="4px"
		>
			{t.board_service_advisory()}
		</div>
		<div
			data-testid="alert-headline"
			style:font-size="24px"
			style:font-weight="600"
			style:line-height="1.2"
			style:color="var(--ink)"
			style:display="-webkit-box"
			style:-webkit-line-clamp="2"
			style:-webkit-box-orient="vertical"
			style:overflow="hidden"
		>
			{headline}
		</div>
		{#if body}
			<div
				data-testid="alert-body"
				style:font-size="18px"
				style:line-height="1.25"
				style:color="var(--ink-dim)"
				style:margin-top="3px"
				style:display="-webkit-box"
				style:-webkit-line-clamp="1"
				style:-webkit-box-orient="vertical"
				style:overflow="hidden"
			>
				{body}
			</div>
		{/if}
	</div>

	<div
		data-testid="alert-window"
		class="sc"
		style:font-size="13px"
		style:letter-spacing="0.10em"
		style:color="var(--ink-mute)"
		style:text-align="right"
		style:white-space="nowrap"
	>
		{windowLabel}
	</div>
</div>
