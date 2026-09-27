import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  selector: 'app-recipe-row-drag-button',
  standalone: true,
  templateUrl: './recipe-row-drag-button.component.html',
  styleUrl: './recipe-row-drag-button.component.css'
})
export class RecipeRowDragButtonComponent {
  @Input() stepLabel = 'step';
  @Input() index = 0;
  @Input() canDragSteps = true;
  @Input() rowHovered = false;
  @Input() isEditing = false;
  @Input() isReordering = false;
  @Input() isDragOrigin = false;

  @Output() buttonMouseDown = new EventEmitter<MouseEvent>();
  @Output() blockedAction = new EventEmitter<void>();
  @Output() dragStart = new EventEmitter<DragEvent>();
  @Output() dragEnd = new EventEmitter<DragEvent>();

  @HostBinding('class.row-hovered')
  get rowHoveredClass(): boolean {
    return this.rowHovered;
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

  handleMouseDown(event: MouseEvent): void {
    this.buttonMouseDown.emit(event);
  }

  handleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.blockedAction.emit();
  }

  handleDragStart(event: DragEvent): void {
    event.stopPropagation();
    this.dragStart.emit(event);
  }

  handleDragEnd(event: DragEvent): void {
    this.dragEnd.emit(event);
  }
}