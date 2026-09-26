import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface RecipeData {
  title: string;
  ingredients: string[];
  directions: string[];
}

interface RecipeDisplay extends RecipeData {
  title: string;
  recipeTitle: string;
  editable: boolean;
}

@Component({
  selector: 'app-recipe-instruction',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterLink],
  templateUrl: './recipe-instruction.component.html',
  styleUrl: './recipe-instruction.component.css'
})
export class RecipeInstructionComponent implements OnInit {
  recipeDisplays: RecipeDisplay[] = [];
  pdfConfirmationDisplay: RecipeDisplay | null = null;
  isLoading = true;
  errorMessage = '';
  private editingField: 'ingredients' | 'directions' | null = null;
  private editingIndex: number | null = null;
  editingDraft = '';
  comparisonSelections = new Set<string>();
  hoveredComparison: { title: string; field: 'ingredients' | 'directions'; index: number } | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<RecipeData>('assets/example-recipe.json').subscribe({
      next: (data) => {
        this.recipeDisplays = ['Yours (Editable)', 'Original', 'Crowd Sourced'].map((title, index) => ({
          title,
          recipeTitle: data.title,
          ingredients: [...data.ingredients],
          directions: [...data.directions],
          editable: index === 0
        }));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load recipe instructions.';
        this.isLoading = false;
      }
    });
  }

  startEditing(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    if (!display.editable) {
      return;
    }

    if (this.editingField !== null && this.editingIndex !== null) {
      if (this.isEditing(field, index)) {
        return;
      }

      this.acceptEditing(display, this.editingField, this.editingIndex);
    }

    this.editingField = field;
    this.editingIndex = index;
    this.editingDraft = display[field][index];
  }

  isEditing(field: 'ingredients' | 'directions', index: number): boolean {
    return this.editingField === field && this.editingIndex === index;
  }

  isComparisonSelected(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): boolean {
    return this.comparisonSelections.has(`${display.title}-${field}-${index}`);
  }

  isComparisonGreen(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): boolean {
    return !!this.hoveredComparison &&
      this.hoveredComparison.title === display.title &&
      this.hoveredComparison.field === field &&
      this.hoveredComparison.index === index;
  }

  isComparisonRed(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): boolean {
    return !!this.hoveredComparison &&
      display.title === 'Yours (Editable)' &&
      this.hoveredComparison.field === field &&
      this.hoveredComparison.index === index;
  }

  setHoveredComparison(
    display: RecipeDisplay,
    field: 'ingredients' | 'directions',
    index: number,
    isHovering: boolean
  ): void {
    if (isHovering) {
      this.hoveredComparison = { title: display.title, field, index };
      return;
    }

    if (this.hoveredComparison?.title === display.title && this.hoveredComparison.field === field && this.hoveredComparison.index === index) {
      this.hoveredComparison = null;
    }
  }

  toggleComparisonSelection(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    const yours = this.recipeDisplays.find((recipe) => recipe.title === 'Yours (Editable)');
    if (yours && display.title !== 'Yours (Editable)') {
      yours[field][index] = display[field][index];
    }

    const key = `${display.title}-${field}-${index}`;
    if (this.comparisonSelections.has(key)) {
      this.comparisonSelections.delete(key);
    } else {
      this.comparisonSelections.add(key);
    }
  }

  acceptEditing(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    if (this.isEditing(field, index)) {
      display[field][index] = this.editingDraft;
    }
    this.cancelEditing();
  }

  cancelEditing(): void {
    this.editingField = null;
    this.editingIndex = null;
    this.editingDraft = '';
  }

  requestPdfDownload(display: RecipeDisplay): void {
    this.pdfConfirmationDisplay = display;
  }

  closePdfConfirmation(): void {
    this.pdfConfirmationDisplay = null;
  }

  async confirmPdfDownload(): Promise<void> {
    const display = this.pdfConfirmationDisplay;
    this.closePdfConfirmation();
    if (display) {
      await this.exportRecipeAsPdf(display);
    }
  }

  async exportRecipeAsPdf(display: RecipeDisplay): Promise<void> {
    if (this.editingField !== null && this.editingIndex !== null) {
      this.acceptEditing(display, this.editingField, this.editingIndex);
    }

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 48;
    const lineHeight = 16;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (height: number): void => {
      if (y + height > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const signature = 'With Love From RecipePerfector';
    const signatureCanvas = document.createElement('canvas');
    signatureCanvas.width = 1100;
    signatureCanvas.height = 140;
    const context = signatureCanvas.getContext('2d');
    if (context) {
      context.font = 'italic 64px "Segoe Script", "Brush Script MT", cursive';
      context.fillStyle = '#7c2d12';
      context.textBaseline = 'middle';
      context.fillText(signature, 8, 70, 1084);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    const titleLines = pdf.splitTextToSize(display.recipeTitle, contentWidth * 0.54);
    pdf.text(titleLines, margin, y);
    const signatureWidth = contentWidth * 0.42;
    const signatureHeight = signatureCanvas.height / signatureCanvas.width * signatureWidth;
    const signatureX = margin + contentWidth * 0.58;
    if (context) {
      pdf.addImage(signatureCanvas.toDataURL('image/png'), 'PNG', signatureX, y - 16, signatureWidth, signatureHeight);
    } else {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(12);
      pdf.setTextColor('#7c2d12');
      pdf.text(pdf.splitTextToSize(signature, contentWidth * 0.42), signatureX, y);
    }
    y += Math.max(titleLines.length * 24, signatureHeight) + 16;

    const addSection = (title: string, items: string[]): void => {
      ensureSpace(36);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(title, margin, y);
      y += 24;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      items.forEach((item, index) => {
        const lines = pdf.splitTextToSize(`${index + 1}. ${item}`, contentWidth);
        lines.forEach((line: string) => {
          ensureSpace(lineHeight);
          pdf.text(line, margin, y);
          y += lineHeight;
        });
        y += 6;
      });
      y += 12;
    };

    addSection('Ingredients', display.ingredients);
    addSection('Directions', display.directions);

    const filename = display.recipeTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'recipe';
    pdf.save(`${filename}.pdf`);
  }
}
