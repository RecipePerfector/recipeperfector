import { Routes } from '@angular/router';
import { RecipeHomeComponent } from './recipe-home/recipe-home.component';
import { RecipeInstructionComponent } from './recipe-instruction/recipe-instruction.component';

export const routes: Routes = [
  { path: '', component: RecipeHomeComponent },
  { path: 'recipe', component: RecipeInstructionComponent },
  { path: '**', redirectTo: '' }
];
