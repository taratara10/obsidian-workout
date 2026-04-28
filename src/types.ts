export type ExerciseType = 'sets' | 'emom' | 'cardio';

export interface ExerciseMenu {
	name: string;
	type: ExerciseType;
}

export interface SetsWorkoutEntry {
	menu: string;
	type: 'sets';
	sets: number[];
	comment: string;
}

export interface EmomWorkoutEntry {
	menu: string;
	type: 'emom';
	reps: number;
	sets: number;
	comment: string;
}

export interface CardioWorkoutEntry {
	menu: string;
	type: 'cardio';
	comment: string;
}

export type WorkoutEntry = SetsWorkoutEntry | EmomWorkoutEntry | CardioWorkoutEntry;

export interface DayWorkout {
	date: string;
	exercises: WorkoutEntry[];
}
