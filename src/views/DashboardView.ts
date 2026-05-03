import { ItemView, Notice, WorkspaceLeaf } from 'obsidian';
import WorkoutPlugin from '../main';
import { DayWorkout, ExerciseMenu, WorkoutEntry } from '../types';
import { ExerciseInputModal } from '../modals/ExerciseInputModal';
import { renderContributionGraph } from './ContributionGraph';
import { TYPE_GROUPS, COMMENT_ONLY_TYPES } from '../exerciseTypeGroups';

export const WORKOUT_VIEW_TYPE = 'workout-dashboard';

function menuHue(name: string): number {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return h % 360;
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_LABELS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(iso: string): { day: string; full: string; iso: string } {
	const [y, m, d] = iso.split('-').map(Number);
	if (!y || !m || !d) return { day: '', full: iso, iso };
	const dt = new Date(y, m - 1, d);
	const day = DAY_LABELS[dt.getDay()] ?? '';
	const month = MONTH_LABELS[dt.getMonth()] ?? '';
	return { day, full: `${month} ${d}`, iso };
}

export class DashboardView extends ItemView {
	plugin: WorkoutPlugin;
	private toastEl: HTMLElement | null = null;
	private toastTimer: number | null = null;
	private isRendering = false;

	constructor(leaf: WorkspaceLeaf, plugin: WorkoutPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return WORKOUT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Workout dashboard';
	}

	getIcon(): string {
		return 'activity';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async onClose(): Promise<void> {
		if (this.toastTimer !== null) {
			window.clearTimeout(this.toastTimer);
			this.toastTimer = null;
		}
		// Remove any orphaned tooltips appended to document.body
		document.querySelectorAll('.wt-graph-tooltip').forEach(el => el.remove());
	}

	async render(): Promise<void> {
		if (this.isRendering) return;
		this.isRendering = true;
		try {
			await this.doRender();
		} finally {
			this.isRendering = false;
		}
	}

	private async doRender(): Promise<void> {
		const root = this.contentEl;
		root.empty();
		root.addClass('workout-dashboard');

		const canvas = root.createDiv('wt-canvas');

		// Top bar — file title + dot
		const topbar = canvas.createDiv('wt-topbar');
		const title = topbar.createDiv('wt-topbar-title');
		title.createSpan({ cls: 'wt-dot' });
		title.createSpan({ text: this.plugin.settings.dashboardPath });

		// Header
		const header = canvas.createDiv('wt-header');
		header.createEl('h1', { text: 'Workout log', cls: 'wt-h1' });
		header.createEl('p', { text: 'Tap to add a record', cls: 'wt-sub' });

		// Quick-add chip board
		this.renderChipBoard(canvas);

		// List
		const workouts = await this.plugin.fileManager.getRecentWorkouts(5);
		const list = canvas.createDiv('wt-list');

		if (workouts.length === 0) {
			this.renderEmpty(list);
		} else {
			for (const workout of workouts) {
				this.renderDateGroup(list, workout);
			}
		}

		// Contribution Graph
		const counts = await this.plugin.fileManager.getWorkoutCountsForYear();
		renderContributionGraph(canvas, counts);

		// Toast container (hidden by default)
		this.toastEl = canvas.createDiv('wt-toast');
	}

	private renderChipBoard(container: HTMLElement): void {
		const board = container.createDiv('wt-chip-board');
		const menus = this.plugin.settings.menus;

		if (menus.length === 0) {
			board.createDiv({
				cls: 'wt-chip-empty',
				text: 'No exercises yet. Add some in settings to get started.',
			});
			return;
		}

		for (const group of TYPE_GROUPS) {
			const items = menus.filter(m => m.type === group.type);
			if (items.length === 0) continue;

			const grp = board.createDiv('wt-chip-group');
			const label = grp.createDiv('wt-chip-group-label');
			label.createSpan({ cls: 'wt-chip-group-icon', text: '·' });
			label.appendText(group.label);

			const row = grp.createDiv('wt-chip-row');
			for (const menu of items) {
				const chip = row.createEl('button', {
					cls: `wt-chip wt-chip-${menu.type}`,
				});
				chip.createSpan({ cls: 'wt-chip-plus', text: '+' });
				chip.createSpan({ cls: 'wt-chip-name', text: menu.name });
				chip.addEventListener('click', () => this.openInputModal(menu));
			}
		}
	}

	private renderEmpty(container: HTMLElement): void {
		const empty = container.createDiv('wt-empty');
		empty.createDiv({ cls: 'wt-empty-icon', text: '🏋️' });
		empty.createEl('p', { text: 'No workouts yet', cls: 'wt-empty-h' });
		empty.createEl('p', {
			text: 'Tap a chip above to log your first workout',
			cls: 'wt-empty-p',
		});
	}

	private applyTagColor(tagEl: HTMLElement, menuName: string): void {
		const stored = this.plugin.settings.menus.find(m => m.name === menuName)?.color;
		if (stored) {
			tagEl.style.color = stored;
			tagEl.style.background = `color-mix(in oklab, var(--wt-surface-2) 70%, ${stored} 30%)`;
		} else {
			const hue = menuHue(menuName);
			tagEl.style.color = `oklch(0.85 0.06 ${hue})`;
			tagEl.style.background = `oklch(0.32 0.04 ${hue})`;
		}
	}

	private renderDateGroup(container: HTMLElement, workout: DayWorkout): void {
		const group = container.createDiv('wt-date-group');
		const f = formatDate(workout.date);

		const head = group.createDiv('wt-date-group-header');
		head.createSpan({ cls: 'wt-date-day', text: f.day });
		head.createSpan({ cls: 'wt-date-full', text: f.iso });
		head.createSpan({ cls: 'wt-date-rule' });

		const card = group.createDiv('wt-card');
		const cardList = card.createDiv('wt-card-list');

		workout.exercises.forEach((ex, idx) => {
			this.renderExerciseRow(cardList, workout.date, idx, ex);
			if (ex.comment && !COMMENT_ONLY_TYPES.has(ex.type)) {
				cardList.createDiv({ cls: `wt-row-comment wt-row-type-${ex.type}`, text: ex.comment });
			}
		});
	}

	private renderExerciseRow(
		container: HTMLElement,
		date: string,
		idx: number,
		ex: WorkoutEntry
	): void {
		const row = container.createDiv(`wt-row wt-row-type-${ex.type}`);
		row.setAttr('role', 'button');
		row.setAttr('tabindex', '0');
		const onClick = () => this.openEditModal(date, idx, ex);
		row.addEventListener('click', onClick);
		row.addEventListener('keydown', e => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClick();
			}
		});

		// Single-row layout: [type tag] name → detail chips → total
		const line = row.createDiv('wt-row-line');
		const name = line.createDiv('wt-row-name');
		const typeTag = name.createSpan({ cls: 'wt-type-tag', text: ex.type });
		this.applyTagColor(typeTag, ex.menu);
		name.appendText(ex.menu);

		if (ex.type === 'sets' && ex.sets.length > 0) {
			const detail = line.createDiv('wt-row-detail');
			ex.sets.forEach(reps => {
				const badge = detail.createSpan({ cls: 'wt-rep-badge' });
				badge.createSpan({ cls: 'wt-x', text: '+' });
				badge.appendText(String(reps));
			});
			const total = ex.sets.reduce((a, b) => a + b, 0);
			const totalEl = line.createSpan({ cls: 'wt-total-text' });
			totalEl.appendText(String(total) + ' ');
			totalEl.createSpan({ cls: 'wt-total-text-unit', text: 'total' });
		} else if (ex.type === 'emom') {
			const detail = line.createDiv('wt-row-detail');
			const badge = detail.createSpan({ cls: 'wt-emom-badge' });
			badge.createSpan({ cls: 'wt-reps', text: String(ex.reps) });
			badge.createSpan({ cls: 'wt-x', text: '×' });
			badge.createSpan({ text: String(ex.sets) });
			const totalEl = line.createSpan({ cls: 'wt-total-text' });
			totalEl.appendText(String(ex.reps * ex.sets) + ' ');
			totalEl.createSpan({ cls: 'wt-total-text-unit', text: 'total' });
		} else if (COMMENT_ONLY_TYPES.has(ex.type) && ex.comment) {
			const detail = line.createDiv('wt-row-detail');
			detail.createSpan({ cls: 'wt-cardio-text', text: ex.comment });
		}
	}

	private openInputModal(menu: ExerciseMenu): void {
		new ExerciseInputModal(this.app, menu, {
			onSave: async entry => {
				await this.appendEntry(entry);
			},
		}).open();
	}

	private openEditModal(date: string, idx: number, entry: WorkoutEntry): void {
		const menu: ExerciseMenu = { name: entry.menu, type: entry.type };
		new ExerciseInputModal(this.app, menu, {
			initial: entry,
			onSave: async updated => {
				await this.replaceEntry(date, idx, updated);
			},
			onDelete: async () => {
				await this.deleteEntry(date, idx);
			},
		}).open();
	}

	private async appendEntry(entry: WorkoutEntry): Promise<void> {
		const today = this.plugin.fileManager.getTodayDate();
		let workout = await this.plugin.fileManager.readWorkout(today);
		if (!workout) workout = { date: today, exercises: [] };
		workout.exercises.push(entry);
		try {
			await this.plugin.fileManager.writeWorkout(workout);
			await this.render();
			this.showToast('Saved');
		} catch (e) {
			new Notice('Failed to save: ' + (e as Error).message);
		}
	}

	private async replaceEntry(date: string, idx: number, entry: WorkoutEntry): Promise<void> {
		const workout = await this.plugin.fileManager.readWorkout(date);
		if (!workout) return;
		workout.exercises[idx] = entry;
		try {
			await this.plugin.fileManager.writeWorkout(workout);
			await this.render();
			this.showToast('Updated');
		} catch (e) {
			new Notice('Failed to update: ' + (e as Error).message);
		}
	}

	private async deleteEntry(date: string, idx: number): Promise<void> {
		const workout = await this.plugin.fileManager.readWorkout(date);
		if (!workout) return;
		workout.exercises.splice(idx, 1);
		try {
			await this.plugin.fileManager.writeWorkout(workout);
			await this.render();
			this.showToast('Deleted');
		} catch (e) {
			new Notice('Failed to delete: ' + (e as Error).message);
		}
	}

	private showToast(msg: string): void {
		if (!this.toastEl) return;
		const el = this.toastEl;
		el.setText(msg);
		el.addClass('wt-show');
		if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
		this.toastTimer = window.setTimeout(() => {
			el.removeClass('wt-show');
			this.toastTimer = null;
		}, 1800);
	}
}
