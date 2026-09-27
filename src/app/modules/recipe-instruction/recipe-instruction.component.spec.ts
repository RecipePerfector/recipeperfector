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

  it('should render the recipe title from the sample data', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1-2-3 Jambalaya');
  });

  it('should show an undo toast after accepting an edited step', () => {
    const display = component.recipeDisplays.find((recipe) => recipe.editable)!;
    const previousValue = display.ingredients[0];
    component.startEditing(display, 'ingredients', 0);
    component.editingDraft = 'Updated ingredient';

    component.acceptEditing(display, 'ingredients', 0);
    fixture.detectChanges();

    expect(component.pendingStepUpdate?.previousValue).toBe(previousValue);
    expect(component.pendingStepUpdate?.updatedValue).toBe('Updated ingredient');
    expect((fixture.nativeElement as HTMLElement).querySelector('.step-update-toast')).not.toBeNull();

    component.undoStepUpdate();
    expect(display.ingredients[0]).toBe(previousValue);
    expect(component.pendingStepUpdate).toBeNull();
  });

  it('should append a new editable row from each section add button', () => {
    const display = component.recipeDisplays.find((recipe) => recipe.editable)!;
    const compiled = fixture.nativeElement as HTMLElement;
    const ingredientCount = display.ingredients.length;
    const directionCount = display.directions.length;

    compiled.querySelector<HTMLButtonElement>('.add-step-button[aria-label="Add ingredient"]')!.click();
    fixture.detectChanges();

    expect(display.ingredients.length).toBe(ingredientCount + 1);
    expect(display.ingredients[ingredientCount]).toBe('');
    expect(component.isEditing('ingredients', ingredientCount)).toBeTrue();

    compiled.querySelector<HTMLButtonElement>('.add-step-button[aria-label="Add direction"]')!.click();
    fixture.detectChanges();

    expect(display.directions.length).toBe(directionCount + 1);
    expect(display.directions[directionCount]).toBe('');
    expect(component.isEditing('directions', directionCount)).toBeTrue();
    expect(compiled.querySelectorAll('.add-step-button').length).toBe(2);
  });

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
});
