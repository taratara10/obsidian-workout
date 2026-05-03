import { ExerciseType } from './types';

export interface TypeGroupDef {
	type: ExerciseType;
	label: string;
	/** true = exercise stores data only in `comment` (no sets/reps fields) */
	commentOnly: boolean;
}

export const TYPE_GROUPS: TypeGroupDef[] = [
	{ type: 'sets', label: 'SETS', commentOnly: false },
	{ type: 'emom', label: 'EMOM', commentOnly: false },
	{ type: 'cardio', label: 'CARDIO', commentOnly: true },
	{ type: 'routine', label: 'ROUTINE', commentOnly: true },
];

/** Set of types whose only payload is `comment`. Used in rendering checks. */
export const COMMENT_ONLY_TYPES = new Set<ExerciseType>(
	TYPE_GROUPS.filter(g => g.commentOnly).map(g => g.type)
);
