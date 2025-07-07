import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton, 
  IonItem, IonLabel, IonInput, IonSpinner, IonNote, 
  IonList, IonIcon, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosed, arrowForward } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonItem, IonLabel, IonInput, IonSpinner,
    IonNote, IonList, IonIcon, IonButtons, IonBackButton,
    FormsModule
  ]
})
export class LoginPage {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ lockClosed, arrowForward });
  }

  async login() {
    this.isLoading = true;
    try {
      const success = await this.auth.login(this.email, this.password);
      if (success) {
        const toast = await this.toastCtrl.create({
          message: 'Login successful!',
          duration: 2000,
          position: 'bottom'
        });
        await toast.present();
        this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Login failed. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register'], { replaceUrl: true });
  }
}