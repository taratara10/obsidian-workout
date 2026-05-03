export type ExerciseType = 'sets' | 'emom' | 'cardio' | 'routine';

export type MuscleGroup =
	| 'chest'
	| 'back'
	| 'abs'
	| 'legs';

export interface ExerciseMenu {
	name: string;
	type: ExerciseType;
	color?: string;
	muscleGroup?: MuscleGroup;
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

export interface RoutineWorkoutEntry {
	menu: string;
	type: 'routine';
	comment: string;
}

export type WorkoutEntry = SetsWorkoutEntry | EmomWorkoutEntry | CardioWorkoutEntry | RoutineWorkoutEntry;

export interface DayWorkout {
	date: string;
	exercises: WorkoutEntry[];
}
