import { Component } from '@angular/core';
import { RecipeCardComponent } from './recipe-card/recipe-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RecipeCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Recipe Collection';

  recipes = [
    {
      name: 'Crispy Avocado Tacos',
      time: '20 min',
      tag: 'Quick Bite',
      emoji: '🌮',
      description: 'Crunchy tortillas filled with smoky avocado and fresh herbs.'
    },
    {
      name: 'Golden Herb Pasta',
      time: '25 min',
      tag: 'Comfort Food',
      emoji: '🍝',
      description: 'Velvety pasta tossed with roasted garlic and bright herbs.'
    },
    {
      name: 'Berry Parfait Bowl',
      time: '10 min',
      tag: 'Breakfast',
      emoji: '🫐',
      description: 'Layered yogurt, granola, and sweet berries for a quick start.'
    },
    {
      name: 'Maple Roasted Salmon',
      time: '30 min',
      tag: 'Dinner',
      emoji: '🐟',
      description: 'Tender salmon glazed with maple and citrus for a glossy finish.'
    }
  ];
}
