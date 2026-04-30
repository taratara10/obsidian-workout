import { ItemView, Notice, WorkspaceLeaf } from 'obsidian';
import WorkoutPlugin from '../main';
import { DayWorkout, WorkoutEntry } from '../types';
import { ExerciseSelectModal } from '../modals/ExerciseSelectModal';
import { ExerciseInputModal } from '../modals/ExerciseInputModal';

export const WORKOUT_VIEW_TYPE = 'workout-dashboard';

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

	constructor(leaf: WorkspaceLeaf, plugin: WorkoutPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return WORKOUT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Workout Log';
	}

	getIcon(): string {
		return 'activity';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async render(): Promise<void> {
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
		header.createEl('h1', { text: 'Workout Log', cls: 'wt-h1' });
		header.createEl('p', { text: '直近5件のワークアウト', cls: 'wt-sub' });

		// Add FAB
		const addBtn = canvas.createEl('button', { cls: 'wt-add-fab' });
		addBtn.createSpan({ cls: 'wt-plus', text: '+' });
		addBtn.createSpan({ text: 'Add Workout' });
		addBtn.addEventListener('click', () => this.openAddFlow());

		// List
		const workouts = await this.plugin.fileManager.getRecentWorkouts(5);
		const list = canvas.createDiv('wt-list');

		if (workouts.length === 0) {
			this.renderEmpty(list);
			return;
		}

		for (const workout of workouts) {
			this.renderDateGroup(list, workout);
		}
	}

	private renderEmpty(container: HTMLElement): void {
		const empty = container.createDiv('wt-empty');
		empty.createDiv({ cls: 'wt-empty-icon', text: '🏋️' });
		empty.createEl('p', { text: '記録がありません', cls: 'wt-empty-h' });
		empty.createEl('p', {
			text: '上のボタンから最初のワークアウトを追加してください',
			cls: 'wt-empty-p',
		});
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

		for (const ex of workout.exercises) {
			this.renderExerciseRow(cardList, ex);
			if (ex.comment) {
				cardList.createDiv({ cls: 'wt-row-comment', text: ex.comment });
			}
		}
	}

	private renderExerciseRow(container: HTMLElement, ex: WorkoutEntry): void {
		const row = container.createDiv('wt-row');

		const name = row.createDiv('wt-row-name');
		name.createSpan({ cls: 'wt-type-tag', text: ex.type });
		name.appendText(ex.menu);

		const values = row.createDiv('wt-row-values');

		if (ex.type === 'sets') {
			ex.sets.forEach((reps, i) => {
				const badge = values.createSpan({
					cls: 'wt-rep-badge' + (i === 0 ? ' wt-lead' : ''),
				});
				badge.createSpan({ cls: 'wt-x', text: '×' });
				badge.appendText(String(reps));
			});
		} else if (ex.type === 'emom') {
			const badge = values.createSpan({ cls: 'wt-emom-badge' });
			badge.createSpan({ cls: 'wt-reps', text: String(ex.reps) });
			badge.createSpan({ cls: 'wt-x', text: '×' });
			badge.createSpan({ text: String(ex.sets) });
		} else if (ex.type === 'cardio' && !ex.comment) {
			values.createSpan({ cls: 'wt-cardio-text', text: '—' });
		}
	}

	private openAddFlow(): void {
		const menus = this.plugin.settings.menus;
		if (menus.length === 0) {
			new Notice('種目が未登録です。設定画面から種目を追加してください。');
			return;
		}

		new ExerciseSelectModal(this.app, menus, menu => {
			new ExerciseInputModal(this.app, menu, async entry => {
				const today = this.plugin.fileManager.getTodayDate();
				let workout = await this.plugin.fileManager.readWorkout(today);
				if (!workout) {
					workout = { date: today, exercises: [] };
				}
				workout.exercises.push(entry);
				try {
					await this.plugin.fileManager.writeWorkout(workout);
					await this.render();
				} catch (e) {
					new Notice('保存に失敗しました: ' + (e as Error).message);
				}
			}).open();
		}).open();
	}
}
