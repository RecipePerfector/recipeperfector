import { Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipeRowEditableComponent } from './recipe-row-editable/recipe-row-editable.component';
import { RecipeDisplay, RecipeField } from '../../../models/recipe-display.model';

export type { RecipeDisplay, RecipeField } from '../../../models/recipe-display.model';

export type ComparisonSelectionAction = {
  row: number;
  mode: 'replace' | 'insert';
};

@Component({
  selector: 'li[app-recipe-row]',
  standalone: true,
  imports: [FormsModule, RecipeRowEditableComponent],
  templateUrl: './recipe-row.component.html',
  styleUrl: './recipe-row.component.css'
})
export class RecipeRowComponent {
  @HostBinding('class.row-hovered') rowHovered = false;
  @Input({ required: true }) display!: RecipeDisplay;
  @Input({ required: true }) field!: RecipeField;
  @Input() index = 0;
  @Input() isEditing = false;
  @Input() editingDraft = '';
  @Input() canDragSteps = true;
  @Input() isDraggingStep = false;
  @Input() isDragOrigin = false;
  @Input() isSelected = false;
  @Input() comparisonGreen = false;
  @Input() comparisonRed = false;
  @Input() comparisonFlashGreen = false;
  @Input() comparisonFlashRed = false;
  @Input() isFlashingEditActions = false;
  @Input() isReordering = false;
  @Input() comparisonInsertPreview = false;
  @Input() stepValueOverride: string | null = null;
  @Input() editableRowCount = 0;

  @Output() editingDraftChange = new EventEmitter<string>();
  @Output() editRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<MouseEvent>();
  @Output() blockedAction = new EventEmitter<void>();
  @Output() stepActionMouseDown = new EventEmitter<MouseEvent>();
  @Output() dragStartRequested = new EventEmitter<DragEvent>();
  @Output() dragOverRequested = new EventEmitter<DragEvent>();
  @Output() dropRequested = new EventEmitter<DragEvent>();
  @Output() dragEndRequested = new EventEmitter<DragEvent>();
  @Output() comparisonSelectionRequested = new EventEmitter<ComparisonSelectionAction>();
  @Output() comparisonTargetRowChanged = new EventEmitter<number>();
  @Output() comparisonDialogModeChanged = new EventEmitter<'replace' | 'insert'>();
  @Output() comparisonDialogOpenChange = new EventEmitter<boolean>();
  @Output() hoverChanged = new EventEmitter<boolean>();
  @Output() acceptRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  @ViewChild('comparisonSelectionDialog')
  private comparisonSelectionDialog?: ElementRef<HTMLElement>;

  @HostBinding('attr.data-step-field')
  get stepFieldAttribute(): RecipeField {
    return this.field;
  }

  @HostBinding('attr.data-step-index')
  get stepIndexAttribute(): number {
    return this.index;
  }

  @HostBinding('attr.title')
  get titleAttribute(): string | null {
    return this.display?.editable && !this.isEditing ? 'Edit' : null;
  }

  @HostBinding('class.editable')
  get editableClass(): boolean {
    return !!this.display?.editable;
  }

  @HostBinding('class.is-editing')
  get editingClass(): boolean {
    return this.isEditing;
  }

  @HostBinding('class.is-dragging-step')
  get draggingClass(): boolean {
    return this.isDraggingStep;
  }

  @HostBinding('class.is-drag-origin')
  get dragOriginClass(): boolean {
    return this.isDragOrigin;
  }

  @HostBinding('class.is-selected')
  get selectedClass(): boolean {
    return this.isSelected;
  }

  @HostBinding('class.comparison-green')
  get comparisonGreenClass(): boolean {
    return this.comparisonGreen;
  }

  @HostBinding('class.comparison-red')
  get comparisonRedClass(): boolean {
    return this.comparisonRed;
  }

  @HostBinding('class.comparison-flash-green')
  get comparisonFlashGreenClass(): boolean {
    return this.comparisonFlashGreen;
  }

  @HostBinding('class.comparison-flash-red')
  get comparisonFlashRedClass(): boolean {
    return this.comparisonFlashRed;
  }

  @HostBinding('class.reordering')
  get reorderingClass(): boolean {
    return this.isReordering;
  }

  @HostBinding('class.comparison-insert-preview')
  get comparisonInsertPreviewClass(): boolean {
    return this.comparisonInsertPreview;
  }

  comparisonSelectionDialogOpen = false;
  comparisonTargetRow = this.index + 1;
  comparisonDialogTab: 'replace' | 'insert' = 'replace';
  dialogPosition: { left: number; top: number } | null = null;
  private dialogDragOffset: { x: number; y: number } | null = null;

  get stepLabel(): string {
    return this.field === 'ingredients' ? 'ingredient' : 'direction';
  }

  get stepValue(): string {
    return this.stepValueOverride ?? this.display[this.field][this.index];
  }

