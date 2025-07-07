import { Component } from '@angular/core';
import { 
  IonApp, 
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    this.auth.loadAuthState().then(() => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/tabs/home']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}