import { ItemView, Notice, WorkspaceLeaf } from 'obsidian';
import WorkoutPlugin from '../main';
import { DayWorkout, WorkoutEntry } from '../types';
import { ExerciseSelectModal } from '../modals/ExerciseSelectModal';
import { ExerciseInputModal } from '../modals/ExerciseInputModal';

export const WORKOUT_VIEW_TYPE = 'workout-dashboard';

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

		root.createEl('h1', { text: 'Workout Log', cls: 'workout-title' });

		const addBtn = root.createEl('button', { text: '+ Add Workout', cls: 'workout-add-btn' });
		addBtn.addEventListener('click', () => this.openAddFlow());

		const workouts = await this.plugin.fileManager.getRecentWorkouts(5);

		const list = root.createDiv('workout-list');

		if (workouts.length === 0) {
			list.createEl('p', {
				text: 'ワークアウトがまだありません。「+ Add Workout」から記録を始めましょう。',
				cls: 'workout-empty',
			});
			return;
		}

		for (const workout of workouts) {
			this.renderCard(list, workout);
		}
	}

	private renderCard(container: HTMLElement, workout: DayWorkout): void {
		const card = container.createDiv('workout-card');

		card.createEl('div', { text: workout.date, cls: 'workout-card-date' });
		card.createEl('hr', { cls: 'workout-card-divider' });

		const exerciseList = card.createDiv('workout-exercise-list');
		for (const ex of workout.exercises) {
			this.renderExerciseRow(exerciseList, ex);
		}
	}

	private renderExerciseRow(container: HTMLElement, ex: WorkoutEntry): void {
		const row = container.createDiv('workout-exercise-row');
		row.createDiv(`workout-exercise-bar workout-bar-${ex.type}`);

		const content = row.createDiv('workout-exercise-content');
		const nameRepsLine = content.createDiv('workout-name-reps');
		nameRepsLine.createEl('span', { text: ex.menu, cls: 'workout-exercise-name' });

		const repsEl = nameRepsLine.createDiv('workout-reps');
		if (ex.type === 'sets') {
			for (const r of ex.sets) {
				repsEl.createEl('span', { text: `×${r}`, cls: 'workout-rep-badge' });
			}
		} else if (ex.type === 'emom') {
			repsEl.createEl('span', { text: `${ex.reps} × ${ex.sets}`, cls: 'workout-rep-badge' });
		}

		if (ex.comment) {
			content.createEl('div', { text: ex.comment, cls: 'workout-comment' });
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
