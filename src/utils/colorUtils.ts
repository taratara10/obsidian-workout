/** Maps an arbitrary string to a 0–359 hue value via a simple polynomial hash. */
export function stringToHue(name: string): number {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return h % 360;
}

const MUSCLE_GROUP_HUE_OVERRIDES: Record<string, number> = {
	chest: 37,
	legs: 145,
};

/** Like stringToHue but allows per-muscle-group hue overrides. */
export function muscleGroupHue(name: string): number {
	return MUSCLE_GROUP_HUE_OVERRIDES[name] ?? stringToHue(name);
}
