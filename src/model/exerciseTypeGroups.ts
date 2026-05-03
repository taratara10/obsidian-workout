import { ExerciseType } from './types';

/** Exercise type that records numeric performance data (reps, sets) alongside an optional comment. */
export interface RepsTypeGroup {
	type: ExerciseType;
	label: string;
	kind: 'reps';
}

/** Exercise type whose only payload is free-text description — no numeric fields. */
export interface FreeformTypeGroup {
	type: ExerciseType;
	label: string;
	kind: 'freeform';
}

export type TypeGroupDef = RepsTypeGroup | FreeformTypeGroup;

export const TYPE_GROUPS: TypeGroupDef[] = [
	{ type: 'sets', label: 'SETS', kind: 'reps' },
	{ type: 'emom', label: 'EMOM', kind: 'reps' },
	{ type: 'cardio', label: 'CARDIO', kind: 'freeform' },
	{ type: 'routine', label: 'ROUTINE', kind: 'freeform' },
];

/** Set of freeform types whose only payload is `comment`. Used in rendering checks. */
export const COMMENT_ONLY_TYPES = new Set<ExerciseType>(
	TYPE_GROUPS.filter((g): g is FreeformTypeGroup => g.kind === 'freeform').map(g => g.type)
);
