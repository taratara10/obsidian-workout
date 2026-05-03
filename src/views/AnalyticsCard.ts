import { AnalyticsGroupData } from '../model/analytics';
import { stringToHue } from '../utils/colorUtils';

export function renderAnalyticsCard(
	container: HTMLElement,
	groups: AnalyticsGroupData[],
	thisMonthLabel: string,
	prevMonthLabel: string
): void {
	if (groups.length === 0) return;

	const section = container.createDiv('wt-ac-section');

	// Header
	const header = section.createDiv('wt-ac-header');
	header.createEl('h2', { cls: 'wt-ac-h2', text: 'Analytics' });
	const period = header.createDiv('wt-ac-period');
	period.createSpan({ cls: 'wt-ac-period-dot' });
	period.createSpan({ text: thisMonthLabel });

	// Column legend
	const legend = section.createDiv('wt-ac-legend');
	legend.createSpan({ cls: 'wt-ac-legend-spacer' });
	legend.createSpan({ cls: 'wt-ac-col-h', text: 'Today' });
	legend.createSpan({ cls: 'wt-ac-col-h', text: thisMonthLabel.split(' ')[0] });
	legend.createSpan({ cls: 'wt-ac-col-h', text: prevMonthLabel.split(' ')[0] });

	// Group cards
	for (const g of groups) {
		const hue = stringToHue(g.group);
		const gTotals = g.menus.reduce(
			(acc, m) => ({ thisMonth: acc.thisMonth + m.thisMonth, prevMonth: acc.prevMonth + m.prevMonth }),
			{ thisMonth: 0, prevMonth: 0 }
		);
		const beat = gTotals.thisMonth > gTotals.prevMonth;

		const card = section.createDiv('wt-ac-card');
		card.style.setProperty('--wt-ac-gtone', `oklch(0.78 0.10 ${hue})`);
		card.style.setProperty('--wt-ac-gtone-bg', `oklch(0.30 0.05 ${hue})`);

		// Group header
		const head = card.createDiv('wt-ac-group-head');
		head.createSpan({ cls: 'wt-ac-group-tag', text: g.group });
		head.createSpan({ cls: 'wt-ac-group-count', text: `${g.menus.length} menu${g.menus.length !== 1 ? 's' : ''}` });
		head.createSpan({ cls: 'wt-ac-group-spacer' });

		const thisMonthEl = head.createSpan({ cls: 'wt-ac-num wt-ac-num-sm' + (beat ? ' wt-ac-beat' : '') });
		thisMonthEl.appendText(String(gTotals.thisMonth));
		if (beat) thisMonthEl.createSpan({ cls: 'wt-ac-beat-mark', text: '▲' });

		head.createSpan({ cls: 'wt-ac-num wt-ac-num-sm wt-ac-muted', text: String(gTotals.prevMonth) });

		// Menu rows
		const rows = card.createDiv('wt-ac-rows');
		for (const m of g.menus) {
			const row = rows.createDiv('wt-ac-row');
			const cell = row.createDiv('wt-ac-menu-cell');
			cell.createSpan({ cls: 'wt-ac-type-tag', text: m.type });
			cell.createSpan({ cls: 'wt-ac-menu-name', text: m.menu });

			if (m.today > 0) {
				row.createSpan({ cls: 'wt-ac-today-badge', text: `+${m.today}` });
			} else {
				row.createSpan({ cls: 'wt-ac-num wt-ac-num-empty', text: '·' });
			}

			const rowBeat = m.thisMonth > m.prevMonth;
			const thisEl = row.createSpan({ cls: 'wt-ac-num' + (rowBeat ? ' wt-ac-beat' : '') });
			thisEl.appendText(String(m.thisMonth));
			if (rowBeat) thisEl.createSpan({ cls: 'wt-ac-beat-mark', text: '▲' });

			row.createSpan({ cls: 'wt-ac-num wt-ac-muted', text: String(m.prevMonth) });
		}
	}
}
