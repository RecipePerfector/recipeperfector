import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeButtonComponent } from '../../shared/recipe-button/recipe-button.component';
import { RecipeService } from '../../services/recipe/recipe.service';

export interface SavedRecipe {
  id: string;
  title: string;
}

@Component({
  selector: 'app-user-recipes',
  standalone: true,
  imports: [RecipeButtonComponent],
  templateUrl: './user-recipes.component.html',
  styleUrl: './user-recipes.component.css'
})
export class UserRecipesComponent {
  private recipeService = inject(RecipeService);
  /** Recipes will be populated when saved-recipe loading is implemented. */
  savedRecipes: SavedRecipe[] = [];

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.savedRecipes = await this.recipeService.getUserRecipes();
    console.log('savedRecipes: ', this.savedRecipes);
  }

  editRecipe(recipe: SavedRecipe): void {
    void this.router.navigate(['/recipe'], { queryParams: { recipeId: recipe.id } });
  }

  deleteRecipe(recipe: SavedRecipe): void {
    this.savedRecipes = this.savedRecipes.filter(({ id }) => id !== recipe.id);
  }
}
