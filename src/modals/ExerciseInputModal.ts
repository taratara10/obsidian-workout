import { App, Modal } from 'obsidian';
import { ExerciseMenu, WorkoutEntry } from '../types';

const CARDIO_PRESETS = ['ダッシュ', '水泳', 'ジョギング', '自転車', '縄跳び'];

export class ExerciseInputModal extends Modal {
	private menu: ExerciseMenu;
	private onSave: (entry: WorkoutEntry) => void;

	constructor(app: App, menu: ExerciseMenu, onSave: (entry: WorkoutEntry) => void) {
		super(app);
		this.menu = menu;
		this.onSave = onSave;
	}

	onOpen(): void {
		this.modalEl.addClass('wt-modal');
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv('wt-sheet-handle');
		this.renderSheetHeader(contentEl);

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

	private renderSheetHeader(container: HTMLElement): void {
		const header = container.createDiv('wt-sheet-header');
		const back = header.createEl('button', { cls: 'wt-icon-btn', text: '‹' });
		back.setAttribute('aria-label', 'Back');
		back.addEventListener('click', () => this.close());

		header.createEl('h3', {
			cls: 'wt-sheet-title wt-center',
			text: this.menu.name,
		});

		header.createSpan({ attr: { style: 'width: 36px;' } });
	}

	private renderSetsForm(container: HTMLElement): void {
		const sets: number[] = [];
		let value = '';
		let comment = '';
		let showComment = false;

		const stage = container.createDiv('wt-num-stage');
		const labelEl = stage.createDiv({ cls: 'wt-num-label' });
		const chipsEl = stage.createDiv('wt-sets-chips');
		const display = stage.createDiv('wt-num-display wt-empty');

		const updateDisplay = () => {
			labelEl.setText(`Set ${sets.length + 1}`);

			chipsEl.empty();
			sets.forEach((s, i) => {
				const chip = chipsEl.createSpan({ cls: 'wt-set-chip' });
				chip.createSpan({ cls: 'wt-idx', text: String(i + 1) });
				chip.appendText(`×${s}`);
			});

			display.empty();
			display.toggleClass('wt-empty', value === '');
			display.appendText(value === '' ? '0' : value);
			display.createSpan({ cls: 'wt-suffix', text: 'reps' });
		};
		updateDisplay();

		const addSet = () => {
			const n = parseInt(value, 10);
			if (!n || n <= 0) return;
			sets.push(n);
			value = '';
			updateDisplay();
			updateSaveState();
		};

		const handleDigit = (d: string) => {
			if (value.length >= 3) return;
			value = value + d;
			updateDisplay();
			updateSaveState();
		};
		const handleBack = () => {
			value = value.slice(0, -1);
			updateDisplay();
			updateSaveState();
		};

		this.renderNumpad(container, {
			onDigit: handleDigit,
			onBackspace: handleBack,
			onAction: addSet,
			actionLabel: '+ SET',
			isActionDisabled: () => !value || parseInt(value, 10) <= 0,
		});

		const commentToggle = container.createEl('button', {
			cls: 'wt-comment-toggle',
			text: '💬 メモを追加',
		});
		const commentInput = container.createEl('textarea', {
			cls: 'wt-comment-input wt-hidden',
			attr: { placeholder: 'メモ（任意）' },
		});
		commentInput.addEventListener('input', () => {
			comment = commentInput.value;
		});
		commentToggle.addEventListener('click', () => {
			showComment = !showComment;
			commentInput.toggleClass('wt-hidden', !showComment);
			commentToggle.toggleClass('wt-hidden', showComment);
			if (showComment) commentInput.focus();
		});

		const footer = container.createDiv('wt-sheet-footer');
		const cancelBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-text', text: 'キャンセル' });
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-primary', text: '保存' });
		saveBtn.disabled = true;
		saveBtn.addEventListener('click', () => {
			const finalSets = value && parseInt(value, 10) > 0
				? [...sets, parseInt(value, 10)]
				: sets;
			if (finalSets.length === 0) return;
			this.close();
			this.onSave({
				menu: this.menu.name,
				type: 'sets',
				sets: finalSets,
				comment,
			});
		});

		const updateSaveState = () => {
			const canSave = sets.length > 0 || (!!value && parseInt(value, 10) > 0);
			saveBtn.disabled = !canSave;
		};
	}

	private renderEmomForm(container: HTMLElement): void {
		let reps = '';
		let setCount = '';
		let active: 'reps' | 'sets' = 'reps';
		let comment = '';
		let showComment = false;

		const stage = container.createDiv('wt-num-stage');
		stage.createDiv({ cls: 'wt-num-label', text: 'EMOM · 1分ごと' });

		const grid = container.createDiv('wt-emom-grid');
		const repsField = grid.createDiv('wt-emom-field wt-active');
		repsField.createDiv({ cls: 'wt-emom-field-label', text: 'REPS' });
		const repsValue = repsField.createDiv({ cls: 'wt-emom-field-value', text: '—' });

		grid.createDiv({ cls: 'wt-emom-times', text: '×' });

		const setsField = grid.createDiv('wt-emom-field');
		setsField.createDiv({ cls: 'wt-emom-field-label', text: 'SETS' });
		const setsValue = setsField.createDiv({ cls: 'wt-emom-field-value', text: '—' });

		const updateFields = () => {
			repsField.toggleClass('wt-active', active === 'reps');
			setsField.toggleClass('wt-active', active === 'sets');
			repsValue.setText(reps || '—');
			setsValue.setText(setCount || '—');
		};

		repsField.addEventListener('click', () => {
			active = 'reps';
			updateFields();
		});
		setsField.addEventListener('click', () => {
			active = 'sets';
			updateFields();
		});

		const handleDigit = (d: string) => {
			const cur = active === 'reps' ? reps : setCount;
			if (cur.length >= 3) return;
			const next = cur + d;
			if (active === 'reps') reps = next;
			else setCount = next;
			updateFields();
			updateSaveState();
			updateActionLabel();

			if (active === 'reps' && next.length >= 2 && setCount === '') {
				setTimeout(() => {
					active = 'sets';
					updateFields();
					updateActionLabel();
				}, 200);
			}
		};

		const handleBack = () => {
			if (active === 'reps') reps = reps.slice(0, -1);
			else setCount = setCount.slice(0, -1);
			updateFields();
			updateSaveState();
		};

		const handleSwap = () => {
			active = active === 'reps' ? 'sets' : 'reps';
			updateFields();
			updateActionLabel();
		};

		const numpad = this.renderNumpad(container, {
			onDigit: handleDigit,
			onBackspace: handleBack,
			onAction: handleSwap,
			actionLabel: 'SETS →',
			isActionDisabled: () => false,
		});

		const updateActionLabel = () => {
			numpad.actionBtn.setText(active === 'reps' ? 'SETS →' : '← REPS');
		};

		const commentToggle = container.createEl('button', {
			cls: 'wt-comment-toggle',
			text: '💬 メモを追加',
		});
		const commentInput = container.createEl('textarea', {
			cls: 'wt-comment-input wt-hidden',
			attr: { placeholder: 'メモ（任意）' },
		});
		commentInput.addEventListener('input', () => {
			comment = commentInput.value;
		});
		commentToggle.addEventListener('click', () => {
			showComment = !showComment;
			commentInput.toggleClass('wt-hidden', !showComment);
			commentToggle.toggleClass('wt-hidden', showComment);
			if (showComment) commentInput.focus();
		});

		const footer = container.createDiv('wt-sheet-footer');
		const cancelBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-text', text: 'キャンセル' });
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-primary', text: '保存' });
		saveBtn.disabled = true;
		saveBtn.addEventListener('click', () => {
			const r = parseInt(reps, 10) || 0;
			const s = parseInt(setCount, 10) || 0;
			if (r <= 0 || s <= 0) return;
			this.close();
			this.onSave({
				menu: this.menu.name,
				type: 'emom',
				reps: r,
				sets: s,
				comment,
			});
		});

		const updateSaveState = () => {
			const r = parseInt(reps, 10) || 0;
			const s = parseInt(setCount, 10) || 0;
			saveBtn.disabled = r <= 0 || s <= 0;
		};
	}

	private renderCardioForm(container: HTMLElement): void {
		let comment = '';

		const stage = container.createDiv('wt-num-stage');
		stage.createDiv({ cls: 'wt-num-label', text: 'CARDIO' });

		const presets = container.createDiv('wt-quick-presets');
		for (const p of CARDIO_PRESETS) {
			const chip = presets.createEl('button', { cls: 'wt-preset-chip', text: p });
			chip.addEventListener('click', () => {
				commentInput.value = p;
				comment = p;
				commentInput.focus();
			});
		}

		const commentInput = container.createEl('textarea', {
			cls: 'wt-comment-input wt-cardio-comment',
			attr: { placeholder: '例: ダッシュ 8本' },
		});
		commentInput.addEventListener('input', () => {
			comment = commentInput.value;
		});
		setTimeout(() => commentInput.focus(), 50);

		const footer = container.createDiv('wt-sheet-footer');
		const cancelBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-text', text: 'キャンセル' });
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-primary', text: '保存' });
		saveBtn.addEventListener('click', () => {
			this.close();
			this.onSave({
				menu: this.menu.name,
				type: 'cardio',
				comment: comment.trim(),
			});
		});
	}

	private renderNumpad(
		container: HTMLElement,
		opts: {
			onDigit: (d: string) => void;
			onBackspace: () => void;
			onAction: () => void;
			actionLabel: string;
			isActionDisabled: () => boolean;
		}
	): { actionBtn: HTMLButtonElement } {
		const pad = container.createDiv('wt-numpad');
		const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

		for (const d of digits) {
			const key = pad.createEl('button', { cls: 'wt-numkey', text: d });
			key.addEventListener('click', () => opts.onDigit(d));
		}

		const back = pad.createEl('button', { cls: 'wt-numkey wt-danger', text: '⌫' });
		back.addEventListener('click', () => opts.onBackspace());

		const zero = pad.createEl('button', { cls: 'wt-numkey', text: '0' });
		zero.addEventListener('click', () => opts.onDigit('0'));

		const action = pad.createEl('button', { cls: 'wt-numkey wt-action', text: opts.actionLabel });
		const refreshAction = () => {
			action.disabled = opts.isActionDisabled();
		};
		action.addEventListener('click', () => {
			opts.onAction();
			refreshAction();
		});

		// Refresh disabled state whenever any digit/back is pressed too.
		for (const key of Array.from(pad.querySelectorAll('button'))) {
			key.addEventListener('click', refreshAction);
		}

		refreshAction();
		return { actionBtn: action };
	}
}
