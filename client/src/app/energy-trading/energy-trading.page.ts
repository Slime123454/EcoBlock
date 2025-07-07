import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonList, 
  IonSpinner, IonBadge, IonAvatar, IonNote, IonSegment, 
  IonSegmentButton, IonBackButton, IonButtons, IonSelect, 
  IonSelectOption, ToastController, IonText 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  flash, wallet, addCircle, sunny, flag, water, 
  time, location, arrowBack, checkmarkCircle, openOutline 
} from 'ionicons/icons';
import { BlockchainService } from '../services/blockchain.service';
import { ShortenAddressPipe } from '../pipes/shorten-address.pipe';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

interface EnergyListing {
  id: string;
  seller: string;
  amount: number;
  price: number;
  energyType: string;
  location: string;
  timestamp: Date;
}

@Component({
  selector: 'app-energy-trading',
  templateUrl: './energy-trading.page.html',
  styleUrls: ['./energy-trading.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton, IonIcon, IonItem, IonLabel, IonInput, IonList,
    IonSpinner, IonBadge, IonAvatar, IonNote, IonSegment,
    IonSegmentButton, IonBackButton, IonButtons, IonSelect,
    IonSelectOption, IonText,
    FormsModule, CommonModule, ShortenAddressPipe
  ]
})
export class EnergyTradingPage implements OnInit {
  public environment = environment;
  public blockchain = inject(BlockchainService);
  private toastCtrl = inject(ToastController);
  private changeDetectorRef = inject(ChangeDetectorRef);

  // Form fields
  energyAmount = 0;
  pricePerUnit = 0.15;
  energyType = 'solar';
  location = 'My Home';
  
  // UI state
  isProcessing = false;
  selectedSegment = 'all';
  listings: EnergyListing[] = [];
  connectionError = '';
  showInstallPrompt = false;

  constructor() {
    addIcons({ 
      flash, wallet, addCircle, sunny, flag, water, 
      time, location, arrowBack, checkmarkCircle, openOutline 
    });
  }

  async ngOnInit() {
    await this.loadListings();
    
    // Subscribe to listing changes in test mode
    if (this.environment.testMode) {
      this.blockchain.onListingsChanged.subscribe(listings => {
        this.listings = listings;
        this.changeDetectorRef.detectChanges();
      });
    }

    this.blockchain.onBalanceChanged.subscribe(balance => {
      this.changeDetectorRef.detectChanges();
    });

    this.blockchain.onConnectionError.subscribe((error: string) => {
      this.connectionError = error;
      this.showInstallPrompt = error.includes('install MetaMask');
      this.changeDetectorRef.detectChanges();
    });
  }

  async connectWallet() {
    try {
      this.connectionError = '';
      this.showInstallPrompt = false;
      this.isProcessing = true;
      this.changeDetectorRef.detectChanges();

      await this.blockchain.connectWallet();
      await this.loadListings();
      this.showToast('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Connection error:', error);
      this.connectionError = error.message;
      this.showToast(this.connectionError);
    } finally {
      this.isProcessing = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  installMetaMask() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    window.open(
      isMobile ? 'https://metamask.io/download.html' : 'https://metamask.io/',
      '_blank'
    );
  }

  async loadListings() {
    if (!this.blockchain.isConnected) return;
  
    this.isProcessing = true;
    try {
      this.listings = await this.blockchain.getEnergyListings();
    } catch (error) {
      console.error('Error loading listings:', error);
      this.showToast('Failed to load energy listings');
    } finally {
      this.isProcessing = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async listEnergyForSale() {
    if (!this.blockchain.isConnected) {
      await this.connectWallet();
      return;
    }

    if (this.energyAmount <= 0 || this.pricePerUnit <= 0) {
      this.showToast('Please enter valid amount and price');
      return;
    }

    this.isProcessing = true;
    try {
      const tx = await this.blockchain.listEnergy(
        this.energyAmount,
        this.pricePerUnit,
        this.energyType,
        this.location
      );
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        this.showToast('Energy listed successfully!');
        await this.loadListings();
        this.resetForm();
      } else {
        this.showToast('Transaction failed');
      }
    } catch (error: any) {
      console.error('Listing failed:', error);
      this.showToast(error.message || 'Failed to list energy');
    } finally {
      this.isProcessing = false;
    }
  }

  async buyEnergy(listing: EnergyListing) {
    if (!this.blockchain.isConnected) {
      await this.connectWallet();
      return;
    }

    this.isProcessing = true;
    try {
      const tx = await this.blockchain.buyEnergy(listing.id, listing.amount);
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        this.showToast(`Purchased ${listing.amount}kWh ${listing.energyType} energy!`);
        await this.loadListings();
      } else {
        this.showToast('Purchase failed');
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      this.showToast(error.message || 'Purchase failed');
    } finally {
      this.isProcessing = false;
    }
  }

  filterListings() {
    if (this.selectedSegment === 'all') return this.listings;
    return this.listings.filter(l => l.energyType === this.selectedSegment);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  private resetForm() {
    this.energyAmount = 0;
    this.pricePerUnit = 0.15;
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