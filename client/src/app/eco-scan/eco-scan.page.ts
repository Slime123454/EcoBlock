import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonList, IonItem, IonLabel, IonThumbnail,
  IonBadge, IonSpinner, IonAlert, IonListHeader, IonNote,
  IonText, ToastController, Platform,
  IonCardSubtitle, IonChip
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import { camera, checkmarkCircle, closeCircle, cameraReverse, flash, images } from 'ionicons/icons';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserQRCodeReader } from '@zxing/library';
import { ShortenIdPipe } from '../pipes/shorten-id.pipe';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

interface ScannedProduct {
  id?: string;
  name: string;
  brand: string;
  points: number;
  image: string;
  date: Date;
  rating: number;
  barcode?: string;
  isValidated?: boolean;
}

interface ScanRecord {
  id: string;
  productId: string;
  name: string;
  brand: string;
  points: number;
  date: Date;
  image?: string;
  barcode?: string;       // Add this
  rating?: number;        // Add this
  isValidated?: boolean;  // Add this
}

@Component({
  selector: 'app-eco-scan',
  templateUrl: './eco-scan.page.html',
  styleUrls: ['./eco-scan.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonList, IonItem, IonLabel, IonThumbnail,
    IonBadge, IonSpinner, IonAlert, IonListHeader, IonNote,
    IonText, CommonModule, DatePipe, FormsModule, IonCardSubtitle, IonChip,
    ShortenIdPipe
  ]
})
export class EcoScanPage implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  private codeReader = new BrowserQRCodeReader();
  private scannerControls: any = null;
  private scanTimeout: any;

  scannedProducts: ScanRecord[] = [];
  capturedImage: string | null = null;
  isLoading = false;
  showPermissionAlert = false;
  scanActive = false;
  isWebCameraActive = false;
  usingFrontCamera = false;
  flashMode = 'off';
  totalEcoPoints = 0;
  private stream: MediaStream | null = null;

  permissionAlertButtons = [
    {
      text: 'Not Now',
      role: 'cancel'
    },
    {
      text: 'Open Settings',
      handler: () => this.openAppSettings()
    }
  ];

  constructor(
    public platform: Platform,
    private toastCtrl: ToastController,
    private auth: AuthService
  ) {
    addIcons({ camera, checkmarkCircle, closeCircle, cameraReverse, flash, images });
  }

  async ngOnInit() {
    this.checkCameraPermissions();
    await this.loadScanHistory();
  }

  ngOnDestroy(): void {
    this.stopAllScanners();
  }

  async loadScanHistory() {
    try {
      const token = await this.auth.getToken();
      if (!token) return;

      const response = await fetch(`${environment.apiUrl}/activity/scan-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        this.scannedProducts = await response.json();
        this.totalEcoPoints = this.scannedProducts.reduce((sum, item) => sum + item.points, 0);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  }

  async startScan() {
    this.isLoading = true;
    try {
      if (this.platform.is('capacitor')) {
        await this.startNativeCamera(true);
      } else {
        await this.startZXingScan();
      }
    } catch (error) {
      console.error('Camera error:', error);
      this.showToast('Could not access camera');
    } finally {
      this.isLoading = false;
    }
  }

  async startZXingScan() {
    this.isLoading = true;
    this.scanActive = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!this.videoElement?.nativeElement) {
        throw new Error('Video element not found');
      }

      this.scannerControls = await this.codeReader.decodeFromVideoDevice(
        null,
        this.videoElement.nativeElement,
        (result, error) => {
          if (result) {
            this.handleScannedResult(result.getText());
            this.stopZXingScan();
          }
          if (error && !(error instanceof Error)) {
            console.warn('Scan warning:', error);
          }
        }
      );

      this.scanTimeout = setTimeout(() => {
        if (this.scanActive) {
          this.stopZXingScan();
          this.showToast('Scan timed out. Try again.');
        }
      }, 10000);

    } catch (error) {
      console.error('ZXing error:', error);
      this.showToast('Failed to start scanner');
      this.stopZXingScan();
    } finally {
      this.isLoading = false;
    }
  }

  stopZXingScan() {
    if (this.scannerControls) {
      this.scannerControls.stop();
      this.scannerControls = null;
    }
    this.scanActive = false;
    clearTimeout(this.scanTimeout);
  }

  async handleScannedResult(content: string) {
    try {
      const qrData = JSON.parse(content);
    
      if (!qrData.id || !qrData.name || !qrData.brand || !qrData.points) {
        throw new Error('Invalid EcoBlock QR format - missing required fields');
      }

      const product: ScannedProduct = {
        id: qrData.id,
        name: qrData.name,
        brand: qrData.brand,
        points: qrData.points,
        image: qrData.image || 'assets/images/default-product.png',
        date: new Date(),
        rating: qrData.rating || 4.0,
        barcode: qrData.barcode,
        isValidated: false
      };

      await this.validateProductWithBackend(product);
      this.showToast(`Scanned: ${product.name}`);
    
    } catch (error: unknown) {
      console.error('QR processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid QR code. Scan an EcoBlock product QR.';
      this.showToast(errorMessage);
    }
  }

  async startNativeCamera(forceCamera: boolean = false) {
    try {
      const hasPermission = await this.checkCameraPermissions();
      if (!hasPermission) {
        const newStatus = await Camera.requestPermissions();
        if (newStatus.camera !== 'granted') {
          this.showPermissionAlert = true;
          return;
        }
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Scan Product QR',
        promptLabelPicture: 'Take Photo'
      });

      this.capturedImage = image.dataUrl ?? null;
      if (this.capturedImage) {
        const result = await this.codeReader.decodeFromImage(
          undefined,
          this.capturedImage
        );
        if (result) {
          this.handleScannedResult(result.getText());
        } else {
          this.showToast('No QR code found in image');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  async selectFromGallery() {
    this.isLoading = true;
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        promptLabelHeader: 'Select QR Image'
      });
      
      if (image.dataUrl) {
        const result = await this.codeReader.decodeFromImage(
          undefined,
          image.dataUrl
        );
        if (result) {
          this.handleScannedResult(result.getText());
        } else {
          this.showToast('No QR code found in image');
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      this.showToast('Failed to process image');
    } finally {
      this.isLoading = false;
    }
  }

  async checkCameraPermissions(): Promise<boolean> {
    try {
      const status = await Camera.checkPermissions();
      return status.camera === 'granted';
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  async validateProductWithBackend(product: ScannedProduct): Promise<void> {
    this.isLoading = true;
  
    try {
      const token = await this.auth.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${environment.apiUrl}/products/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          brand: product.brand,
          points: product.points,
          imageUrl: product.image,
          barcode: product.barcode,    // Add this
          rating: product.rating       // Add this
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Product validation failed');
      }

      const validationResult = await response.json();
    
      if (!validationResult.valid) {
        throw new Error('Product not found in database or attributes mismatch');
      }

      if (validationResult.scanRecord) {
      // Add the additional properties to the scan record
        const completeRecord = {
          ...validationResult.scanRecord,
          barcode: product.barcode,
          rating: product.rating,
          isValidated: true
        };
        this.scannedProducts.unshift(completeRecord);
        this.totalEcoPoints += completeRecord.points;
      }

    } finally {
      this.isLoading = false;
    }
  }

  async openAppSettings() {
    try {
      if (this.platform.is('capacitor')) {
        await Browser.open({ url: 'app-settings:' });
      } else {
        this.showToast('Please enable camera access in browser settings');
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      this.showToast('Could not open settings');
    }
  }

  addScannedProduct(product: ScannedProduct) {
    this.scannedProducts.unshift({
      id: product.id || '',
      productId: product.id || '',
      name: product.name,
      brand: product.brand,
      points: product.points,
      date: product.date,
      image: product.image
    });
    this.totalEcoPoints += product.points;
    this.capturedImage = product.image;
  }

  stopAllScanners() {
    this.stopZXingScan();
    this.stopWebCamera();
  }

  stopWebCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isWebCameraActive = false;
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  confirmScan() {
    this.showToast('Scan confirmed!');
    this.capturedImage = null;
  }

  retryScan() {
    this.capturedImage = null;
    this.startScan();
  }

  onPermissionAlertDismiss() {
    this.showPermissionAlert = false;
  }
}