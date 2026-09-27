import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  selector: 'app-recipe-row-delete-button',
  standalone: true,
  templateUrl: './recipe-row-delete-button.component.html',
  styleUrl: './recipe-row-delete-button.component.css'
})
export class RecipeRowDeleteButtonComponent {
  @Input() stepLabel = 'step';
  @Input() index = 0;
  @Input() canDragSteps = true;
  @Input() rowHovered = false;
  @Input() isEditing = false;
  @Input() isReordering = false;

  @Output() buttonMouseDown = new EventEmitter<MouseEvent>();
  @Output() deleteRequested = new EventEmitter<MouseEvent>();

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

  handleMouseDown(event: MouseEvent): void {
    this.buttonMouseDown.emit(event);
  }

  handleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteRequested.emit(event);
  }
}