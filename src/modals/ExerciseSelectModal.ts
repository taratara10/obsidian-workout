import { App, Modal } from 'obsidian';
import { ExerciseMenu } from '../types';

export class ExerciseSelectModal extends Modal {
	private menus: ExerciseMenu[];
	private onChoose: (menu: ExerciseMenu) => void;

	constructor(app: App, menus: ExerciseMenu[], onChoose: (menu: ExerciseMenu) => void) {
		super(app);
		this.menus = menus;
		this.onChoose = onChoose;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('workout-select-modal');

		contentEl.createEl('h2', { text: '種目を選択' });

		const list = contentEl.createDiv('workout-menu-list');

		for (const menu of this.menus) {
			const btn = list.createEl('button', { cls: 'workout-menu-btn' });
			btn.createEl('span', { text: menu.name, cls: 'workout-menu-btn-name' });
			btn.createEl('span', {
				text: menu.type,
				cls: `workout-menu-type workout-type-${menu.type}`,
			});
			btn.addEventListener('click', () => {
				this.close();
				this.onChoose(menu);
			});
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
