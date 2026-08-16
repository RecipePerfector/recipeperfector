import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthShellComponent } from './auth-shell.component';
import { UserService } from '../../services/user/user.service';

describe('AuthShellComponent', () => {
  let component: AuthShellComponent;
  let fixture: ComponentFixture<AuthShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [{
        provide: UserService,
        useValue: {
          isUserLoggedIn: () => false,
          getUserImageURL: () => '',
          createNewUser: jasmine.createSpy('createNewUser').and.resolveTo({})
        }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show a loading spinner while creating an account', () => {
    component.accountMode = 'create';
    component.isCreatingAccount = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-spinner')).toBeTruthy();
    expect(compiled.textContent).toContain('Create an Account');
  });
});
