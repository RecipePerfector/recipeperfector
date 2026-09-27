import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recipe-page-heading',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './recipe-page-heading.component.html',
  styleUrl: './recipe-page-heading.component.css'
})
export class RecipePageHeadingComponent {
  @Input() recipeTitle: string | null = null;
  @Output() recipeTitleChange = new EventEmitter<string>();
  @Output() pdfRequested = new EventEmitter<void>();

  isEditingRecipeTitle = false;
  recipeTitleDraft = '';

  startEditingRecipeTitle(): void {
    if (this.recipeTitle === null) {
      return;
    }

    this.recipeTitleDraft = this.recipeTitle;
    this.isEditingRecipeTitle = true;
  }

  acceptRecipeTitle(): void {
    const recipeTitle = this.recipeTitleDraft.trim();
    if (recipeTitle) {
      this.recipeTitleChange.emit(recipeTitle);
    }
    this.cancelRecipeTitleEditing();
  }

  cancelRecipeTitleEditing(): void {
    this.isEditingRecipeTitle = false;
    this.recipeTitleDraft = '';
  }

  requestPdf(): void {
    this.pdfRequested.emit();
  }
}