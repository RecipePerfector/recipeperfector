import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';
import { RecipeRowEditableComponent } from './recipe-row-editable/recipe-row-editable.component';

export type RecipeField = 'ingredients' | 'directions';

export interface RecipeDisplay {
  title: string;
  recipeTitle: string;
  ingredients: string[];
  directions: string[];
  editable: boolean;
}

@Component({
  selector: 'li[app-recipe-row]',
  standalone: true,
  imports: [RecipeRowEditableComponent],
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

  @Output() editingDraftChange = new EventEmitter<string>();
  @Output() editRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<MouseEvent>();
  @Output() blockedAction = new EventEmitter<void>();
  @Output() stepActionMouseDown = new EventEmitter<MouseEvent>();
  @Output() dragStartRequested = new EventEmitter<DragEvent>();
  @Output() dragOverRequested = new EventEmitter<DragEvent>();
  @Output() dropRequested = new EventEmitter<DragEvent>();
  @Output() dragEndRequested = new EventEmitter<DragEvent>();
  @Output() comparisonSelectionRequested = new EventEmitter<void>();
  @Output() hoverChanged = new EventEmitter<boolean>();
  @Output() acceptRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

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

  get stepLabel(): string {
    return this.field === 'ingredients' ? 'ingredient' : 'direction';
  }

  get stepValue(): string {
    return this.display[this.field][this.index];
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

  handleComparisonSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.comparisonSelectionRequested.emit();
  }

  handleComparisonFocus(isFocused: boolean): void {
    this.hoverChanged.emit(isFocused);
  }

}