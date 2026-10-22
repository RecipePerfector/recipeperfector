import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeRowComparisonDialogComponent, ComparisonSelectionAction } from './recipe-row-comparison-dialog.component';

describe('RecipeRowComparisonDialogComponent', () => {
  let fixture: ComponentFixture<RecipeRowComparisonDialogComponent>;
  let component: RecipeRowComparisonDialogComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeRowComparisonDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeRowComparisonDialogComponent);
    component = fixture.componentInstance;
    component.initialRow = 2;
    component.editableRowCount = 3;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should start on the replace tab with the clamped initial row', () => {
    expect(component.tab).toBe('replace');
    expect(component.targetRow).toBe(2);
    expect(element.querySelector('.replace-tab')?.classList.contains('active')).toBeTrue();
  });

  it('should allow one extra row when switching to the insert tab', () => {
    const modes: string[] = [];
    component.modeChanged.subscribe((mode) => modes.push(mode));

    element.querySelector<HTMLButtonElement>('.insert-tab')!.click();
    fixture.detectChanges();
    expect(modes).toEqual(['insert']);
    expect(component.targetRowMax).toBe(4);

    component.onTargetRowChange(10);
    expect(component.targetRow).toBe(4);
  });

  it('should clamp the target row and emit the change', () => {
    const rows: number[] = [];
    component.targetRowChanged.subscribe((row) => rows.push(row));

    component.onTargetRowChange(0);
    component.onTargetRowChange(99);

    expect(rows).toEqual([1, 3]);
  });

  it('should emit the selected row and mode when confirmed', () => {
    let action: ComparisonSelectionAction | undefined;
    component.selectionRequested.subscribe((value) => (action = value));

    const buttons = element.querySelectorAll<HTMLButtonElement>('.comparison-selection-actions button');
    buttons[1].click();

    expect(action).toEqual({ row: 2, mode: 'replace' });
  });

  it('should emit closed on cancel and on outside clicks but not inside clicks', () => {
    let closedCount = 0;
    component.closed.subscribe(() => closedCount++);

    element.querySelector<HTMLElement>('.comparison-selection-dialog')!.click();
    expect(closedCount).toBe(0);

    element.querySelectorAll<HTMLButtonElement>('.comparison-selection-actions button')[0].click();
    expect(closedCount).toBe(1);

    document.body.click();
    expect(closedCount).toBe(2);
  });
});
