import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
    data: { animation: 'defaultTransition' }
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    data: { animation: 'defaultTransition' }
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    data: { animation: 'defaultTransition' },
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
        data: { animation: 'defaultTransition' }
      },
      {
        path: 'energy-trading',
        loadComponent: () => import('./energy-trading/energy-trading.page').then(m => m.EnergyTradingPage),
        data: { animation: 'defaultTransition' }
      },
      {
        path: 'recycle-rewards',
        loadComponent: () => import('./recycle-rewards/recycle-rewards.page').then(m => m.RecycleRewardsPage),
        data: { animation: 'defaultTransition' }
      },
      {
        path: 'eco-scan',
        loadComponent: () => import('./eco-scan/eco-scan.page').then(m => m.EcoScanPage),
        data: { animation: 'defaultTransition' }
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard],
    data: { animation: 'profileTransition' } // Special transition for profile
  },
  {
    path: 'material-trace',
    loadComponent: () => import('./material-trace/material-trace.page').then(m => m.MaterialTracePage),
    canActivate: [AuthGuard],
    data: { animation: 'defaultTransition' }
  },
  {
    path: '',
    redirectTo: () => {
      const authService = inject(AuthService);
      return authService.isAuthenticated() ? '/tabs/home' : '/login';
    },
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/tabs/home'
  }
];