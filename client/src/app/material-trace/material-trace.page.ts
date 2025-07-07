import { Component, OnInit, inject } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonItem, IonLabel, IonList, IonListHeader, // Added IonListHeader here
  IonBadge, IonInput, IonSpinner, IonGrid, IonRow, IonCol, IonAvatar
} from '@ionic/angular/standalone';
import { BlockchainService } from '../services/blockchain.service';
import { addIcons } from 'ionicons';
import { documentText, time } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-material-trace',
  templateUrl: './material-trace.page.html',
  styleUrls: ['./material-trace.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonItem, IonLabel, IonList, IonListHeader, // Added here
    IonBadge, IonInput, IonSpinner, IonGrid, IonRow, IonCol, IonAvatar,
    CommonModule, FormsModule
  ]
})
export class MaterialTracePage implements OnInit {
  private blockchain = inject(BlockchainService);
  private toastCtrl = inject(ToastController);
  
  materialId = '';
  materialHistory: any[] = [];
  isLoading = false;
  isConnected = false;

  constructor() {
    addIcons({ documentText, time });
  }

  async ngOnInit() {
    this.isConnected = this.blockchain.isConnected;
    this.blockchain.onWalletConnected.subscribe(() => {
      this.isConnected = true;
    });
    this.blockchain.onWalletDisconnected.subscribe(() => {
      this.isConnected = false;
      this.materialHistory = [];
    });
  }

  async connectWallet() {
    try {
      await this.blockchain.connectWallet();
    } catch (error) {
      this.showToast('Wallet connection failed');
      console.error('Connection error:', error);
    }
  }

  async fetchMaterialHistory() {
    if (!this.materialId) return;
    
    this.isLoading = true;
    try {
      this.materialHistory = await this.blockchain.getMaterialHistory(this.materialId);
      if (this.materialHistory.length === 0) {
        this.showToast('No history found for this material');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      this.showToast('Failed to load material history');
    } finally {
      this.isLoading = false;
    }
  }

  async registerMaterial() {
    if (!this.materialId) {
      this.showToast('Please enter a material ID');
      return;
    }

    if (!this.blockchain.isConnected) {
      await this.connectWallet();
      return;
    }

    this.isLoading = true;
    try {
      const tx = await this.blockchain.registerMaterial(
        this.materialId,
        JSON.stringify({ registeredAt: new Date().toISOString() })
      );
      
      await tx.wait();
      this.showToast('Material registered successfully!');
      await this.fetchMaterialHistory();
    } catch (error) {
      console.error('Registration failed:', error);
      this.showToast('Failed to register material');
    } finally {
      this.isLoading = false;
    }
  }

  formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleString();
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