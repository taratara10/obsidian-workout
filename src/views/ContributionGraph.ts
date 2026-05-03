const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };

function intensityLevel(count: number): number {
	if (count === 0) return 0;
	if (count <= 2) return 1;
	if (count <= 4) return 2;
	if (count <= 6) return 3;
	return 4;
}

function toIso(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function formatTooltip(iso: string, count: number): string {
	if (count === 0) return iso;
	return `${iso} · ${count} exercise${count > 1 ? 's' : ''}`;
}

export function renderContributionGraph(
	container: HTMLElement,
	counts: Map<string, number>
): void {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Rewind to the Sunday of the week that contains (today - 364 days)
	const startBase = new Date(today);
	startBase.setDate(startBase.getDate() - 364);
	const startSunday = new Date(startBase);
	startSunday.setDate(startBase.getDate() - startBase.getDay());

	// Build week columns: array of 7 dates each
	const weeks: Date[][] = [];
	const cur = new Date(startSunday);
	while (cur <= today) {
		const week: Date[] = [];
		for (let dow = 0; dow < 7; dow++) {
			week.push(new Date(cur));
			cur.setDate(cur.getDate() + 1);
		}
		weeks.push(week);
	}

	// Determine month label positions (week index where a new month first appears)
	const monthPositions: { label: string; col: number }[] = [];
	let lastMonth = -1;
	weeks.forEach((week, col) => {
		const firstDay = week[0]!;
		const month = firstDay.getMonth();
		if (month !== lastMonth) {
			monthPositions.push({ label: MONTH_LABELS[month] ?? '', col });
			lastMonth = month;
		}
	});

	// ── DOM ──────────────────────────────────────
	const section = container.createDiv('wt-graph-section');
	section.createEl('h3', { cls: 'wt-graph-title', text: 'Activity' });

	const frame = section.createDiv('wt-graph-frame');

	// Left column: day labels — never scrolls
	const side = frame.createDiv('wt-graph-side');
	side.createDiv('wt-graph-month-spacer'); // matches month row height
	const dayLabelCol = side.createDiv('wt-graph-day-label-col');
	for (let dow = 0; dow < 7; dow++) {
		const lbl = dayLabelCol.createDiv('wt-graph-day-label');
		const text = DAY_LABELS[dow] ?? '';
		if (text) lbl.setText(text);
	}

	// Right column: scrollable (month labels + cell grid)
	const outer = frame.createDiv('wt-graph-outer');
	const inner = outer.createDiv('wt-graph-inner');

	// Month header
	const monthGrid = inner.createDiv('wt-graph-month-grid');
	monthGrid.style.gridTemplateColumns = `repeat(${weeks.length}, var(--wt-cell-size))`;
	for (let col = 0; col < weeks.length; col++) {
		const mp = monthPositions.find(p => p.col === col);
		const cell = monthGrid.createDiv('wt-graph-month-cell');
		if (mp) cell.setText(mp.label);
	}

	// Cell grid
	const grid = inner.createDiv('wt-graph-grid');
	grid.style.gridTemplateColumns = `repeat(${weeks.length}, var(--wt-cell-size))`;

	for (let col = 0; col < weeks.length; col++) {
		const weekCol = grid.createDiv('wt-graph-col');
		for (let dow = 0; dow < 7; dow++) {
			const date = weeks[col]![dow]!;
			const isFuture = date > today;
			const iso = toIso(date);
			const count = isFuture ? 0 : (counts.get(iso) ?? 0);
			const level = isFuture ? -1 : intensityLevel(count);

			const cell = weekCol.createDiv('wt-graph-cell');
			if (level >= 0) {
				cell.addClass(`wt-graph-level-${level}`);
			} else {
				cell.addClass('wt-graph-future');
			}

			// Tooltip (desktop only — touch devices use aria-label)
			if (!isFuture) {
				cell.setAttr('aria-label', formatTooltip(iso, count));

				let tooltipEl: HTMLElement | null = null;
				cell.addEventListener('mouseenter', () => {
					tooltipEl?.remove();
					tooltipEl = document.body.createDiv('wt-graph-tooltip');
					tooltipEl.setText(formatTooltip(iso, count));

					const rect = cell.getBoundingClientRect();
					tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
					tooltipEl.style.top = `${rect.top - 4}px`;
				});
				cell.addEventListener('mouseleave', () => {
					tooltipEl?.remove();
					tooltipEl = null;
				});
			}
		}
	}

	// Scroll to rightmost (current week) after layout.
	// Double rAF is intentional: the first frame fires before Obsidian finishes
	// measuring the flex container, so scrollWidth is still 0 at that point.
	// The second frame runs after the browser has completed layout, giving the
	// correct scrollWidth. Do NOT collapse this to a single rAF — it will
	// regress to opening at the left edge instead of the current week.
	requestAnimationFrame(() => {
		requestAnimationFrame(() => { outer.scrollLeft = outer.scrollWidth; });
	});
}
