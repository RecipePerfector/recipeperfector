import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface RecipeInstructionData {
  title: string;
  source: string;
  ingredients: string[];
  directions: string[];
}

@Component({
  selector: 'app-recipe-instruction',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './recipe-instruction.component.html',
  styleUrl: './recipe-instruction.component.css'
})
export class RecipeInstructionComponent implements OnInit {
  recipe: RecipeInstructionData | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<RecipeInstructionData>('assets/example-recipe.json').subscribe({
      next: (data) => {
        this.recipe = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load recipe instructions.';
        this.isLoading = false;
      }
    });
  }
}
