import { AfterViewChecked, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RecipePageHeadingComponent } from './recipe-page-heading/recipe-page-heading.component';
import { ComparisonSelectionAction, RecipeDisplay, RecipeField, RecipeRowComponent } from './recipe-row/recipe-row.component';
import { RecipeService } from '../../services/recipe/recipe.service';
import { RecipePdfService } from '../../services/recipe/recipe-pdf.service';
import { RecipeData } from '../../models/recipe-display.model';
import { AuthDialogService } from '../../services/auth-dialog/auth-dialog.service';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-recipe-instruction',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RecipePageHeadingComponent, RecipeRowComponent],
  templateUrl: './recipe-instruction.component.html',
  styleUrl: './recipe-instruction.component.css'
})
export class RecipeInstructionComponent implements OnInit, AfterViewChecked {
  @ViewChild('comparisonPanels') private comparisonPanels?: ElementRef<HTMLElement>;
  recipeDisplays: RecipeDisplay[] = [];
  readonly stepFields: RecipeField[] = ['ingredients', 'directions'];
  pdfConfirmationDisplay: RecipeDisplay | null = null;
  isSavingRecipe = false;
  saveRecipeNotification: { title: string; message: string } | null = null;
  isLoading = true;
  errorMessage = '';
  private editingField: 'ingredients' | 'directions' | null = null;
  private editingIndex: number | null = null;
  private editingDisplay: RecipeDisplay | null = null;
  private draggedStep: {
    display: RecipeDisplay;
    field: 'ingredients' | 'directions';
    originalSteps: string[];
    originalIndex: number;
    currentIndex: number;
  } | null = null;
  private pendingStepScroll: { field: 'ingredients' | 'directions'; index: number } | null = null;
  private stepRowLayoutSignature = '';
  private undoToastTimeout: number | null = null;
  private editActionsFlashTimeout: number | null = null;
  flashingEditActions: { field: 'ingredients' | 'directions'; index: number } | null = null;
  pendingStepUpdate: {
    display: RecipeDisplay;
    field: 'ingredients' | 'directions';
    index: number;
    hadPreviousValue: boolean;
    previousValue: string | undefined;
    updatedValue: string;
  } | null = null;
  editingDraft = '';
  comparisonSelections = new Set<string>();
  comparisonDialogOpen = false;
  comparisonDialogMode: 'replace' | 'insert' = 'replace';
  hoveredComparison: { title: string; field: 'ingredients' | 'directions'; index: number } | null = null;
  hoveredComparisonTarget: { field: 'ingredients' | 'directions'; index: number } | null = null;
  flashComparison: { title: string; field: 'ingredients' | 'directions'; index: number; variant: 'green' | 'red' } | null = null;

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private recipePdfService: RecipePdfService,
    private userService: UserService,
    private authDialog: AuthDialogService
  ) {}

  ngOnInit(): void {
    this.http.get<RecipeData>('assets/example-recipe.json').subscribe({
      next: (data) => {
        this.recipeDisplays = ['Yours (Editable)', 'Original', 'Crowd Sourced'].map((title, index) => ({
          title,
          recipeTitle: data.title,
          ingredients: [...data.ingredients],
          directions: [...data.directions],
          editable: index === 0
        }));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load recipe instructions.';
        this.isLoading = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    this.syncStepRowHeights();
    this.scrollPendingStepIntoView();
  }

  @HostListener('window:resize')
  handleViewportResize(): void {
    this.stepRowLayoutSignature = '';
    this.syncStepRowHeights();
  }

  private syncStepRowHeights(): void {
    const container = this.comparisonPanels?.nativeElement;
    if (!container) {
      return;
    }

    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-step-field][data-step-index]'));
    if (rows.length === 0) {
      return;
    }

    const signature = JSON.stringify({
      editingField: this.editingField,
      editingIndex: this.editingIndex,
      editingDraft: this.editingDraft,
      rows: rows.map((row) => [row.dataset['stepField'], row.dataset['stepIndex'], row.clientWidth, row.textContent])
    });
    if (signature === this.stepRowLayoutSignature) {
      return;
    }
    this.stepRowLayoutSignature = signature;

    rows.forEach((row) => row.style.minHeight = '');

    const tallestByStep = new Map<string, number>();
    rows.forEach((row) => {
      const key = `${row.dataset['stepField']}:${row.dataset['stepIndex']}`;
      tallestByStep.set(key, Math.max(tallestByStep.get(key) ?? 0, row.getBoundingClientRect().height));
    });

    rows.forEach((row) => {
      const key = `${row.dataset['stepField']}:${row.dataset['stepIndex']}`;
      row.style.minHeight = `${Math.ceil(tallestByStep.get(key) ?? 0)}px`;
    });
  }

  private scrollPendingStepIntoView(): void {
    const container = this.comparisonPanels?.nativeElement;
    const pendingStep = this.pendingStepScroll;
    if (!container || !pendingStep) {
      return;
    }

    const row = container.querySelector<HTMLElement>(
      `[data-step-field="${pendingStep.field}"][data-step-index="${pendingStep.index}"]`
    );
    if (!row) {
      return;
    }

    this.pendingStepScroll = null;
    window.setTimeout(() => {
      if (!row.isConnected || !this.isEditing(pendingStep.field, pendingStep.index)) {
        return;
      }

      row.querySelector<HTMLTextAreaElement>('.row-editor')?.focus({ preventScroll: true });
      row.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }, 0);
  }

  updateRecipeTitle(recipeTitle: string): void {
    this.recipeDisplays.forEach((display) => display.recipeTitle = recipeTitle);
  }

  getDisplayedSteps(display: RecipeDisplay, field: RecipeField): string[] {
    if (
      !display.editable ||
      !this.comparisonDialogOpen ||
      this.hoveredComparisonTarget?.field !== field ||
      !this.hoveredComparison
    ) {
      return display[field];
    }

    const sourceDisplay = this.recipeDisplays.find((candidate) => candidate.title === this.hoveredComparison?.title);
    const sourceValue = sourceDisplay?.[field][this.hoveredComparison.index];
    if (sourceValue === undefined) {
      return display[field];
    }

    const previewSteps = [...display[field]];
    const targetIndex = Math.min(this.hoveredComparisonTarget.index, previewSteps.length - 1);
    if (this.comparisonDialogMode === 'insert') {
      previewSteps.splice(Math.min(this.hoveredComparisonTarget.index, previewSteps.length), 0, sourceValue);
    } else if (targetIndex >= 0) {
      previewSteps[targetIndex] = sourceValue;
    }

    return previewSteps;
  }

  requestPdfDownloadForEditableRecipe(): void {
    const display = this.recipeDisplays.find((recipe) => recipe.editable);
    if (display) {
      this.requestPdfDownload(display);
    }
  }

  async saveEditableRecipe(): Promise<void> {
    // The page is public, but saving needs an account: prompt for login instead.
    if (!this.userService.isUserLoggedIn()) {
      this.authDialog.requestLogin('You need to be logged in before saving a recipe.');
      return;
    }

    const display = this.recipeDisplays.find((recipe) => recipe.editable);
    const originalPanel = this.recipeDisplays.find((recipe) => recipe.title === 'Original');
    const crowdSourcePanel = this.recipeDisplays.find((recipe) => recipe.title === 'Crowd Sourced');
    if (!display || !originalPanel || !crowdSourcePanel) {
      return;
    }

    this.isSavingRecipe = true;
    this.saveRecipeNotification = null;
    try {
      const saveRecipeResponse = await this.recipeService.saveRecipe(display, originalPanel, crowdSourcePanel);
      if (typeof saveRecipeResponse === 'object' && saveRecipeResponse !== null) {
        const response = saveRecipeResponse as { success?: unknown; error?: unknown };
        if (response.success === true) {
          this.saveRecipeNotification = {
            title: 'Recipe Saved',
            message: 'Recipe Successfully Saved'
          };
        } else if (typeof response.error === 'string') {
          this.saveRecipeNotification = {
            title: 'Recipe Could Not Be Saved',
            message: response.error
          };
        }
      }
    } finally {
      this.isSavingRecipe = false;
    }
  }

  addStep(display: RecipeDisplay, field: RecipeField): void {
    if (!display.editable) {
      return;
    }

    const index = display[field].length;
    display[field].push('');
    this.startEditing(display, field, index);
    this.pendingStepScroll = { field, index };
  }

  startEditing(display: RecipeDisplay, field: RecipeField, index: number): void {
    if (!display.editable) {
      return;
    }

    if (this.editingField !== null && this.editingIndex !== null) {
      if (this.isEditing(field, index)) {
        return;
      }

      this.acceptEditing(display, this.editingField, this.editingIndex);
    }

    this.editingField = field;
    this.editingIndex = index;
    this.editingDisplay = display;
    this.editingDraft = display[field][index];
  }

  isEditing(field: RecipeField, index: number): boolean {
    return this.editingField === field && this.editingIndex === index;
  }

  isEditingRow(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return this.editingDisplay === display && this.isEditing(field, index);
  }

  removeStep(display: RecipeDisplay, field: RecipeField, index: number): void {
    if (!display.editable || index < 0 || index >= display[field].length) {
      return;
    }

    if (this.editingField === field && this.editingIndex === index) {
      this.cancelEditing();
    } else if (this.editingField === field && this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex -= 1;
    }

    display[field].splice(index, 1);
  }

  handleDeleteStepClick(
    event: MouseEvent,
    display: RecipeDisplay,
    field: RecipeField,
    index: number
  ): void {
    event.stopPropagation();
    if (!this.canDragSteps()) {
      this.flashEditingActionsForBlockedAction(display, field, index);
      return;
    }

    this.removeStep(display, field, index);
  }

  canDragSteps(): boolean {
    return this.editingField === null;
  }

  holdEditorFocusForStepAction(event: MouseEvent): void {
    if (!this.canDragSteps()) {
      event.preventDefault();
    }
  }

  flashEditingActionsForBlockedAction(
    display: RecipeDisplay,
    field: 'ingredients' | 'directions',
    index: number
  ): void {
    if (!display.editable || this.editingField === null || this.editingIndex === null || this.isEditing(field, index)) {
      return;
    }

    const editingTarget = { field: this.editingField, index: this.editingIndex };
    if (this.editActionsFlashTimeout !== null) {
      window.clearTimeout(this.editActionsFlashTimeout);
    }

    this.flashingEditActions = null;
    this.editActionsFlashTimeout = window.setTimeout(() => {
      if (!this.isEditing(editingTarget.field, editingTarget.index)) {
        this.editActionsFlashTimeout = null;
        return;
      }

      this.flashingEditActions = editingTarget;
      this.editActionsFlashTimeout = window.setTimeout(() => {
        this.flashingEditActions = null;
        this.editActionsFlashTimeout = null;
      }, 900);
    }, 0);
  }

  isFlashingEditActions(field: 'ingredients' | 'directions', index: number): boolean {
    return this.flashingEditActions?.field === field && this.flashingEditActions.index === index;
  }

  isDraggingStep(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return this.draggedStep?.display === display &&
      this.draggedStep.field === field &&
      this.draggedStep.currentIndex === index;
  }

  isDraggingDisplay(display: RecipeDisplay): boolean {
    return this.draggedStep?.display === display;
  }

  isDragOrigin(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return this.draggedStep?.display === display &&
      this.draggedStep.field === field &&
      this.draggedStep.originalIndex === index;
  }

  startStepDrag(event: DragEvent, display: RecipeDisplay, field: RecipeField, index: number): void {
    if (!display.editable || !this.canDragSteps()) {
      event.preventDefault();
      return;
    }

    this.draggedStep = {
      display,
      field,
      originalSteps: [...display[field]],
      originalIndex: index,
      currentIndex: index
    };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${field}:${index}`);
    }
  }

  allowStepDrop(
    event: DragEvent,
    display: RecipeDisplay,
    field: RecipeField,
    targetIndex: number
  ): void {
    const draggedStep = this.draggedStep;
    if (!display.editable || draggedStep?.display !== display || draggedStep.field !== field) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const targetRow = event.currentTarget as HTMLElement;
    const targetBounds = targetRow.getBoundingClientRect();
    const insertAfterTarget = event.clientY >= targetBounds.top + targetBounds.height / 2;
    const insertionIndex = targetIndex + (insertAfterTarget ? 1 : 0);
    const destinationIndex = Math.max(
      0,
      Math.min(insertionIndex > draggedStep.currentIndex ? insertionIndex - 1 : insertionIndex, display[field].length - 1)
    );

    if (destinationIndex === draggedStep.currentIndex) {
      return;
    }

    const [step] = display[field].splice(draggedStep.currentIndex, 1);
    display[field].splice(destinationIndex, 0, step);
    draggedStep.currentIndex = destinationIndex;
  }

  dropStep(event: DragEvent, display: RecipeDisplay, field: RecipeField): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggedStep?.display === display && this.draggedStep.field === field) {
      this.draggedStep = null;
    }
  }

  endStepDrag(event: DragEvent): void {
    if (this.draggedStep) {
      const { display, field, originalSteps } = this.draggedStep;
      display[field].splice(0, display[field].length, ...originalSteps);
    }
    this.draggedStep = null;
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }
  }

  isComparisonSelected(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return this.comparisonSelections.has(`${display.title}-${field}-${index}`);
  }

  isComparisonGreen(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return !!this.hoveredComparison &&
      this.hoveredComparison.title === display.title &&
      this.hoveredComparison.field === field &&
      this.hoveredComparison.index === index;
  }

  isComparisonRed(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return !!this.hoveredComparison &&
      display.title === 'Yours (Editable)' &&
      this.hoveredComparisonTarget?.field === field &&
      this.hoveredComparisonTarget.index === index;
  }

  isComparisonInsertPreview(display: RecipeDisplay, field: RecipeField, index: number): boolean {
    return this.comparisonDialogOpen &&
      this.comparisonDialogMode === 'insert' &&
      display.title === 'Yours (Editable)' &&
      this.hoveredComparisonTarget?.field === field &&
      this.hoveredComparisonTarget.index === index;
  }

  isComparisonFlash(
    display: RecipeDisplay,
    field: RecipeField,
    index: number,
    variant: 'green' | 'red'
  ): boolean {
    return !!this.flashComparison &&
      this.flashComparison.title === display.title &&
      this.flashComparison.field === field &&
      this.flashComparison.index === index &&
      this.flashComparison.variant === variant;
  }

  setHoveredComparison(
    display: RecipeDisplay,
    field: RecipeField,
    index: number,
    isHovering: boolean
  ): void {
    if (this.comparisonDialogOpen) {
      return;
    }

    if (display.title === 'Yours (Editable)') {
      return;
    }

    if (!isHovering) {
      this.hoveredComparison = null;
      this.hoveredComparisonTarget = null;
      return;
    }

    this.hoveredComparison = { title: display.title, field, index };
    this.hoveredComparisonTarget = { field, index };
  }

  setHoveredComparisonTarget(display: RecipeDisplay, field: RecipeField, replacementRow: number): void {
    if (display.title === 'Yours (Editable)') {
      return;
    }

    this.hoveredComparisonTarget = {
      field,
      index: this.comparisonDialogMode === 'insert'
        ? Math.min(Math.max(0, replacementRow - 1), this.getEditableStepsLength(field))
        : Math.max(0, replacementRow - 1)
    };
  }

  setComparisonDialogMode(mode: 'replace' | 'insert'): void {
    this.comparisonDialogMode = mode;
    if (mode === 'insert' && this.hoveredComparisonTarget) {
      this.hoveredComparisonTarget = {
        ...this.hoveredComparisonTarget,
        index: Math.min(
          this.hoveredComparisonTarget.index,
          this.getEditableStepsLength(this.hoveredComparisonTarget.field)
        )
      };
    }
  }

  getEditableStepsLength(field: RecipeField): number {
    return this.recipeDisplays.find((display) => display.title === 'Yours (Editable)')?.[field].length ?? 0;
  }

  setComparisonDialogOpen(isOpen: boolean): void {
    this.comparisonDialogOpen = isOpen;
  }

  triggerComparisonFlash(
    display: RecipeDisplay,
    field: 'ingredients' | 'directions',
    index: number,
    replacementIndex = index,
    mode: 'replace' | 'insert' = 'replace'
  ): void {
    const yours = this.recipeDisplays.find((recipe) => recipe.title === 'Yours (Editable)');
    let yoursIndex = replacementIndex;
    if (yours && display.title !== 'Yours (Editable)') {
      const steps = yours[field];
      const updatedValue = display[field][index];
      const destinationIndex = mode === 'insert'
        ? Math.min(replacementIndex, steps.length)
        : replacementIndex;
      const hadPreviousValue = mode === 'replace' && destinationIndex < steps.length;
      const previousValue = steps[destinationIndex];

      if (mode === 'insert') {
        steps.splice(destinationIndex, 0, updatedValue);
        yoursIndex = destinationIndex;
      } else if (hadPreviousValue) {
        steps[destinationIndex] = updatedValue;
      } else {
        yoursIndex = steps.length;
        steps.push(updatedValue);
      }

      this.pendingStepUpdate = {
        display: yours,
        field,
        index: yoursIndex,
        hadPreviousValue,
        previousValue,
        updatedValue
      };
      this.scheduleUndoToastDismissal();
    }

    this.flashComparison = {
      title: display.title,
      field,
      index,
      variant: 'green'
    };

    if (yours && display.title !== 'Yours (Editable)') {
      this.flashComparison = {
        title: 'Yours (Editable)',
        field,
        index: yoursIndex,
        variant: 'green'
      };
      window.setTimeout(() => {
        this.flashComparison = null;
      }, 1800);
      return;
    }

    window.setTimeout(() => {
      this.flashComparison = null;
    }, 1800);
  }

  undoStepUpdate(): void {
    const update = this.pendingStepUpdate;
    if (!update) {
      return;
    }

    const steps = update.display[update.field];
    if (update.hadPreviousValue && steps[update.index] === update.updatedValue) {
      steps[update.index] = update.previousValue ?? '';
    } else if (!update.hadPreviousValue && steps[update.index] === update.updatedValue) {
      steps.splice(update.index, 1);
    }

    this.dismissUndoToast();
  }

  private scheduleUndoToastDismissal(): void {
    if (this.undoToastTimeout !== null) {
      window.clearTimeout(this.undoToastTimeout);
    }

    this.undoToastTimeout = window.setTimeout(() => this.dismissUndoToast(), 5000);
  }

  private dismissUndoToast(): void {
    this.pendingStepUpdate = null;
    if (this.undoToastTimeout !== null) {
      window.clearTimeout(this.undoToastTimeout);
      this.undoToastTimeout = null;
    }
  }

  toggleComparisonSelection(
    display: RecipeDisplay,
    field: RecipeField,
    index: number,
    action: ComparisonSelectionAction = { row: index + 1, mode: 'replace' }
  ): void {
    const replacementIndex = Math.max(0, action.row - 1);
    this.triggerComparisonFlash(display, field, index, replacementIndex, action.mode);
    this.comparisonSelections.delete(`${display.title}-${field}-${index}`);
  }

  acceptEditing(display: RecipeDisplay, field: RecipeField, index: number): void {
    if (!this.isEditingRow(display, field, index)) {
      return;
    }

    const previousValue = display[field][index];
    const updatedValue = this.editingDraft;
    display[field][index] = updatedValue;

    if (previousValue !== updatedValue) {
      this.pendingStepUpdate = {
        display,
        field,
        index,
        hadPreviousValue: true,
        previousValue,
        updatedValue
      };
      this.scheduleUndoToastDismissal();
    }
    this.cancelEditing();
  }

  cancelEditing(): void {
    this.editingField = null;
    this.editingIndex = null;
    this.editingDisplay = null;
    this.editingDraft = '';
  }

  requestPdfDownload(display: RecipeDisplay): void {
    this.pdfConfirmationDisplay = display;
  }

  closePdfConfirmation(): void {
    this.pdfConfirmationDisplay = null;
  }

  closeSaveRecipeNotification(): void {
    this.saveRecipeNotification = null;
  }

  async confirmPdfDownload(): Promise<void> {
    const display = this.pdfConfirmationDisplay;
    this.closePdfConfirmation();
    if (display) {
      await this.exportRecipeAsPdf(display);
    }
  }

  async exportRecipeAsPdf(display: RecipeDisplay): Promise<void> {
    if (this.editingField !== null && this.editingIndex !== null) {
      this.acceptEditing(display, this.editingField, this.editingIndex);
    }

    await this.recipePdfService.export(display);
  }
}
