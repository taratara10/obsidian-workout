import { App, Modal } from 'obsidian';
import { ExerciseMenu, WorkoutEntry } from '../types';

export class ExerciseInputModal extends Modal {
	private menu: ExerciseMenu;
	private onSave: (entry: WorkoutEntry) => void;

	constructor(app: App, menu: ExerciseMenu, onSave: (entry: WorkoutEntry) => void) {
		super(app);
		this.menu = menu;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('workout-input-modal');

		contentEl.createEl('h2', { text: this.menu.name });

		const typeLabel = contentEl.createEl('span', {
			text: this.menu.type,
			cls: `workout-menu-type workout-type-${this.menu.type}`,
		});
		typeLabel.style.marginBottom = '16px';
		typeLabel.style.display = 'inline-block';

		if (this.menu.type === 'sets') {
			this.renderSetsForm(contentEl);
		} else if (this.menu.type === 'emom') {
			this.renderEmomForm(contentEl);
		} else {
			this.renderCardioForm(contentEl);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderSetsForm(container: HTMLElement): void {
		const sets: number[] = [0];

		const setsContainer = container.createDiv('workout-sets-container');

		const renderInputs = () => {
			setsContainer.empty();
			sets.forEach((val, i) => {
				const row = setsContainer.createDiv('workout-set-row');
				row.createEl('label', { text: `セット ${i + 1}`, cls: 'workout-set-label' });
				const input = row.createEl('input', { type: 'number', cls: 'workout-reps-input' });
				(input as HTMLInputElement).min = '0';
				(input as HTMLInputElement).value = val > 0 ? String(val) : '';
				(input as HTMLInputElement).placeholder = 'reps';
				input.addEventListener('input', () => {
					sets[i] = parseInt((input as HTMLInputElement).value) || 0;
				});
				const removeBtn = row.createEl('button', { text: '×', cls: 'workout-remove-set-btn' });
				removeBtn.addEventListener('click', e => {
					e.preventDefault();
					sets.splice(i, 1);
					renderInputs();
				});
			});

			const addBtn = setsContainer.createEl('button', {
				text: '+ セット追加',
				cls: 'workout-add-set-btn',
			});
			addBtn.addEventListener('click', e => {
				e.preventDefault();
				sets.push(0);
				renderInputs();
			});
		};

		renderInputs();

		const commentLabel = container.createEl('label', { text: 'コメント（任意）', cls: 'workout-field-label' });
		const commentInput = container.createEl('textarea', { cls: 'workout-comment-input' }) as HTMLTextAreaElement;
		commentInput.placeholder = 'メモを入力...';

		const saveBtn = container.createEl('button', { text: '保存', cls: 'workout-save-btn' });
		saveBtn.addEventListener('click', () => {
			const validSets = sets.filter(s => s > 0);
			if (validSets.length === 0) return;
			this.close();
			this.onSave({
				menu: this.menu.name,
				type: 'sets',
				sets: validSets,
				comment: commentInput.value.trim(),
			});
		});
	}

	private renderEmomForm(container: HTMLElement): void {
		const repsRow = container.createDiv('workout-input-row');
		repsRow.createEl('label', { text: 'Reps（1セットの回数）', cls: 'workout-field-label' });
		const repsInput = repsRow.createEl('input', { type: 'number', cls: 'workout-reps-input' }) as HTMLInputElement;
		repsInput.min = '0';
		repsInput.placeholder = '9';

		const setsRow = container.createDiv('workout-input-row');
		setsRow.createEl('label', { text: 'Sets（セット数）', cls: 'workout-field-label' });
		const setsInput = setsRow.createEl('input', { type: 'number', cls: 'workout-reps-input' }) as HTMLInputElement;
		setsInput.min = '0';
		setsInput.placeholder = '10';

		const preview = container.createDiv('workout-emom-preview');
		const updatePreview = () => {
			const r = repsInput.value || '?';
			const s = setsInput.value || '?';
			preview.textContent = `→ ${r} × ${s}`;
		};
		repsInput.addEventListener('input', updatePreview);
		setsInput.addEventListener('input', updatePreview);

		container.createEl('label', { text: 'コメント（任意）', cls: 'workout-field-label' });
		const commentInput = container.createEl('textarea', { cls: 'workout-comment-input' }) as HTMLTextAreaElement;
		commentInput.placeholder = 'メモを入力...';

		const saveBtn = container.createEl('button', { text: '保存', cls: 'workout-save-btn' });
		saveBtn.addEventListener('click', () => {
			const reps = parseInt(repsInput.value) || 0;
			const sets = parseInt(setsInput.value) || 0;
			if (reps === 0 || sets === 0) return;
			this.close();
			this.onSave({
				menu: this.menu.name,
				type: 'emom',
				reps,
				sets,
				comment: commentInput.value.trim(),
			});
		});
	}

	private renderCardioForm(container: HTMLElement): void {
		container.createEl('label', { text: 'コメント', cls: 'workout-field-label' });
		const commentInput = container.createEl('textarea', { cls: 'workout-comment-input' }) as HTMLTextAreaElement;
		commentInput.placeholder = 'ダッシュ、水泳 1km など...';

		const saveBtn = container.createEl('button', { text: '保存', cls: 'workout-save-btn' });
		saveBtn.addEventListener('click', () => {
			this.close();
			this.onSave({
				menu: this.menu.name,
				type: 'cardio',
				comment: commentInput.value.trim(),
			});
		});
	}
}
