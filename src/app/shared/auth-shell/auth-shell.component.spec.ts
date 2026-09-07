import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthShellComponent } from './auth-shell.component';
import { UserService } from '../../services/user/user.service';

describe('AuthShellComponent', () => {
  let component: AuthShellComponent;
  let fixture: ComponentFixture<AuthShellComponent>;
  let userService: {
    isUserLoggedIn: jasmine.Spy;
    logout: jasmine.Spy;
    createNewUser: jasmine.Spy;
  };

  beforeEach(async () => {
    userService = {
      isUserLoggedIn: jasmine.createSpy('isUserLoggedIn').and.returnValue(false),
      logout: jasmine.createSpy('logout'),
      createNewUser: jasmine.createSpy('createNewUser').and.resolveTo({})
    };

    await TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [{
        provide: UserService,
        useValue: userService
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

  it('opens the account menu for a logged-in user and logs out', () => {
    userService.isUserLoggedIn.and.returnValue(true);
    fixture.detectChanges();

    const accountButton = fixture.nativeElement.querySelector('.user-menu');
    accountButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-menu')).toBeTruthy();

    fixture.nativeElement.querySelector('.account-menu button').click();
    expect(userService.logout).toHaveBeenCalled();
    expect(component.isAccountMenuOpen).toBeFalse();
  });
});
