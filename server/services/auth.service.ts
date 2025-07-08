import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<any>(null);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.loadAuthState();
  }

  get isAuthenticated$() {
    return this._isAuthenticated.asObservable();
  }

  get currentUser$() {
    return this.currentUser.asObservable();
  }

  async loadAuthState() {
    const { value: token } = await Preferences.get({ key: 'authToken' });
    if (token) {
      this._isAuthenticated.next(true);
      this.fetchUserData();
    }
  }

  async register(email: string, password: string, walletAddress?: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/register`, {
        email,
        password,
        walletAddress
      }).toPromise();

      await Preferences.set({ key: 'authToken', value: response.token });
      this._isAuthenticated.next(true);
      this.currentUser.next(response.user);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/login`, {
        email,
        password
      }).toPromise();

      await Preferences.set({ key: 'authToken', value: response.token });
      this._isAuthenticated.next(true);
      this.currentUser.next(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async fetchUserData() {
    try {
      const token = (await Preferences.get({ key: 'authToken' })).value;
      if (!token) return;

      const headers = new HttpHeaders({
        'x-auth-token': token
      });

      const user = await this.http.get(`${this.apiUrl}/auth/user`, { headers }).toPromise();
      this.currentUser.next(user);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      await this.logout();
    }
  }

  async linkWallet(walletAddress: string) {
    try {
      const token = (await Preferences.get({ key: 'authToken' })).value;
      if (!token) return;

      const headers = new HttpHeaders({
        'x-auth-token': token
      });

      const user = await this.http.post(
        `${this.apiUrl}/auth/link-wallet`,
        { walletAddress },
        { headers }
      ).toPromise();

      this.currentUser.next(user);
      return user;
    } catch (error) {
      console.error('Failed to link wallet:', error);
      throw error;
    }
  }

  async logout() {
    await Preferences.remove({ key: 'authToken' });
    this._isAuthenticated.next(false);
    this.currentUser.next(null);
    this.router.navigate(['/login']);
  }
}