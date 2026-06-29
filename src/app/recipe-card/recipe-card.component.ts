import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onCardClick() {
    this.isSpinning = true;
    this.router.navigate(['/recipe']);
    setTimeout(() => {
      this.isSpinning = false;
    }, 600);
  }
}
