import { App, Modal } from 'obsidian';
import { ExerciseMenu, WorkoutEntry } from '../types';

const CARDIO_PRESETS = ['Sprint', 'Swim', 'Jog', 'Bike', 'Jump rope'];

export interface ExerciseInputOptions {
	initial?: WorkoutEntry;
	onSave: (entry: WorkoutEntry) => void | Promise<void>;
	onDelete?: () => void | Promise<void>;
}

export class ExerciseInputModal extends Modal {
	private menu: ExerciseMenu;
	private opts: ExerciseInputOptions;

	constructor(app: App, menu: ExerciseMenu, opts: ExerciseInputOptions) {
		super(app);
		this.menu = menu;
		this.opts = opts;
	}

	private get isEditing(): boolean {
		return !!this.opts.initial;
	}

	onOpen(): void {
		this.modalEl.addClass('wt-modal');
		const { contentEl } = this;
		contentEl.empty();

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

		header.createEl('h3', {
			cls: 'wt-sheet-title',
			text: this.menu.name,
		});

		const close = header.createEl('button', { cls: 'wt-icon-btn', text: '✕' });
		close.setAttribute('aria-label', 'Close');
		close.addEventListener('click', () => this.close());
	}

	private renderSetsForm(container: HTMLElement): void {
		const initial = this.opts.initial?.type === 'sets' ? this.opts.initial : null;
		const sets: number[] = initial ? [...initial.sets] : [];
		let value = '';
		let editingIdx: number | null = null;
		let comment = initial?.comment ?? '';
		let showComment = !!initial?.comment;

		// Forward refs so callbacks can call updaters declared later.
		let refreshAll: () => void = () => {};
		let refreshSave: () => void = () => {};

		const stage = container.createDiv('wt-num-stage');
		const labelEl = stage.createDiv({ cls: 'wt-num-label' });
		const chipsEl = stage.createDiv('wt-sets-chips');
		const display = stage.createDiv('wt-num-display wt-empty');

		const renderChips = () => {
			chipsEl.empty();
			sets.forEach((s, i) => {
				const chip = chipsEl.createEl('button', {
					cls: 'wt-set-chip' + (editingIdx === i ? ' wt-editing' : ''),
					text: `+${s}`,
				});
				chip.addEventListener('click', () => {
					value = String(s);
					editingIdx = i;
					refreshAll();
				});
			});
		};

		const numpad = this.renderNumpad(container, {
			onDigit: (d: string) => {
				if (value.length >= 3) return;
				value = value + d;
				refreshAll();
			},
			onBackspace: () => {
				value = value.slice(0, -1);
				refreshAll();
			},
			onAction: () => {
				const n = parseInt(value, 10);
				if (!n || n <= 0) return;
				if (editingIdx !== null) {
					sets[editingIdx] = n;
					editingIdx = null;
				} else {
					sets.push(n);
				}
				value = '';
				refreshAll();
			},
			actionLabel: '+ SET',
			isActionDisabled: () => !value || parseInt(value, 10) <= 0,
		});

		// Delete-current-set link (only visible while editing a chip)
		const deleteSetBtn = container.createEl('button', {
			cls: 'wt-comment-toggle wt-danger wt-hidden',
			text: 'Delete this set',
		});
		deleteSetBtn.addEventListener('click', () => {
			if (editingIdx === null) return;
			sets.splice(editingIdx, 1);
			editingIdx = null;
			value = '';
			refreshAll();
		});

		const commentToggle = container.createEl('button', {
			cls: 'wt-comment-toggle' + (showComment ? ' wt-hidden' : ''),
			text: 'Add note',
		});
		const commentInput = container.createEl('textarea', {
			cls: 'wt-comment-input' + (showComment ? '' : ' wt-hidden'),
			attr: { placeholder: 'Note (optional)' },
		});
		commentInput.value = comment;
		commentInput.addEventListener('input', () => {
			comment = commentInput.value;
		});
		commentToggle.addEventListener('click', () => {
			showComment = true;
			commentInput.removeClass('wt-hidden');
			commentToggle.addClass('wt-hidden');
			commentInput.focus();
		});

		const footer = container.createDiv('wt-sheet-footer');
		this.renderFooter(footer, {
			onSave: () => {
				const finalSets = value && parseInt(value, 10) > 0 && editingIdx === null
					? [...sets, parseInt(value, 10)]
					: sets;
				if (finalSets.length === 0) return;
				this.close();
				void this.opts.onSave({
					menu: this.menu.name,
					type: 'sets',
					sets: finalSets,
					comment,
				});
			},
			canSave: () =>
				sets.length > 0 ||
				(!!value && parseInt(value, 10) > 0 && editingIdx === null),
			registerSaveRefresh: fn => {
				refreshSave = fn;
			},
		});

		refreshAll = () => {
			labelEl.setText(
				editingIdx !== null ? `Editing Set ${editingIdx + 1}` : `Set ${sets.length + 1}`
			);
			renderChips();
			display.empty();
			display.toggleClass('wt-empty', value === '');
			display.appendText(value === '' ? '0' : value);
			display.createSpan({ cls: 'wt-suffix', text: 'reps' });
			numpad.actionBtn.setText(editingIdx !== null ? '✓ SAVE' : '+ SET');
			deleteSetBtn.toggleClass('wt-hidden', editingIdx === null);
			refreshSave();
		};
		refreshAll();
	}

