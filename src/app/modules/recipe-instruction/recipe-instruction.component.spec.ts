import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RecipeInstructionComponent } from './recipe-instruction.component';

describe('RecipeInstructionComponent', () => {
  let component: RecipeInstructionComponent;
  let fixture: ComponentFixture<RecipeInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeInstructionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
});
