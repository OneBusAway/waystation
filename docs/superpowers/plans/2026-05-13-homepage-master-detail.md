# Homepage Master-Detail Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the homepage into a two-panel master-detail layout with a fixed agency sidebar and a stop-list detail pane, with the selected agency reflected in the URL as `/?agency={id}`.

**Architecture:** Single SvelteKit page. `+page.server.js` always loads agencies and conditionally loads stop IDs when `?agency=` is present in the URL. `+page.svelte` becomes a full-height two-column layout — sidebar on the left, detail pane on the right — with `goto()` for agency selection.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS v4, `onebusaway-sdk`

---

## File Map

| File | Change |
|------|--------|
| `src/routes/+page.server.js` | Add conditional stop ID fetch based on `?agency=` URL param |
| `src/routes/+page.svelte` | Full redesign as master-detail layout |

---

### Task 1: Update server load function to conditionally fetch stops

**Files:**
- Modify: `src/routes/+page.server.js`

- [ ] **Step 1: Replace the file contents**

Open `src/routes/+page.server.js` and replace it entirely with:

```js
import oba, { handleOBAResponse } from '$lib/obaSdk.js';

export async function load({ url }) {
	const agencies = await oba.agenciesWithCoverage.list();
	const agenciesBody = await handleOBAResponse(agencies, 'agencies').json();
	const agencyRefs = agenciesBody.data.references.agencies;

	const selectedAgencyId = url.searchParams.get('agency');
	let stopIDs = [];

	if (selectedAgencyId) {
		const response = await oba.stopIdsForAgency.list(selectedAgencyId);
		const json = await handleOBAResponse(response, 'stop-ids').json();
		stopIDs = json.data.list;
	}

	return {
		agencies: agencyRefs,
		selectedAgencyId,
		stopIDs,
	};
}
```

- [ ] **Step 2: Verify the dev server starts cleanly**

Run:
```bash
npm run dev
```

Navigate to `http://localhost:5174`. The page should still render (even if unstyled) without errors in the terminal. Then navigate to `http://localhost:5174/?agency=1` (or any valid agency ID from your OBA instance) and confirm the page loads without a 500 error.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.server.js
git commit -m "feat: load stop IDs server-side when agency query param is present"
```

---

### Task 2: Redesign `+page.svelte` — two-column shell and sidebar

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Replace the file contents with the full two-column layout**

Open `src/routes/+page.svelte` and replace it entirely with:

```svelte
<script>
	import { goto } from '$app/navigation';

	let { data } = $props();
	let agencies = data.agencies;
	let selectedAgencyId = data.selectedAgencyId;
	let stopIDs = data.stopIDs;
	let selectedAgency = $derived(agencies.find((a) => a.id === selectedAgencyId));
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
	<!-- Sidebar -->
	<aside class="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
		<div class="px-4 pt-5 pb-3">
			<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Agencies</p>
		</div>
		<nav class="flex-1 overflow-y-auto">
			{#each agencies as agency (agency.id)}
				<button
					onclick={() => goto(`/?agency=${agency.id}`)}
					class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors {agency.id ===
					selectedAgencyId
						? 'bg-brand-lightgray font-semibold text-brand-darkblue'
						: 'text-gray-700 hover:bg-gray-50'}"
				>
					<span
						class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600"
					>
						{agency.name.charAt(0)}
					</span>
					{agency.name}
				</button>
			{/each}
		</nav>
	</aside>

	<!-- Detail pane -->
	<main class="flex flex-1 flex-col overflow-hidden">
		{#if !selectedAgency}
			<div class="flex flex-1 items-center justify-center text-sm text-gray-400">
				Select an agency to view its stops.
			</div>
		{:else}
			<div class="flex-1 overflow-y-auto">
				<div class="border-b border-gray-200 bg-white px-6 py-4">
					<h1 class="text-base font-semibold text-gray-900">{selectedAgency.name}</h1>
					<p class="text-sm text-gray-500">{stopIDs.length} stops</p>
				</div>
				<div class="px-6 py-4">
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="pb-2 text-left font-medium text-gray-900">Stop ID</th>
								<th class="pb-2 text-right font-medium text-gray-900"></th>
							</tr>
						</thead>
						<tbody>
							{#each stopIDs as stopID (stopID)}
								<tr class="border-b border-gray-100">
									<td class="py-2.5 font-mono text-gray-700">{stopID}</td>
									<td class="py-2.5 text-right">
										<a
											href="/stops/{stopID}"
											class="font-medium text-brand-blue hover:underline"
										>
											View
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>
```

- [ ] **Step 2: Verify in the browser**

With the dev server still running (`npm run dev`), navigate to `http://localhost:5174`.

Expected:
- Two-column layout fills the full viewport height
- Left sidebar shows "AGENCIES" label and a list of agency names, each with a letter-avatar circle
- Right pane shows "Select an agency to view its stops." centered in gray text

- [ ] **Step 3: Verify agency selection**

Click any agency in the sidebar.

Expected:
- URL updates to `/?agency={id}` (full page navigation via SvelteKit)
- Clicked agency row gets the active style (slightly tinted background, darker text)
- Detail pane shows the agency name, stop count, and a table of stop IDs
- Each stop row has the raw stop ID and a "View" link on the right

- [ ] **Step 4: Verify the View link**

Click one "View" link in the stop table.

Expected: navigates to `/stops/{stopID}` (the existing stop display page).

- [ ] **Step 5: Verify deep-link / bookmarkability**

Open `http://localhost:5174/?agency=1` (or whatever agency ID exists in your OBA instance) directly in the browser (or hit Refresh while on the selected-agency URL).

Expected: page loads with that agency already selected and its stops shown — no client-side state needed.

- [ ] **Step 6: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: redesign homepage as master-detail layout with agency sidebar and stop table"
```
