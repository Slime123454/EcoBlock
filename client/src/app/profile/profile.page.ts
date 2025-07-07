import { Component, OnInit, inject, HostBinding } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonItem, IonLabel, IonBadge, IonAvatar,
  IonButtons, IonBackButton, ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { BlockchainService } from '../services/blockchain.service';
import { addIcons } from 'ionicons';
import { camera, wallet, logOut, key, mail, person } from 'ionicons/icons';
import { ShortenAddressPipe } from '../pipes/shorten-address.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonItem, IonLabel, IonBadge, IonAvatar,
    IonButtons, IonBackButton,
    CommonModule, ShortenAddressPipe
  ]
})
export class ProfilePage implements OnInit {
  private auth = inject(AuthService);
  private blockchain = inject(BlockchainService);
  private toastCtrl = inject(ToastController);

  @HostBinding('class') className = 'profile-page-enter';
  profileImage = 'assets/images/default-avatar.png';
  walletAddress: string | null = null;
  userName = 'EcoUser';
  userEmail = 'user@ecoblock.com';
  ebtBalance = '125.50';
  hbarBalance = '42.75';

  constructor() {
    addIcons({ camera, wallet, logOut, key, mail, person });
  }

  async ngOnInit() {
    this.loadWalletState();
    this.blockchain.onWalletConnected.subscribe(address => {
      this.walletAddress = address;
    });
    this.blockchain.onWalletDisconnected.subscribe(() => {
      this.walletAddress = null;
    });
  }

  private loadWalletState() {
    this.walletAddress = this.blockchain.walletAddress;
  }

  async connectWallet() {
    try {
      await this.blockchain.connectWallet();
      this.showToast('Wallet connected successfully!');
    } catch (error) {
      this.showToast('Error connecting wallet');
      console.error(error);
    }
  }

  async disconnectWallet() {
    try {
      await this.blockchain.disconnectWallet();
      this.showToast('Wallet disconnected');
      this.walletAddress = null;
    } catch (error) {
      this.showToast('Error disconnecting wallet');
      console.error(error);
    }
  }

  changeProfilePicture() {
    this.showToast('Profile picture change coming soon!');
  }

  changePassword() {
    this.showToast('Password change coming soon!');
  }

  logout() {
    this.auth.logout();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}