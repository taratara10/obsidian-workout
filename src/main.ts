import { MarkdownView, Plugin, TFile } from 'obsidian';
import { WorkoutPluginSettings, DEFAULT_SETTINGS, WorkoutSettingTab } from './settings';
import { FileManager } from './fileManager';
import { DashboardView, WORKOUT_VIEW_TYPE } from './views/DashboardView';

export default class WorkoutPlugin extends Plugin {
	settings: WorkoutPluginSettings;
	fileManager: FileManager;

	private isInitializing = true;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.fileManager = new FileManager(this.app, this.settings.workoutFolder);

		this.registerView(WORKOUT_VIEW_TYPE, leaf => new DashboardView(leaf, this));

		this.addSettingTab(new WorkoutSettingTab(this.app, this));

		this.addCommand({
			id: 'open-dashboard',
			name: 'ダッシュボードを開く',
			callback: () => this.openDashboard(),
		});

		this.app.workspace.onLayoutReady(async () => {
			await this.ensureDashboardFile();
			this.interceptOpenDashboard();
			this.isInitializing = false;
		});

		this.registerEvent(
			this.app.workspace.on('file-open', async (file: TFile | null) => {
				if (this.isInitializing) return;
				if (!file || file.path !== this.settings.dashboardPath) return;
				await this.switchLeafToDashboard(file);
			})
		);
	}

	onunload(): void {
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<WorkoutPluginSettings>);
		for (const menu of this.settings.menus) {
			if (!menu.muscleGroup) {
				const preset = DEFAULT_SETTINGS.menus.find(m => m.name === menu.name);
				if (preset?.muscleGroup) menu.muscleGroup = preset.muscleGroup;
			}
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.fileManager = new FileManager(this.app, this.settings.workoutFolder);
	}

	private async ensureDashboardFile(): Promise<void> {
		const path = this.settings.dashboardPath;
		if (this.app.vault.getAbstractFileByPath(path)) return;
		await this.app.vault.create(path, `# Workout Log\n\nThis file is managed by the Workout Tracker plugin.\n`);
	}

	private interceptOpenDashboard(): void {
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.file?.path === this.settings.dashboardPath) {
				void leaf.setViewState({ type: WORKOUT_VIEW_TYPE, active: true });
				break;
			}
		}
	}

	private async switchLeafToDashboard(file: TFile): Promise<void> {
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		const target = leaves.find(
			l => l.view instanceof MarkdownView && l.view.file?.path === file.path
		);
		if (target) {
			await target.setViewState({ type: WORKOUT_VIEW_TYPE, active: true });
		}
	}

	async openDashboard(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(WORKOUT_VIEW_TYPE)[0];
		if (existing) {
			void this.app.workspace.revealLeaf(existing);
			return;
		}
		const leaf = this.app.workspace.getLeaf();
		await leaf.setViewState({ type: WORKOUT_VIEW_TYPE, active: true });
	}
}
