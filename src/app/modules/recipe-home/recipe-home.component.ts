import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeButtonComponent } from '../../shared/recipe-button/recipe-button.component';
import { ApiService } from '../../services/api/api.service';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-recipe-home',
  standalone: true,
  imports: [RecipeButtonComponent],
  templateUrl: './recipe-home.component.html',
  styleUrl: './recipe-home.component.css'
})
export class RecipeHomeComponent {
  private router = inject(Router);
  private api = inject(ApiService);
  private userService = inject(UserService);

  openExampleRecipe(): void {
    this.router.navigate(['/recipe']);
    this.api.callAPIGet('/api/users/me', this.userService.getAuthToken() ?? undefined).then((response: any) => {
      console.log('me response: ');
      console.log(response);
    });
  }
}
