import { App, PluginSettingTab, Setting } from 'obsidian';
import { ExerciseMenu, ExerciseType, MuscleGroup } from './model/types';
import WorkoutPlugin from './main';

export interface WorkoutPluginSettings {
	menus: ExerciseMenu[];
	workoutFolder: string;
	dashboardPath: string;
}

export const DEFAULT_SETTINGS: WorkoutPluginSettings = {
	menus: [
		{ name: 'Pull-ups',            type: 'sets',    muscleGroup: 'back' },
		{ name: 'Inverted rows',       type: 'sets',    muscleGroup: 'back' },
		{ name: 'Push-ups',            type: 'emom',    muscleGroup: 'chest' },
		{ name: 'Dips',                type: 'sets',    muscleGroup: 'chest' },
		{ name: 'Squats',              type: 'sets',    muscleGroup: 'legs' },
		{ name: 'Hanging leg raises',  type: 'sets',    muscleGroup: 'abs' },
		{ name: 'Abs',                 type: 'routine', muscleGroup: 'abs' },
	],
	workoutFolder: 'workout',
	dashboardPath: 'workout/dashboard.md',
};

export class WorkoutSettingTab extends PluginSettingTab {
	plugin: WorkoutPlugin;

	constructor(app: App, plugin: WorkoutPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Workout tracker').setHeading();

		// Exercise menu list
		new Setting(containerEl).setName('Registered exercises').setHeading();
		const menuListEl = containerEl.createDiv('workout-settings-menu-list');
		this.renderMenuList(menuListEl);

		// Add new menu form
		new Setting(containerEl).setName('Add exercise').setHeading();

		let newName = '';
		let newType: ExerciseType = 'sets';
		let newMuscleGroup: MuscleGroup | undefined = undefined;

		new Setting(containerEl)
			.setName('Exercise name')
			.addText(text =>
				text
					.setPlaceholder('Pull-ups')
					.onChange(value => {
						newName = value;
					})
			);

		new Setting(containerEl).setName('Type').addDropdown(drop =>
			drop
				.addOption('sets', 'Sets — reps per set')
				.addOption('emom', 'Emom — reps × sets')
				.addOption('cardio', 'Cardio — comment only')
				.addOption('routine', 'Routine — comment only')
				.setValue('sets')
				.onChange(value => {
					newType = value as ExerciseType;
				})
		);

		new Setting(containerEl).setName('Muscle group').addDropdown(drop =>
			drop
				.addOption('', '— none —')
				.addOption('chest', 'Chest')
				.addOption('back',  'Back')
				.addOption('abs',   'Abs')
				.addOption('legs',  'Legs')
				.setValue('')
				.onChange(value => {
					newMuscleGroup = value ? value as MuscleGroup : undefined;
				})
		);

		new Setting(containerEl).addButton(btn =>
			btn
				.setButtonText('Add')
				.setCta()
				.onClick(async () => {
					const trimmed = newName.trim();
					if (!trimmed) return;
					const duplicate = this.plugin.settings.menus.some(m => m.name === trimmed);
					if (duplicate) return;
					const entry: ExerciseMenu = { name: trimmed, type: newType };
					if (newMuscleGroup) entry.muscleGroup = newMuscleGroup;
					this.plugin.settings.menus.push(entry);
					await this.plugin.saveSettings();
					this.display();
				})
		);

		// Folder settings
		new Setting(containerEl).setName('Advanced').setHeading();

		new Setting(containerEl)
			.setName('Workout folder')
			.setDesc('Folder where workout files are saved')
			.addText(text =>
				text
					.setPlaceholder('Workout')
					.setValue(this.plugin.settings.workoutFolder)
					.onChange(async value => {
						this.plugin.settings.workoutFolder = value || 'workout';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Dashboard file')
			.setDesc('Path to the file displayed in the custom UI')
			.addText(text =>
				text
					.setPlaceholder('workout/dashboard.md')
					.setValue(this.plugin.settings.dashboardPath)
					.onChange(async value => {
						this.plugin.settings.dashboardPath = value || 'workout/dashboard.md';
						await this.plugin.saveSettings();
					})
			);
	}

	private renderMenuList(container: HTMLElement): void {
		container.empty();

		if (this.plugin.settings.menus.length === 0) {
			container.createEl('p', {
				text: 'No exercises registered. Add one using the form below.',
				cls: 'workout-settings-empty',
			});
			return;
		}

		for (const [i, menu] of this.plugin.settings.menus.entries()) {
			const desc = menu.muscleGroup ? `${menu.type} · ${menu.muscleGroup}` : menu.type;
			new Setting(container)
				.setName(menu.name)
				.setDesc(desc)
				.addButton(btn =>
					btn
						.setButtonText('Delete')
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.menus.splice(i, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		}
	}
}
