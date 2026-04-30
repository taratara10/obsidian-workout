import { App, Modal } from 'obsidian';
import { ExerciseMenu, ExerciseType } from '../types';

const TYPE_ORDER: ExerciseType[] = ['sets', 'emom', 'cardio'];
const TYPE_LABELS: Record<ExerciseType, { title: string; icon: string }> = {
	sets: { title: 'Sets', icon: '≡' },
	emom: { title: 'EMOM', icon: '◷' },
	cardio: { title: 'Cardio', icon: '♥' },
};

export class ExerciseSelectModal extends Modal {
	private menus: ExerciseMenu[];
	private onChoose: (menu: ExerciseMenu) => void;

	constructor(app: App, menus: ExerciseMenu[], onChoose: (menu: ExerciseMenu) => void) {
		super(app);
		this.menus = menus;
		this.onChoose = onChoose;
	}

	onOpen(): void {
		this.modalEl.addClass('wt-modal');
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv('wt-sheet-handle');

		const header = contentEl.createDiv('wt-sheet-header');
		header.createEl('h3', { cls: 'wt-sheet-title', text: '種目を選択' });
		const closeBtn = header.createEl('button', { cls: 'wt-icon-btn', text: '×' });
		closeBtn.setAttribute('aria-label', 'Close');
		closeBtn.addEventListener('click', () => this.close());

		const body = contentEl.createDiv('wt-sheet-body');

		for (const type of TYPE_ORDER) {
			const items = this.menus.filter(m => m.type === type);
			if (items.length === 0) continue;

			body.createDiv({ cls: 'wt-section-label', text: TYPE_LABELS[type].title });
			const list = body.createDiv('wt-ex-list');

			for (const menu of items) {
				const btn = list.createEl('button', { cls: 'wt-ex-item' });
				btn.createSpan({ cls: 'wt-ex-icon', text: TYPE_LABELS[menu.type].icon });
				btn.createSpan({ cls: 'wt-ex-name', text: menu.name });
				btn.createSpan({ cls: 'wt-ex-type', text: menu.type });
				btn.addEventListener('click', () => {
					this.close();
					this.onChoose(menu);
				});
			}
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
