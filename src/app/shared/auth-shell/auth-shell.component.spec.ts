import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthShellComponent } from './auth-shell.component';
import { UserService } from '../../services/user/user.service';
import { AuthDialogService } from '../../services/auth-dialog/auth-dialog.service';

describe('AuthShellComponent', () => {
  let component: AuthShellComponent;
  let fixture: ComponentFixture<AuthShellComponent>;
  let userService: {
    isUserLoggedIn: jasmine.Spy;
    getUsername: jasmine.Spy;
    logout: jasmine.Spy;
    createNewUser: jasmine.Spy;
  };

  beforeEach(async () => {
    userService = {
      isUserLoggedIn: jasmine.createSpy('isUserLoggedIn').and.returnValue(false),
      getUsername: jasmine.createSpy('getUsername').and.returnValue('test@example.com'),
      logout: jasmine.createSpy('logout'),
      createNewUser: jasmine.createSpy('createNewUser').and.resolveTo({})
    };

    await TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [{
        provide: UserService,
        useValue: userService
      }, provideRouter([])]
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

  it('opens the login dialog with a message when a page requests login', () => {
    TestBed.inject(AuthDialogService).requestLogin('You need to be logged in before saving a recipe.');
    fixture.detectChanges();

    const prompt = fixture.nativeElement.querySelector('.login-prompt');
    expect(component.isLoginDialogOpen).toBeTrue();
    expect(prompt.textContent).toContain('You need to be logged in before saving a recipe.');

    component.closeLoginDialog();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-prompt')).toBeFalsy();
  });

  it('opens the account menu for a logged-in user and logs out', () => {
    userService.isUserLoggedIn.and.returnValue(true);
    fixture.detectChanges();

    const accountButton = fixture.nativeElement.querySelector('.user-menu');
    accountButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-menu')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.user-label').textContent).toContain('test@example.com');
    expect(fixture.nativeElement.querySelector('.account-username')).toBeFalsy();

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.nativeElement.querySelector('.account-menu button').click();
    expect(userService.logout).toHaveBeenCalled();
    expect(component.isAccountMenuOpen).toBeFalse();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/']);
  });

  it('closes the account menu when clicking outside of it', () => {
    userService.isUserLoggedIn.and.returnValue(true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.user-menu').click();
    fixture.detectChanges();
    expect(component.isAccountMenuOpen).toBeTrue();

    document.body.click();
    fixture.detectChanges();

    expect(component.isAccountMenuOpen).toBeFalse();
    expect(fixture.nativeElement.querySelector('.account-menu')).toBeFalsy();
  });
});
