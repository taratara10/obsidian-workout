import { App, PluginSettingTab, Setting } from 'obsidian';
import { ExerciseMenu, ExerciseType } from './types';
import WorkoutPlugin from './main';

export interface WorkoutPluginSettings {
	menus: ExerciseMenu[];
	workoutFolder: string;
	dashboardPath: string;
}

export const DEFAULT_SETTINGS: WorkoutPluginSettings = {
	menus: [],
	workoutFolder: 'workout',
	dashboardPath: 'dashboard.md',
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

		new Setting(containerEl).setName('Workout tracker 設定').setHeading();

		// Exercise menu list
		new Setting(containerEl).setName('登録済み種目').setHeading();
		const menuListEl = containerEl.createDiv('workout-settings-menu-list');
		this.renderMenuList(menuListEl);

		// Add new menu form
		new Setting(containerEl).setName('種目を追加').setHeading();

		let newName = '';
		let newType: ExerciseType = 'sets';

		new Setting(containerEl)
			.setName('種目名')
			.addText(text =>
				text
					.setPlaceholder('例: 懸垂')
					.onChange(value => {
						newName = value;
					})
			);

		new Setting(containerEl).setName('タイプ').addDropdown(drop =>
			drop
				.addOption('sets', 'Sets — セットごとにreps入力')
				.addOption('emom', 'Emom — reps × sets入力')
				.addOption('cardio', 'Cardio — コメントのみ')
				.setValue('sets')
				.onChange(value => {
					newType = value as ExerciseType;
				})
		);

		new Setting(containerEl).addButton(btn =>
			btn
				.setButtonText('追加')
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
		new Setting(containerEl).setName('詳細設定').setHeading();

		new Setting(containerEl)
			.setName('ワークアウトフォルダ')
			.setDesc('ワークアウトファイルの保存先フォルダ')
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
			.setName('ダッシュボードファイル')
			.setDesc('カスタムUIで表示するファイルのパス')
			.addText(text =>
				text
					.setPlaceholder('Dashboard.md')
					.setValue(this.plugin.settings.dashboardPath)
					.onChange(async value => {
						this.plugin.settings.dashboardPath = value || 'dashboard.md';
						await this.plugin.saveSettings();
					})
			);
	}

	private renderMenuList(container: HTMLElement): void {
		container.empty();

		if (this.plugin.settings.menus.length === 0) {
			container.createEl('p', {
				text: '種目が登録されていません。下のフォームから追加してください。',
				cls: 'workout-settings-empty',
			});
			return;
		}

		for (const [i, menu] of this.plugin.settings.menus.entries()) {
			new Setting(container)
				.setName(menu.name)
				.setDesc(menu.type)
				.addButton(btn =>
					btn
						.setButtonText('削除')
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
