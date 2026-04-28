import { App, TFile, TFolder, parseYaml } from 'obsidian';
import { DayWorkout, WorkoutEntry } from './types';

export class FileManager {
	constructor(
		private app: App,
		private workoutFolder: string
	) {}

	private filePath(date: string): string {
		return `${this.workoutFolder}/${date}.md`;
	}

	getTodayDate(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	async readWorkout(date: string): Promise<DayWorkout | null> {
		const path = this.filePath(date);
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!file || !(file instanceof TFile)) return null;

		const content = await this.app.vault.read(file);
		const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!match || !match[1]) return null;

		try {
			const fm = parseYaml(match[1]) as { date?: string; exercises?: WorkoutEntry[] };
			return {
				date: fm.date ?? date,
				exercises: Array.isArray(fm.exercises) ? fm.exercises : [],
			};
		} catch {
			return null;
		}
	}

	async writeWorkout(workout: DayWorkout): Promise<void> {
		const path = this.filePath(workout.date);
		const content = this.serialize(workout);

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, content);
		} else {
			await this.ensureFolder();
			await this.app.vault.create(path, content);
		}
	}

	async getRecentWorkouts(count: number): Promise<DayWorkout[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.workoutFolder);
		if (!folder || !(folder instanceof TFolder)) return [];

		const files = folder.children
			.filter((f): f is TFile => f instanceof TFile && f.extension === 'md')
			.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
			.slice(0, count);

		const workouts: DayWorkout[] = [];
		for (const file of files) {
			const date = file.name.replace('.md', '');
			const workout = await this.readWorkout(date);
			if (workout) workouts.push(workout);
		}
		return workouts;
	}

	async ensureFolder(): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(this.workoutFolder);
		if (!folder) {
			await this.app.vault.createFolder(this.workoutFolder);
		}
	}

	private escape(str: string): string {
		return str
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '\\r')
			.replace(/\t/g, '\\t');
	}

	private serialize(workout: DayWorkout): string {
		const lines: string[] = ['---', `date: ${workout.date}`, 'exercises:'];

		for (const ex of workout.exercises) {
			lines.push(`  - menu: "${this.escape(ex.menu)}"`);
			lines.push(`    type: ${ex.type}`);

			if (ex.type === 'sets') {
				lines.push(`    sets: [${ex.sets.join(', ')}]`);
				lines.push(`    comment: "${this.escape(ex.comment)}"`);
			} else if (ex.type === 'emom') {
				lines.push(`    reps: ${ex.reps}`);
				lines.push(`    sets: ${ex.sets}`);
				lines.push(`    comment: "${this.escape(ex.comment)}"`);
			} else {
				lines.push(`    comment: "${this.escape(ex.comment)}"`);
			}
		}

		lines.push('---', '');
		return lines.join('\n');
	}
}
