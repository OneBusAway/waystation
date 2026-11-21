<script>
	import * as t from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { formatTimestamp, translate } from '$lib/formatters.js';

	let { situation } = $props();

	const rawHeadline = $derived(situation?.summary?.value?.trim?.() ?? '');
	const activeWindow = $derived(situation?.activeWindows?.[0]);
	const windowStart = $derived(activeWindow?.from ? formatTimestamp(activeWindow.from) : '');
	const windowEnd = $derived(activeWindow?.to ? formatTimestamp(activeWindow.to) : '');
	const severity = $derived(situation?.severity?.toLowerCase?.() ?? 'alert');

	let translatedHeadline = $state('');

	$effect(() => {
		const locale = getLocale();
		const raw = rawHeadline;
		let cancelled = false;

		if (!raw) {
			translatedHeadline = '';
			return;
		}

		if (locale === 'en') {
			translatedHeadline = raw;
			return;
		}

		// Do not keep the previous alert's translation visible while this one is pending.
		translatedHeadline = '';

		translate(raw, locale)
			.then((text) => {
				if (!cancelled) {
					translatedHeadline = text;
				}
			})
			.catch(() => {
				if (!cancelled) {
					translatedHeadline = raw;
				}
			});

		return () => {
			cancelled = true;
		};
	});

	const headline = $derived(translatedHeadline || rawHeadline);
</script>

<div
	class="alert-badge alert-{severity}"
	style:width="760px"
	style:padding="16px 24px"
	style:border-radius="4px"
	style:display="grid"
	style:grid-template-columns="auto 1fr"
	style:gap="20px"
	style:align-items="center"
>
	<div
		class="alert-glyph"
		style:width="64px"
		style:height="64px"
		style:display="grid"
		style:place-items="center"
		style:border="2px solid currentColor"
	>
		<span style:font-size="36px" style:font-weight="800" style:line-height="1">!</span>
	</div>
	<div>
		<div
			class="sc"
			style:font-size="14px"
			style:letter-spacing="0.22em"
			style:color="var(--ink-mute)"
		>
			{t.board_service_advisory()}{#if windowStart}
				· {windowStart}{#if windowEnd}
					{getLocale() === 'ar' ? '←' : '→'} {windowEnd}{/if}{/if}
		</div>
		<div
			data-testid="alert-headline"
			style:font-size="22px"
			style:font-weight="600"
			style:line-height="1.25"
			style:margin-top="4px"
			style:color="var(--ink)"
			style:direction={getLocale() === 'ar' ? 'rtl' : 'ltr'}
			style:text-align={getLocale() === 'ar' ? 'right' : 'left'}
			style:unicode-bidi="plaintext"
			style:overflow-wrap="break-word"
			style:word-break="normal"
		>
			{headline}
		</div>
	</div>
</div>
