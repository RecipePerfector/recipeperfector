import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeButtonComponent } from '../../shared/recipe-button/recipe-button.component';
import { RecipeService } from '../../services/recipe/recipe.service';

export interface SavedRecipe {
  id: string;
  title: string;
}

interface DeleteRecipeResponse {
  success: boolean;
  error?: string;
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
  isLoading = true;
  deleteMessage = '';
  deleteMessageType: 'success' | 'error' = 'success';
  deleteDialogOpen = false;
  recipePendingDeletion: SavedRecipe | null = null;

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    try {
      this.savedRecipes = await this.recipeService.getUserRecipes();
      console.log('savedRecipes: ', this.savedRecipes);
    } finally {
      this.isLoading = false;
    }
  }

  editRecipe(recipe: SavedRecipe): void {
    void this.router.navigate(['/recipe'], { queryParams: { recipeId: recipe.id } });
  }

  deleteRecipe(recipe: SavedRecipe): void {
    this.recipePendingDeletion = recipe;
  }

  cancelDelete(): void {
    this.recipePendingDeletion = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.recipePendingDeletion) {
      return;
    }

    const recipe = this.recipePendingDeletion;
    this.recipePendingDeletion = null;
    const deleteResponse = await this.recipeService.deleteUserRecipe(recipe.id) as DeleteRecipeResponse;

    if (deleteResponse.success) {
      this.savedRecipes = this.savedRecipes.filter(({ id }) => id !== recipe.id);
      this.deleteMessage = `${recipe.title} deleted successfully.`;
      this.deleteMessageType = 'success';
    } else {
      this.deleteMessage = `Recipe could not be deleted: ${deleteResponse.error ?? ''}`;
      this.deleteMessageType = 'error';
    }
    this.deleteDialogOpen = true;
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen = false;
  }
}