	private renderEmomForm(container: HTMLElement): void {
		const initial = this.opts.initial?.type === 'emom' ? this.opts.initial : null;
		let reps = initial ? String(initial.reps) : '';
		let setCount = initial ? String(initial.sets) : '';
		let active: 'reps' | 'sets' = 'reps';
		let comment = initial?.comment ?? '';
		let showComment = !!initial?.comment;

		const stage = container.createDiv('wt-num-stage');
		stage.createDiv({ cls: 'wt-num-label', text: 'EMOM · every minute' });

		const grid = container.createDiv('wt-emom-grid');
		const repsField = grid.createDiv('wt-emom-field wt-active');
		repsField.createDiv({ cls: 'wt-emom-field-label', text: 'REPS' });
		const repsValue = repsField.createDiv({ cls: 'wt-emom-field-value', text: reps || '—' });

		grid.createDiv({ cls: 'wt-emom-times', text: '×' });

		const setsField = grid.createDiv('wt-emom-field');
		setsField.createDiv({ cls: 'wt-emom-field-label', text: 'SETS' });
		const setsValue = setsField.createDiv({ cls: 'wt-emom-field-value', text: setCount || '—' });

		const updateFields = () => {
			repsField.toggleClass('wt-active', active === 'reps');
			setsField.toggleClass('wt-active', active === 'sets');
			repsValue.setText(reps || '—');
			setsValue.setText(setCount || '—');
		};

		repsField.addEventListener('click', () => {
			active = 'reps';
			updateFields();
			updateActionLabel();
		});
		setsField.addEventListener('click', () => {
			active = 'sets';
			updateFields();
			updateActionLabel();
		});

		const handleDigit = (d: string) => {
			const cur = active === 'reps' ? reps : setCount;
			if (cur.length >= 3) return;
			const next = cur + d;
			if (active === 'reps') reps = next;
			else setCount = next;
			updateFields();
			updateSaveState();

			if (active === 'reps' && next.length >= 2 && setCount === '') {
				window.setTimeout(() => {
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
			cls: 'wt-comment-toggle' + (showComment ? ' wt-hidden' : ''),
			text: 'Add note',
		});
		const commentInput = container.createEl('textarea', {
			cls: 'wt-comment-input' + (showComment ? '' : ' wt-hidden'),
			attr: { placeholder: 'Note (optional)' },
		});
		commentInput.value = comment;
		commentInput.addEventListener('input', () => {
			comment = commentInput.value;
		});
		commentToggle.addEventListener('click', () => {
			showComment = true;
			commentInput.removeClass('wt-hidden');
			commentToggle.addClass('wt-hidden');
			commentInput.focus();
		});

		const footer = container.createDiv('wt-sheet-footer');
		let updateSaveStateRefresh = () => {};
		const updateSaveState = () => updateSaveStateRefresh();

		this.renderFooter(footer, {
			onSave: () => {
				const r = parseInt(reps, 10) || 0;
				const s = parseInt(setCount, 10) || 0;
				if (r <= 0 || s <= 0) return;
				this.close();
				void this.opts.onSave({
					menu: this.menu.name,
					type: 'emom',
					reps: r,
					sets: s,
					comment,
				});
			},
			canSave: () => {
				const r = parseInt(reps, 10) || 0;
				const s = parseInt(setCount, 10) || 0;
				return r > 0 && s > 0;
			},
			registerSaveRefresh: refresh => {
				updateSaveStateRefresh = refresh;
			},
		});
	}

	private renderCardioForm(container: HTMLElement): void {
		const initial = this.opts.initial?.type === 'cardio' ? this.opts.initial : null;
		let comment = initial?.comment ?? '';

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
			attr: { placeholder: 'Sprints x8, 20 min run...' },
		});
		commentInput.value = comment;
		commentInput.addEventListener('input', () => {
			comment = commentInput.value;
		});
		window.setTimeout(() => commentInput.focus(), 50);

		const footer = container.createDiv('wt-sheet-footer');
		this.renderFooter(footer, {
			onSave: () => {
				this.close();
				void this.opts.onSave({
					menu: this.menu.name,
					type: 'cardio',
					comment: comment.trim(),
				});
			},
			canSave: () => true,
			registerSaveRefresh: () => {},
		});
	}

	private renderFooter(
		footer: HTMLElement,
		opts: {
			onSave: () => void;
			canSave: () => boolean;
			registerSaveRefresh: (fn: () => void) => void;
		}
	): void {
		if (this.isEditing && this.opts.onDelete) {
			const delBtn = footer.createEl('button', {
				cls: 'wt-btn wt-btn-text wt-btn-danger',
				text: 'Delete',
			});
			delBtn.addEventListener('click', () => {
				this.close();
				void this.opts.onDelete?.();
			});
		} else {
			const cancelBtn = footer.createEl('button', { cls: 'wt-btn wt-btn-text', text: 'Cancel' });
			cancelBtn.addEventListener('click', () => this.close());
		}

		const saveBtn = footer.createEl('button', {
			cls: 'wt-btn wt-btn-primary',
			text: this.isEditing ? 'Update' : 'Save',
		});
		saveBtn.addEventListener('click', () => opts.onSave());

		const refresh = () => {
			saveBtn.disabled = !opts.canSave();
		};
		refresh();
		opts.registerSaveRefresh(refresh);
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

		for (const key of Array.from(pad.querySelectorAll('button'))) {
			key.addEventListener('click', refreshAction);
		}

		refreshAction();
		return { actionBtn: action };
	}
}
