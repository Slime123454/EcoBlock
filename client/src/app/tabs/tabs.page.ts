import { Component } from '@angular/core';
import { 
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonBackButton  // Add this import
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, flash, trashBin, qrCode, personCircle } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonBackButton  // Add this to imports array
  ]
})
export class TabsPage {
  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    addIcons({ home, flash, trashBin, qrCode, personCircle });
  }

  navigateToProfile() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}