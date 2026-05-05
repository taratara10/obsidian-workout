import { WorkoutEntry, ExerciseMenu } from '../model/types';
import { COMMENT_ONLY_TYPES } from '../model/exerciseTypeGroups';

export const MUSCLE_GROUP_HUE: Record<string, number> = {
	back: 250,
	chest: 20,
	abs: 90,
	legs: 145,
};

export function groupHue(muscleGroup?: string): number {
	return muscleGroup ? (MUSCLE_GROUP_HUE[muscleGroup] ?? 270) : 270;
}

export function renderExerciseRow(
	container: HTMLElement,
	date: string,
	idx: number,
	ex: WorkoutEntry,
	menus: ExerciseMenu[],
	onEdit: (date: string, idx: number, ex: WorkoutEntry) => void
): void {
	const row = container.createDiv(`wt-row wt-row-type-${ex.type}`);
	const rowMuscleGroup = menus.find(m => m.name === ex.menu)?.muscleGroup;
	row.style.setProperty('--wt-menu-hue', String(groupHue(rowMuscleGroup)));
	row.setAttr('role', 'button');
	row.setAttr('tabindex', '0');
	const onClick = () => onEdit(date, idx, ex);
	row.addEventListener('click', onClick);
	row.addEventListener('keydown', e => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick();
		}
	});

	// Single-row layout: [type tag] name [muscle group] → detail chips → total
	const line = row.createDiv('wt-row-line');
	const name = line.createDiv('wt-row-name');
	name.createSpan({ cls: 'wt-type-tag', text: ex.type });
	name.appendText(ex.menu);
	const muscleGroup = menus.find(m => m.name === ex.menu)?.muscleGroup;
	if (muscleGroup) {
		name.createSpan({ cls: 'wt-muscle-tag', text: muscleGroup });
	}

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
