import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipeField } from '../recipe-row.component';
import { RecipeRowDeleteButtonComponent } from '../recipe-row-delete-button/recipe-row-delete-button.component';
import { RecipeRowDragButtonComponent } from '../recipe-row-drag-button/recipe-row-drag-button.component';

@Component({
  selector: 'app-recipe-row-editable',
  standalone: true,
  imports: [FormsModule, RecipeRowDeleteButtonComponent, RecipeRowDragButtonComponent],
  templateUrl: './recipe-row-editable.component.html',
  styleUrl: './recipe-row-editable.component.css'
})
export class RecipeRowEditableComponent {
  @Input() displayEditable = false;
  @Input({ required: true }) field!: RecipeField;
  @Input() index = 0;
  @Input() isEditing = false;
  @Input() editingDraft = '';
  @Input() canDragSteps = true;
  @Input() isFlashingEditActions = false;
  @Input() isReordering = false;
  @Input() isDragOrigin = false;
  @Input() isRowHovered = false;

  @Output() editingDraftChange = new EventEmitter<string>();
  @Output() deleteRequested = new EventEmitter<MouseEvent>();
  @Output() blockedAction = new EventEmitter<void>();
  @Output() stepActionMouseDown = new EventEmitter<MouseEvent>();
  @Output() dragStartRequested = new EventEmitter<DragEvent>();
  @Output() dragEndRequested = new EventEmitter<DragEvent>();
  @Output() acceptRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  @HostBinding('class.editable')
  get editableClass(): boolean {
    return this.displayEditable;
  }

  @HostBinding('class.is-editing')
  get editingClass(): boolean {
    return this.isEditing;
  }

  @HostBinding('class.reordering')
  get reorderingClass(): boolean {
    return this.isReordering;
  }

  @HostBinding('class.is-drag-origin')
  get dragOriginClass(): boolean {
    return this.isDragOrigin;
  }

  @HostBinding('class.row-hovered')
  get rowHoveredClass(): boolean {
    return this.isRowHovered;
  }

  get stepLabel(): string {
    return this.field === 'ingredients' ? 'ingredient' : 'direction';
  }

  handleEditorClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  handleAcceptClick(event: MouseEvent): void {
    event.stopPropagation();
    this.acceptRequested.emit();
  }

  handleCancelClick(event: MouseEvent): void {
    event.stopPropagation();
    this.cancelRequested.emit();
  }
}