import { DayWorkout, ExerciseMenu, WorkoutEntry } from '../model/types';
import { COMMENT_ONLY_TYPES } from '../model/exerciseTypeGroups';
import { renderExerciseRow } from './WorkoutRow';

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

export function renderDateGroup(
	container: HTMLElement,
	workout: DayWorkout,
	menus: ExerciseMenu[],
	onEdit: (date: string, idx: number, entry: WorkoutEntry) => void
): void {
	const group = container.createDiv('wt-date-group');
	const f = formatDate(workout.date);

	const head = group.createDiv('wt-date-group-header');
	head.createSpan({ cls: 'wt-date-day', text: f.day });
	head.createSpan({ cls: 'wt-date-full', text: f.iso });
	head.createSpan({ cls: 'wt-date-rule' });

	const card = group.createDiv('wt-card');
	const cardList = card.createDiv('wt-card-list');

	workout.exercises.forEach((ex, idx) => {
		renderExerciseRow(cardList, workout.date, idx, ex, menus, onEdit);
		if (ex.comment && !COMMENT_ONLY_TYPES.has(ex.type)) {
			cardList.createDiv({ cls: `wt-row-comment wt-row-type-${ex.type}`, text: ex.comment });
		}
	});
}

export function renderTimelineSection(
	container: HTMLElement,
	workouts: DayWorkout[],
	menus: ExerciseMenu[],
	onEdit: (date: string, idx: number, entry: WorkoutEntry) => void
): void {
	const timelineSection = container.createDiv('wt-timeline-section');
	timelineSection.createEl('h2', { text: 'Timeline', cls: 'wt-timeline-title' });

	const list = timelineSection.createDiv('wt-list');

	if (workouts.length === 0) {
		const empty = list.createDiv('wt-empty');
		empty.createDiv({ cls: 'wt-empty-icon', text: '🏋️' });
		empty.createEl('p', { text: 'No workouts yet', cls: 'wt-empty-h' });
		empty.createEl('p', {
			text: 'Tap a chip above to log your first workout',
			cls: 'wt-empty-p',
		});
	} else {
		for (const workout of workouts) {
			renderDateGroup(list, workout, menus, onEdit);
		}
	}
}
