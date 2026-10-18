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
  savedRecipes: SavedRecipe[] = [];
  isLoading = true;
  deleteMessage = '';
  deleteMessageType: 'success' | 'error' = 'success';
  deleteDialogOpen = false;
  recipesPendingDeletion: SavedRecipe[] = [];
  selectedRecipeIds = new Set<string>();

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

  isRecipeSelected(recipe: SavedRecipe): boolean {
    return this.selectedRecipeIds.has(recipe.id);
  }

  toggleRecipeSelection(recipe: SavedRecipe, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    if (event.target.checked) {
      this.selectedRecipeIds.add(recipe.id);
    } else {
      this.selectedRecipeIds.delete(recipe.id);
    }
  }

  cancelDelete(): void {
    this.recipesPendingDeletion = [];
  }

  deleteSelectedRecipes(): void {
    this.recipesPendingDeletion = this.savedRecipes.filter(({ id }) => this.selectedRecipeIds.has(id));
  }

  async confirmDelete(): Promise<void> {
    if (this.recipesPendingDeletion.length === 0) {
      return;
    }

    const recipes = this.recipesPendingDeletion;
    this.recipesPendingDeletion = [];
    const response = await this.recipeService.deleteUserRecipe(
      recipes.map(({ id }) => id)
    ) as DeleteRecipeResponse;
    const deleted = response.success ? recipes : [];
    const failedCount = response.success ? 0 : recipes.length;
    this.savedRecipes = this.savedRecipes.filter(({ id }) => !deleted.some((recipe) => recipe.id === id));
    deleted.forEach(({ id }) => this.selectedRecipeIds.delete(id));

    if (failedCount === 0) {
      this.deleteMessage = `${deleted.length} recipe${deleted.length === 1 ? '' : 's'} deleted successfully.`;
      this.deleteMessageType = 'success';
    } else {
      this.deleteMessage = `${deleted.length} recipe${deleted.length === 1 ? '' : 's'} deleted. ${failedCount} could not be deleted.`;
      this.deleteMessageType = 'error';
    }
    this.deleteDialogOpen = true;
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen = false;
  }
}
