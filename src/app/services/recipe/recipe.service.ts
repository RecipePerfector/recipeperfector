import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  constructor(private api: ApiService) { }

  async saveRecipe(recipe: object): Promise<any> {
    const response = await this.api.callAPIPost('/api/recipe/save', { recipe: recipe });
    return response;
  }
}