  get comparisonTargetRowMax(): number {
    return this.editableRowCount + (this.comparisonDialogTab === 'insert' ? 1 : 0);
  }

  get showSingleArrow(): boolean {
    return this.display.title === 'Original';
  }

  get showDoubleArrow(): boolean {
    return this.display.title === 'Crowd Sourced';
  }

  @HostListener('click')
  handleRowClick(): void {
    this.editRequested.emit();
  }

  @HostListener('mouseenter')
  handleMouseEnter(): void {
    this.rowHovered = true;
    this.hoverChanged.emit(true);
  }

  @HostListener('mouseleave')
  handleMouseLeave(): void {
    if (this.comparisonSelectionDialogOpen) {
      return;
    }

    this.rowHovered = false;
    this.hoverChanged.emit(false);
  }

  @HostListener('dragover', ['$event'])
  handleDragOver(event: DragEvent): void {
    this.dragOverRequested.emit(event);
  }

  @HostListener('drop', ['$event'])
  handleDrop(event: DragEvent): void {
    this.dropRequested.emit(event);
  }

  openComparisonSelectionDialog(event: MouseEvent): void {
    event.stopPropagation();
    this.comparisonDialogTab = 'replace';
    this.comparisonTargetRow = this.clampComparisonTargetRow(this.index + 1);
    this.comparisonSelectionDialogOpen = true;
    this.comparisonDialogModeChanged.emit(this.comparisonDialogTab);
    this.dialogPosition = null;
    this.comparisonDialogOpenChange.emit(true);
    this.comparisonTargetRowChanged.emit(this.comparisonTargetRow);
    window.setTimeout(() => {
      this.comparisonSelectionDialog?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }, 0);
  }

  closeComparisonSelectionDialog(event: MouseEvent): void {
    event.stopPropagation();
    this.comparisonSelectionDialogOpen = false;
    this.dialogPosition = null;
    this.dialogDragOffset = null;
    this.comparisonDialogOpenChange.emit(false);
  }

  startDialogDrag(event: MouseEvent): void {
    if (event.button !== 0 || !this.comparisonSelectionDialog) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const dialogRect = this.comparisonSelectionDialog.nativeElement.getBoundingClientRect();
    this.dialogPosition = {
      left: dialogRect.left,
      top: dialogRect.top
    };
    this.dialogDragOffset = {
      x: event.clientX - dialogRect.left,
      y: event.clientY - dialogRect.top
    };
  }

  @HostListener('document:mousemove', ['$event'])
  dragDialog(event: MouseEvent): void {
    if (!this.dialogDragOffset || !this.comparisonSelectionDialog) {
      return;
    }

    const dialogRect = this.comparisonSelectionDialog.nativeElement.getBoundingClientRect();
    const left = event.clientX - this.dialogDragOffset.x;
    const top = event.clientY - this.dialogDragOffset.y;
    this.dialogPosition = {
      left: Math.max(0, Math.min(left, window.innerWidth - dialogRect.width)),
      top: Math.max(0, Math.min(top, window.innerHeight - dialogRect.height))
    };
  }

  @HostListener('document:mouseup')
  stopDialogDrag(): void {
    this.dialogDragOffset = null;
  }

  selectComparisonDialogTab(tab: 'replace' | 'insert', event: MouseEvent): void {
    event.stopPropagation();
    this.comparisonDialogTab = tab;
    this.comparisonTargetRow = this.clampComparisonTargetRow(this.comparisonTargetRow);
    this.comparisonDialogModeChanged.emit(tab);
    this.comparisonTargetRowChanged.emit(this.comparisonTargetRow);
  }

  comparisonTargetRowChangedHandler(row: number): void {
    this.comparisonTargetRow = this.clampComparisonTargetRow(row);
    this.comparisonTargetRowChanged.emit(this.comparisonTargetRow);
  }

  private clampComparisonTargetRow(row: number): number {
    const parsedRow = Number(row);
    if (!Number.isFinite(parsedRow)) {
      return 1;
    }

    return Math.min(Math.max(1, Math.trunc(parsedRow)), this.comparisonTargetRowMax);
  }

  @HostListener('document:click', ['$event'])
  closeComparisonSelectionDialogOnOutsideClick(event: MouseEvent): void {
    if (!this.comparisonSelectionDialogOpen) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node) || !this.comparisonSelectionDialog?.nativeElement.contains(target)) {
      this.comparisonSelectionDialogOpen = false;
      this.comparisonDialogOpenChange.emit(false);
    }
  }

  handleComparisonSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.comparisonSelectionRequested.emit({
      row: this.comparisonTargetRow,
      mode: this.comparisonDialogTab
    });
    this.comparisonSelectionDialogOpen = false;
    this.dialogPosition = null;
    this.comparisonDialogOpenChange.emit(false);
  }

  handleComparisonFocus(isFocused: boolean): void {
    if (!isFocused && this.comparisonSelectionDialogOpen) {
      return;
    }

    this.hoverChanged.emit(isFocused);
  }

}