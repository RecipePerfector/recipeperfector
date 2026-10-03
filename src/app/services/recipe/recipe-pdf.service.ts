import { Injectable } from '@angular/core';
import { RecipeDisplay } from '../../models/recipe-display.model';

@Injectable({
  providedIn: 'root'
})
export class RecipePdfService {
  /**
   * Builds the printable recipe document separately from the page component.
   * Keeping the jsPDF import here also prevents it from being part of the
   * instructions component's initial application code.
   */
  async export(display: RecipeDisplay): Promise<void> {
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
