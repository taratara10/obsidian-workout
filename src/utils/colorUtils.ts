/** Maps an arbitrary string to a 0–359 hue value via a simple polynomial hash. */
export function stringToHue(name: string): number {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return h % 360;
}
