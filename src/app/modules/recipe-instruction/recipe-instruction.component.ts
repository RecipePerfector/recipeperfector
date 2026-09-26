import { AfterViewChecked, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
export class RecipeInstructionComponent implements OnInit, AfterViewChecked {
  @ViewChild('comparisonPanels') private comparisonPanels?: ElementRef<HTMLElement>;
  recipeDisplays: RecipeDisplay[] = [];
  pdfConfirmationDisplay: RecipeDisplay | null = null;
  isLoading = true;
  errorMessage = '';
  private editingField: 'ingredients' | 'directions' | null = null;
  private editingIndex: number | null = null;
  private draggedStep: {
    display: RecipeDisplay;
    field: 'ingredients' | 'directions';
    originalSteps: string[];
    originalIndex: number;
    currentIndex: number;
  } | null = null;
  private stepRowLayoutSignature = '';
  editingDraft = '';
  comparisonSelections = new Set<string>();
  hoveredComparison: { title: string; field: 'ingredients' | 'directions'; index: number } | null = null;
  flashComparison: { title: string; field: 'ingredients' | 'directions'; index: number; variant: 'green' | 'red' } | null = null;

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

  ngAfterViewChecked(): void {
    this.syncStepRowHeights();
  }

  @HostListener('window:resize')
  handleViewportResize(): void {
    this.stepRowLayoutSignature = '';
    this.syncStepRowHeights();
  }

  private syncStepRowHeights(): void {
    const container = this.comparisonPanels?.nativeElement;
    if (!container) {
      return;
    }

    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-step-field][data-step-index]'));
    if (rows.length === 0) {
      return;
    }

    const signature = JSON.stringify({
      editingField: this.editingField,
      editingIndex: this.editingIndex,
      editingDraft: this.editingDraft,
      rows: rows.map((row) => [row.dataset['stepField'], row.dataset['stepIndex'], row.clientWidth, row.textContent])
    });
    if (signature === this.stepRowLayoutSignature) {
      return;
    }
    this.stepRowLayoutSignature = signature;

    rows.forEach((row) => row.style.minHeight = '');

    const tallestByStep = new Map<string, number>();
    rows.forEach((row) => {
      const key = `${row.dataset['stepField']}:${row.dataset['stepIndex']}`;
      tallestByStep.set(key, Math.max(tallestByStep.get(key) ?? 0, row.getBoundingClientRect().height));
    });

    rows.forEach((row) => {
      const key = `${row.dataset['stepField']}:${row.dataset['stepIndex']}`;
      row.style.minHeight = `${Math.ceil(tallestByStep.get(key) ?? 0)}px`;
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

  removeStep(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    if (!display.editable || index < 0 || index >= display[field].length) {
      return;
    }

    if (this.editingField === field && this.editingIndex === index) {
      this.cancelEditing();
    } else if (this.editingField === field && this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex -= 1;
    }

    display[field].splice(index, 1);
  }

  canDragSteps(): boolean {
    return this.editingField === null;
  }

  isDraggingStep(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): boolean {
    return this.draggedStep?.display === display &&
      this.draggedStep.field === field &&
      this.draggedStep.currentIndex === index;
  }

  isDraggingDisplay(display: RecipeDisplay): boolean {
    return this.draggedStep?.display === display;
  }

  isDragOrigin(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): boolean {
    return this.draggedStep?.display === display &&
      this.draggedStep.field === field &&
      this.draggedStep.originalIndex === index;
  }

  startStepDrag(event: DragEvent, display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    if (!display.editable || !this.canDragSteps()) {
      event.preventDefault();
      return;
    }

    this.draggedStep = {
      display,
      field,
      originalSteps: [...display[field]],
      originalIndex: index,
      currentIndex: index
    };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${field}:${index}`);
    }
  }

  allowStepDrop(
    event: DragEvent,
    display: RecipeDisplay,
    field: 'ingredients' | 'directions',
    targetIndex: number
  ): void {
    const draggedStep = this.draggedStep;
    if (!display.editable || draggedStep?.display !== display || draggedStep.field !== field) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const targetRow = event.currentTarget as HTMLElement;
    const targetBounds = targetRow.getBoundingClientRect();
    const insertAfterTarget = event.clientY >= targetBounds.top + targetBounds.height / 2;
    const insertionIndex = targetIndex + (insertAfterTarget ? 1 : 0);
    const destinationIndex = Math.max(
      0,
      Math.min(insertionIndex > draggedStep.currentIndex ? insertionIndex - 1 : insertionIndex, display[field].length - 1)
    );

    if (destinationIndex === draggedStep.currentIndex) {
      return;
    }

    const [step] = display[field].splice(draggedStep.currentIndex, 1);
    display[field].splice(destinationIndex, 0, step);
    draggedStep.currentIndex = destinationIndex;
  }

  dropStep(event: DragEvent, display: RecipeDisplay, field: 'ingredients' | 'directions'): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggedStep?.display === display && this.draggedStep.field === field) {
      this.draggedStep = null;
    }
  }

  endStepDrag(event: DragEvent): void {
    if (this.draggedStep) {
      const { display, field, originalSteps } = this.draggedStep;
      display[field].splice(0, display[field].length, ...originalSteps);
    }
    this.draggedStep = null;
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }
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

  isComparisonFlash(
    display: RecipeDisplay,
    field: 'ingredients' | 'directions',
    index: number,
    variant: 'green' | 'red'
  ): boolean {
    return !!this.flashComparison &&
      this.flashComparison.title === display.title &&
      this.flashComparison.field === field &&
      this.flashComparison.index === index &&
      this.flashComparison.variant === variant;
  }

  setHoveredComparison(
    display: RecipeDisplay,
    field: 'ingredients' | 'directions',
    index: number,
    isHovering: boolean
  ): void {
    if (display.title === 'Yours (Editable)') {
      return;
    }

    if (!isHovering) {
      this.hoveredComparison = null;
      return;
    }

    this.hoveredComparison = { title: display.title, field, index };
  }

  triggerComparisonFlash(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    const yours = this.recipeDisplays.find((recipe) => recipe.title === 'Yours (Editable)');
    if (yours && display.title !== 'Yours (Editable)') {
      yours[field][index] = display[field][index];
    }

    this.flashComparison = {
      title: display.title,
      field,
      index,
      variant: 'green'
    };

    if (yours && display.title !== 'Yours (Editable)') {
      this.flashComparison = {
        title: 'Yours (Editable)',
        field,
        index,
        variant: 'green'
      };
      window.setTimeout(() => {
        this.flashComparison = null;
      }, 1800);
      return;
    }

    window.setTimeout(() => {
      this.flashComparison = null;
    }, 1800);
  }

  toggleComparisonSelection(display: RecipeDisplay, field: 'ingredients' | 'directions', index: number): void {
    this.triggerComparisonFlash(display, field, index);
    this.comparisonSelections.delete(`${display.title}-${field}-${index}`);
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
