import { App, PluginSettingTab, Setting } from 'obsidian';
import { ExerciseMenu, ExerciseType } from './model/types';
import WorkoutPlugin from './main';

export const BADGE_COLOR_PALETTE = [
	{ id: 'warm-1',  name: 'Cocoa',  bg: '#452C24', fg: '#E8B8A8' },
	{ id: 'warm-2',  name: 'Umber',  bg: '#4A3520', fg: '#EDCBA0' },
	{ id: 'cool-1',  name: 'Navy',   bg: '#2B3347', fg: '#A8B8E8' },
	{ id: 'cool-2',  name: 'Indigo', bg: '#332B47', fg: '#C8A8ED' },
	{ id: 'green-1', name: 'Forest', bg: '#293723', fg: '#A8D89A' },
	{ id: 'green-2', name: 'Teal',   bg: '#1F3530', fg: '#9ADBD0' },
] as const;

export interface WorkoutPluginSettings {
	menus: ExerciseMenu[];
	workoutFolder: string;
	dashboardPath: string;
}

export const DEFAULT_SETTINGS: WorkoutPluginSettings = {
	menus: [
		{ name: 'Pull-ups',            type: 'sets',    color: '#452C24' },
		{ name: 'Inverted rows',       type: 'sets',    color: '#4A3520' },
		{ name: 'Push-ups',            type: 'emom',    color: '#2B3347' },
		{ name: 'Dips',                type: 'sets',    color: '#332B47' },
		{ name: 'Squats',              type: 'sets',    color: '#293723' },
		{ name: 'Hanging leg raises',  type: 'sets',    color: '#1F3530' },
		{ name: 'Abs',                 type: 'routine', color: '#1F3530' },
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

		new Setting(containerEl).addButton(btn =>
			btn
				.setButtonText('Add')
				.setCta()
				.onClick(async () => {
					const trimmed = newName.trim();
					if (!trimmed) return;
					const duplicate = this.plugin.settings.menus.some(m => m.name === trimmed);
					if (duplicate) return;
					this.plugin.settings.menus.push({ name: trimmed, type: newType });
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
			const setting = new Setting(container)
				.setName(menu.name)
				.setDesc(menu.type)
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

			const swatchWrap = setting.controlEl.createDiv('workout-settings-swatches');
			swatchWrap.style.order = '-1';

			for (const palette of BADGE_COLOR_PALETTE) {
				const swatch = swatchWrap.createEl('button', {
					cls: 'wt-swatch' + (menu.color === palette.bg ? ' wt-swatch--active' : ''),
					attr: { type: 'button', 'aria-label': palette.name, title: palette.name },
				});
				swatch.style.background = palette.bg;
				swatch.addEventListener('click', async () => {
					menu.color = palette.bg;
					await this.plugin.saveSettings();
					this.renderMenuList(container);
				});
			}

			const noneSwatch = swatchWrap.createEl('button', {
				cls: 'wt-swatch wt-swatch--none' + (!menu.color ? ' wt-swatch--active' : ''),
				attr: { type: 'button', 'aria-label': 'Auto color', title: 'Auto color' },
				text: '−',
			});
			noneSwatch.addEventListener('click', async () => {
				delete menu.color;
				await this.plugin.saveSettings();
				this.renderMenuList(container);
			});
		}
	}
}
