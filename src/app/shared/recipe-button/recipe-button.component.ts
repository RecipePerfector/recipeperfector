import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipe-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-button.component.html',
  styleUrl: './recipe-button.component.css'
})
export class RecipeButtonComponent {
  @Input() btnClass = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() isButtonLoading = false;
  @Input() disabled = false;
  @Input() ariaLabel: string | null = null;
  @Input() title: string | null = null;
  @Output() pressed = new EventEmitter<void>();

  onClick() {
    this.pressed.emit();
  }
}
