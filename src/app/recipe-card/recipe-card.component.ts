import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  @Input() recipe!: {
    name: string;
    time: string;
    tag: string;
    emoji: string;
    description: string;
  };

  isSpinning = false;

  onCardClick() {
    this.isSpinning = true;
    setTimeout(() => {
      this.isSpinning = false;
    }, 600);
  }
}
