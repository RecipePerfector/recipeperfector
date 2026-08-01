import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  @Input() recipe!: {
    name: string;
    time: string;
    tag: string;
    emoji: string;
    description: string;
  };

  isSpinning = false;

  constructor(private router: Router,
    private api: ApiService,
  ) {}

  onCardClick() {
    this.isSpinning = true;
    this.router.navigate(['/recipe']);
    setTimeout(() => {
      this.isSpinning = false;
    }, 600);
    this.api.callAPIPost('/api/users/wwTestGet', { email: 'myemail2@example.com' }).then((response: any) => {
      console.log('test response: ');
      console.log(response);
    });
  }
}
