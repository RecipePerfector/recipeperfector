import { Routes } from '@angular/router';
import { RecipeHomeComponent } from './modules/recipe-home/recipe-home.component';
import { RecipeInstructionComponent } from './modules/recipe-instruction/recipe-instruction.component';

export const routes: Routes = [
  { path: '', component: RecipeHomeComponent },
  { path: 'recipe', component: RecipeInstructionComponent },
  { path: '**', redirectTo: '' }
];
