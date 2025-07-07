import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _currentUser = new BehaviorSubject<any>(null);
  
  // Public observables
  isAuthenticated$ = this._isAuthenticated.asObservable();
  currentUser$ = this._currentUser.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    this.loadAuthState();
  }

  async getToken(): Promise<string> {
    const { value } = await Preferences.get({ key: 'authToken' });
    return value || '';
  }


  async loadAuthState() {
    const { value: token } = await Preferences.get({ key: 'authToken' });
    if (token) {
      this._isAuthenticated.next(true);
      await this.fetchUserData();
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      // Example API call - adjust to your backend
      const response: any = await this.http.post(
        `${environment.apiUrl}/auth/login`, 
        { email, password }
      ).toPromise();

      await Preferences.set({ 
        key: 'authToken', 
        value: response.token 
      });
      
      this._currentUser.next(response.user);
      this._isAuthenticated.next(true);
      
      const toast = await this.toastCtrl.create({
        message: 'Login successful!',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      const toast = await this.toastCtrl.create({
        message: 'Login failed. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
      
      this._isAuthenticated.next(false);
      return false;
    }
  }

  async register(email: string, password: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(
        `${environment.apiUrl}/auth/register`,
        { email, password }
      ).toPromise();

      await Preferences.set({
        key: 'authToken',
        value: response.token
      });

      this._currentUser.next(response.user);
      this._isAuthenticated.next(true);
      
      
      const toast = await this.toastCtrl.create({
        message: 'Registration successful!',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();

      this.router.navigate(['/tabs/home']);
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      const toast = await this.toastCtrl.create({
        message: 'Registration failed. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
      
      return false;
    }
  }

  async logout() {
    await Preferences.remove({ key: 'authToken' });
    this._isAuthenticated.next(false);
    this._currentUser.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }

  getCurrentUser() {
    return this._currentUser.value;
  }

  private async fetchUserData() {
    try {
      const { value: token } = await Preferences.get({ key: 'authToken' });
      if (!token) return;

      const user = await this.http.get(
        `${environment.apiUrl}/auth/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();
      
      this._currentUser.next(user);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      await this.logout();
    }
  }
  

  async validateToken(): Promise<boolean> {
    try {
      const { value: token } = await Preferences.get({ key: 'authToken' });
      if (!token) return false;
  
      const response = await this.http.get<{ valid?: boolean }>(
        `${environment.apiUrl}/auth/validate-token`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();
  
      return response?.valid ?? false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}