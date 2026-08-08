import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-recipe-button',
  standalone: true,
  templateUrl: './recipe-button.component.html',
  styleUrl: './recipe-button.component.css'
})
export class RecipeButtonComponent {
  @Input() btnClass = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() pressed = new EventEmitter<void>();

  onClick() {
    this.pressed.emit();
  }
}
