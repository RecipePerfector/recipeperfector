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
    loginUser: jasmine.Spy;
    setUserLoggedIn: jasmine.Spy;
    setUsername: jasmine.Spy;
  };

  beforeEach(async () => {
    userService = {
      isUserLoggedIn: jasmine.createSpy('isUserLoggedIn').and.returnValue(false),
      getUsername: jasmine.createSpy('getUsername').and.returnValue('test@example.com'),
      logout: jasmine.createSpy('logout'),
      createNewUser: jasmine.createSpy('createNewUser').and.resolveTo({}),
      loginUser: jasmine.createSpy('loginUser').and.resolveTo({ user: { username: 'test@example.com' } }),
      setUserLoggedIn: jasmine.createSpy('setUserLoggedIn'),
      setUsername: jasmine.createSpy('setUsername')
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
    component.openLoginDialog();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-spinner')).toBeTruthy();
    expect(compiled.textContent).toContain('Create an Account');
  });

  it('should show a loading spinner while signing in', async () => {
    let resolveLogin: (response: { user: { username: string } }) => void = () => {};
    userService.loginUser.and.returnValue(new Promise((resolve) => {
      resolveLogin = resolve;
    }));

    component.openLoginDialog();
    const loginPromise = component.submitLogin();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeTruthy();
    resolveLogin({ user: { username: 'test@example.com' } });
    await loginPromise;
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

  it('shows the recipe-specific login message without the example button on the example page', () => {
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue('/recipe');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('If you would like to load a different recipe please login.');
    expect(compiled.textContent).not.toContain('You must login to use this website. Or you can view an example');
    expect(compiled.querySelector('.example-recipe-button')).toBeFalsy();
  });

  it('hides the example button for logged-in users on the example page', () => {
    userService.isUserLoggedIn.and.returnValue(true);
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue('/recipe');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.example-recipe-button')).toBeFalsy();
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
    fixture.nativeElement.querySelector('.account-menu button:last-child').click();
    expect(userService.logout).toHaveBeenCalled();
    expect(component.isAccountMenuOpen).toBeFalse();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/']);
  });

  it('opens the saved recipes screen from the account menu', () => {
    userService.isUserLoggedIn.and.returnValue(true);
    fixture.detectChanges();

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.nativeElement.querySelector('.user-menu').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.account-menu button:first-child').click();

    expect(component.isAccountMenuOpen).toBeFalse();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('shows the home button away from home and navigates to the root route', () => {
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue('/recipe');
    fixture.detectChanges();

    const homeButton = fixture.nativeElement.querySelector('.home-button') as HTMLButtonElement;
    expect(homeButton).toBeTruthy();
    expect(homeButton.getAttribute('aria-label')).toBe('Home');

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    homeButton.click();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/']);
  });

  it('does not show the home button on the home route', () => {
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue('/');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.home-button')).toBeFalsy();
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
