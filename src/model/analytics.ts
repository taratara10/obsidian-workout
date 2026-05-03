import { ExerciseMenu, ExerciseType, WorkoutEntry, DayWorkout } from './types';

export interface AnalyticsMenuData {
	menu: string;
	type: ExerciseType;
	today: number;
	thisMonth: number;
	prevMonth: number;
}

export interface AnalyticsGroupData {
	group: string;
	menus: AnalyticsMenuData[];
}

const GROUP_ORDER = ['back', 'chest', 'abs', 'legs'];

const GROUP_LABELS: Record<string, string> = {
	back: 'Back',
	chest: 'Chest',
	abs: 'Abs',
	legs: 'Legs',
	other: 'Other',
};

function entryTotal(entry: WorkoutEntry): number {
	if (entry.type === 'sets') return entry.sets.reduce((a, b) => a + b, 0);
	if (entry.type === 'emom') return entry.reps * entry.sets;
	return 1;
}

function sumWorkouts(workouts: DayWorkout[], menuName: string): number {
	let total = 0;
	for (const w of workouts) {
		for (const ex of w.exercises) {
			if (ex.menu === menuName) total += entryTotal(ex);
		}
	}
	return total;
}

export function computeAnalytics(
	todayWorkouts: DayWorkout[],
	thisMonthWorkouts: DayWorkout[],
	prevMonthWorkouts: DayWorkout[],
	menus: ExerciseMenu[]
): AnalyticsGroupData[] {
	const grouped = new Map<string, AnalyticsMenuData[]>();

	for (const menu of menus) {
		const groupKey = menu.muscleGroup ?? 'other';
		const today = sumWorkouts(todayWorkouts, menu.name);
		const thisMonth = sumWorkouts(thisMonthWorkouts, menu.name);
		const prevMonth = sumWorkouts(prevMonthWorkouts, menu.name);

		if (today === 0 && thisMonth === 0 && prevMonth === 0) continue;

		if (!grouped.has(groupKey)) grouped.set(groupKey, []);
		grouped.get(groupKey)!.push({ menu: menu.name, type: menu.type, today, thisMonth, prevMonth });
	}

	const sortedKeys = [
		...GROUP_ORDER.filter(k => grouped.has(k)),
		...[...grouped.keys()].filter(k => !GROUP_ORDER.includes(k)),
	];

	return sortedKeys.map(key => ({
		group: GROUP_LABELS[key] ?? key,
		menus: grouped.get(key)!,
	}));
}
