import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { RecipeInstructionComponent } from './recipe-instruction.component';

describe('RecipeInstructionComponent', () => {
  let component: RecipeInstructionComponent;
  let fixture: ComponentFixture<RecipeInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeInstructionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeInstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render the recipe title from the sample data in the page heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-page-title')?.textContent).toContain('Kalua Pig in a Slow Cooker');
  });

  it('should allow editing and saving the recipe title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.recipe-title-trigger')!.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.recipe-title-input')).not.toBeNull();
    const titleInput = compiled.querySelector<HTMLInputElement>('.recipe-title-input')!;
    titleInput.value = 'Sunday Supper';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.save-title-action')!.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.recipe-page-title')?.textContent).toContain('Sunday Supper');
    expect(component.recipeDisplays.every((display) => display.recipeTitle === 'Sunday Supper')).toBeTrue();
  });

  it('should place the black PDF download icon on the right side of the title row', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const pdfButton = compiled.querySelector<HTMLButtonElement>('.recipe-page-heading .recipe-page-pdf-button')!;
    const saveButton = compiled.querySelector<HTMLButtonElement>('.recipe-page-save-button')!;

    expect(compiled.querySelector('.instruction-header .pdf-button')).toBeNull();
    expect(saveButton.title).toBe('Save to Recipe Perfector');
    expect(saveButton.getAttribute('aria-label')).toBe('Save to Recipe Perfector');
    expect(getComputedStyle(saveButton).cursor).toBe('pointer');
    saveButton.click();
    fixture.detectChanges();
    expect(component.pdfConfirmationDisplay).toBeNull();

    expect(getComputedStyle(pdfButton).color).toBe('rgb(0, 0, 0)');
    expect(getComputedStyle(pdfButton).backgroundColor).toBe('rgb(255, 237, 213)');
    pdfButton.click();
    fixture.detectChanges();

    expect(component.pdfConfirmationDisplay?.title).toBe('Yours (Editable)');
    expect(compiled.querySelector('.pdf-confirmation-modal')).not.toBeNull();
  });

  it('should show an undo toast after accepting an edited step', () => {
    const display = component.recipeDisplays.find((recipe) => recipe.editable)!;
    const previousValue = display.ingredients[0];
    component.startEditing(display, 'ingredients', 0);
    component.editingDraft = 'Updated ingredient';
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.is-editing .row-value')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.is-editing .row-editor')).not.toBeNull();

    component.acceptEditing(display, 'ingredients', 0);
    fixture.detectChanges();

    expect(component.pendingStepUpdate?.previousValue).toBe(previousValue);
    expect(component.pendingStepUpdate?.updatedValue).toBe('Updated ingredient');
    expect((fixture.nativeElement as HTMLElement).querySelector('.step-update-toast')).not.toBeNull();

    component.undoStepUpdate();
    expect(display.ingredients[0]).toBe(previousValue);
    expect(component.pendingStepUpdate).toBeNull();
  });

  it('should append and scroll to a new editable row from each section add button', fakeAsync(() => {
    const display = component.recipeDisplays.find((recipe) => recipe.editable)!;
    const compiled = fixture.nativeElement as HTMLElement;
    const scrollIntoView = spyOn(HTMLElement.prototype, 'scrollIntoView').and.stub();
    const ingredientCount = display.ingredients.length;
    const directionCount = display.directions.length;

    compiled.querySelector<HTMLButtonElement>('.add-step-button[aria-label="Add ingredient"]')!.click();
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    expect(display.ingredients.length).toBe(ingredientCount + 1);
    expect(display.ingredients[ingredientCount]).toBe('');
    expect(component.isEditing('ingredients', ingredientCount)).toBeTrue();
    const scrolledIngredient = scrollIntoView.calls.mostRecent().object as HTMLElement;
    expect(scrolledIngredient.dataset['stepField']).toBe('ingredients');
    expect(scrolledIngredient.dataset['stepIndex']).toBe(String(ingredientCount));
    expect(scrollIntoView.calls.mostRecent().args[0]).toEqual({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    });

    compiled.querySelector<HTMLButtonElement>('.add-step-button[aria-label="Add direction"]')!.click();
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    expect(display.directions.length).toBe(directionCount + 1);
    expect(display.directions[directionCount]).toBe('');
    expect(component.isEditing('directions', directionCount)).toBeTrue();
    const scrolledDirection = scrollIntoView.calls.mostRecent().object as HTMLElement;
    expect(scrolledDirection.dataset['stepField']).toBe('directions');
    expect(scrolledDirection.dataset['stepIndex']).toBe(String(directionCount));
    expect(compiled.querySelectorAll('.add-step-button').length).toBe(2);
  }));

  it('should blink the active edit actions when another row drag button is clicked', fakeAsync(() => {
    const display = component.recipeDisplays.find((recipe) => recipe.editable)!;
    component.startEditing(display, 'ingredients', 0);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const moveButton = compiled.querySelector<HTMLButtonElement>(
      '.editable [data-step-field="ingredients"][data-step-index="1"] .move-step-button'
    )!;
    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    moveButton.dispatchEvent(mouseDown);
    moveButton.click();
    tick(0);
    fixture.detectChanges();

    expect(mouseDown.defaultPrevented).toBeTrue();
    expect(component.isEditing('ingredients', 0)).toBeTrue();
    expect(compiled.querySelector('.edit-actions.blink-edit-actions')).not.toBeNull();

    tick(900);
    fixture.detectChanges();
    expect(compiled.querySelector('.edit-actions.blink-edit-actions')).toBeNull();
  }));

  it('should block deleting a row while editing and blink the active edit actions', fakeAsync(() => {
    const display = component.recipeDisplays.find((recipe) => recipe.editable)!;
    const originalIngredients = [...display.ingredients];
    component.startEditing(display, 'ingredients', 0);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButton = compiled.querySelector<HTMLButtonElement>(
      '.editable [data-step-field="ingredients"][data-step-index="1"] .delete-step-button'
    )!;
    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    deleteButton.dispatchEvent(mouseDown);
    deleteButton.click();
    tick(0);
    fixture.detectChanges();

    expect(mouseDown.defaultPrevented).toBeTrue();
    expect(deleteButton.getAttribute('aria-disabled')).toBe('true');
    expect(display.ingredients).toEqual(originalIngredients);
    expect(component.isEditing('ingredients', 0)).toBeTrue();
    expect(compiled.querySelector('.edit-actions.blink-edit-actions')).not.toBeNull();

    tick(900);
    fixture.detectChanges();
    expect(compiled.querySelector('.edit-actions.blink-edit-actions')).toBeNull();
  }));

  it('should reveal the Delete and Drag buttons when an editable row is hovered', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const row = compiled.querySelector<HTMLLIElement>(
      'li.editable[data-step-field="ingredients"][data-step-index="0"]'
    )!;
    row.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const editableContent = row.querySelector<HTMLElement>('app-recipe-row-editable')!;
    expect(row.classList.contains('row-hovered')).toBeTrue();
    expect(editableContent.classList.contains('row-hovered')).toBeTrue();
  });
});
