/** The two editable collections shown for every recipe comparison panel. */
export type RecipeField = 'ingredients' | 'directions';

/** Shape of the recipe JSON loaded before comparison panels are created. */
export interface RecipeData {
  title: string;
  ingredients: string[];
  directions: string[];
}

/** A recipe panel as it is displayed and edited on the instructions page. */
export interface RecipeDisplay {
  title: string;
  recipeTitle: string;
  ingredients: string[];
  directions: string[];
  editable: boolean;
}
