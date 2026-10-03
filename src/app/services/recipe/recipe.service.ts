import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { UserService } from '../user/user.service';

type TitledRecipe = { recipeTitle: string };

function omitRecipeTitle<T extends TitledRecipe>(value: T): Omit<T, 'recipeTitle'> {
  const result = { ...value };
  Reflect.deleteProperty(result, 'recipeTitle');
  return result;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  constructor(private api: ApiService, private user: UserService) { }

  async saveRecipe<T extends TitledRecipe>(
    recipe: T,
    originalPanel: TitledRecipe,
    crowdSourcePanel: TitledRecipe
  ): Promise<any> {
    const response = await this.api.callAPIPost('/api/recipe/save', {
      recipeTitle: recipe.recipeTitle,
      recipe: omitRecipeTitle(recipe),
      originalPanel: omitRecipeTitle(originalPanel),
      crowdSourcePanel: omitRecipeTitle(crowdSourcePanel)
    }, this.user.getAuthToken() ?? undefined);
    return response;
  }
}
