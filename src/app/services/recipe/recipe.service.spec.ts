import { TestBed } from '@angular/core/testing';

import { ApiService } from '../api/api.service';
import { UserService } from '../user/user.service';
import { RecipeService } from './recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;
  let api: jasmine.SpyObj<ApiService>;
  let user: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['callAPIPost']);
    user = jasmine.createSpyObj<UserService>('UserService', ['getAuthToken']);
    api.callAPIPost.and.returnValue(Promise.resolve({ success: true }));
    user.getAuthToken.and.returnValue('saved-auth-token');

    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        { provide: ApiService, useValue: api },
        { provide: UserService, useValue: user }
      ]
    });
    service = TestBed.inject(RecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sends the saved recipe with the current authentication token', async () => {
    const recipe = { recipeTitle: 'Sunday Supper', id: 'recipe' };
    const originalPanel = { recipeTitle: 'Sunday Supper', title: 'Original' };
    const crowdSourcePanel = { recipeTitle: 'Sunday Supper', title: 'Crowd Sourced' };

    await service.saveRecipe(recipe, originalPanel, crowdSourcePanel);

    expect(api.callAPIPost).toHaveBeenCalledWith('/api/recipe/save', {
      recipeTitle: 'Sunday Supper',
      recipe: { id: 'recipe' },
      originalPanel: { title: 'Original' },
      crowdSourcePanel: { title: 'Crowd Sourced' }
    }, 'saved-auth-token');
  });
});
