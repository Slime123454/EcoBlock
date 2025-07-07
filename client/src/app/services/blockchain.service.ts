import { Injectable, NgZone } from '@angular/core';
import { 
  BrowserProvider, 
  JsonRpcProvider, 
  Signer, 
  Contract, 
  ethers,
  ContractTransactionResponse,
  Network
} from 'ethers';
import { environment } from '../../environments/environment';
import { ECO_BLOCK_ABI } from '../abis/eco-block.abi';
import { ENERGY_MARKET_ABI } from '../abis/energy-market.abi';
import { MATERIAL_TRACE_ABI } from '../abis/material-trace.abi';
import { AuthService } from './auth.service';
import { ToastController } from '@ionic/angular/standalone';
import { EventEmitter } from '@angular/core';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
  }
}

interface EnergyListing {
  id: string;
  seller: string;
  amount: number;
  price: number;
  energyType: string;
  location: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {
  private provider: BrowserProvider | JsonRpcProvider;
  private signer?: Signer;
  
  // Contracts
  private ecoBlockContract?: Contract;
  private energyMarketContract?: Contract;
  private materialTraceContract?: Contract;

  // State
  public walletAddress: string = '';
  public isConnected = false;
  public ebtBalance: string = '0';
  public currentNetwork?: Network;
  
  // Test mode implementation
  public testMode = environment.testMode;
  private _testListings: EnergyListing[] = [];
  private readonly TEST_LISTINGS_KEY = 'ecoblock_shared_marketplace_listings';
  
  // Events
  public onWalletConnected = new EventEmitter<string>();
  public onWalletDisconnected = new EventEmitter<void>();
  public onChainChanged = new EventEmitter<Network>();
  public onBalanceChanged = new EventEmitter<string>();
  public onConnectionError = new EventEmitter<string>();
  public onListingsChanged = new EventEmitter<EnergyListing[]>();

  constructor(
    private auth: AuthService,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {
    this.provider = this.initializeProvider();
    this.initializeContracts();
    this.setupEventListeners();
    this.initializeTestData();
  }

  // Getter for test listings
  public get sharedMarketplaceListings(): EnergyListing[] {
    return [...this._testListings]; // Return a copy
  }

  private initializeProvider(): BrowserProvider | JsonRpcProvider {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new BrowserProvider(window.ethereum);
    }
    return new JsonRpcProvider(environment.rpcUrl);
  }

  private initializeContracts(): void {
    const { ecoBlockToken, energyMarket, materialTrace } = environment.contractAddresses;

    this.ecoBlockContract = new Contract(ecoBlockToken, ECO_BLOCK_ABI, this.provider);
    this.energyMarketContract = new Contract(energyMarket, ENERGY_MARKET_ABI, this.provider);
    this.materialTraceContract = new Contract(materialTrace, MATERIAL_TRACE_ABI, this.provider);
  }

  private initializeTestData(): void {
    if (!this.testMode) return;

    // Load from localStorage if available
    const savedListings = localStorage.getItem(this.TEST_LISTINGS_KEY);
    if (savedListings) {
      try {
        const parsed = JSON.parse(savedListings);
        this._testListings = parsed.map((l: any) => ({
          ...l,
          timestamp: new Date(l.timestamp)
        }));
      } catch (e) {
        console.error('Failed to parse saved listings', e);
      }
    }

    // Add default listings if empty
    if (this._testListings.length === 0) {
      this._testListings = [
        {
          id: '1',
          seller: '0xDefaultSeller1',
          amount: 5.2,
          price: 0.15,
          energyType: 'solar',
          location: 'Berlin, DE',
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          id: '2',
          seller: '0xDefaultSeller2',
          amount: 3.8,
          price: 0.18,
          energyType: 'wind',
          location: 'Hamburg, DE',
          timestamp: new Date(Date.now() - 7200000)
        }
      ];
      this.saveTestListings();
    }
  }

  private saveTestListings(): void {
    if (this.testMode) {
      localStorage.setItem(this.TEST_LISTINGS_KEY, JSON.stringify(this._testListings));
    }
  }

  private async updateContractsWithSigner(): Promise<void> {
    if (!this.signer) throw new Error('No signer available');
    
    this.ecoBlockContract = this.ecoBlockContract?.connect(this.signer) as Contract;
    this.energyMarketContract = this.energyMarketContract?.connect(this.signer) as Contract;
    this.materialTraceContract = this.materialTraceContract?.connect(this.signer) as Contract;
  }

  private setupEventListeners(): void {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      this.ngZone.run(() => {
        if (accounts.length > 0) {
          this.handleAccountChange(accounts[0]);
        } else {
          this.disconnectWallet();
        }
      });
    });

    window.ethereum.on('chainChanged', async () => {
      this.ngZone.run(async () => {
        this.currentNetwork = await this.provider.getNetwork();
        this.onChainChanged.emit(this.currentNetwork);
        this.showToast('Network changed. Please refresh.');
      });
    });
  }

  private async handleAccountChange(address: string): Promise<void> {
    try {
      const currentUser = this.auth.getCurrentUser();
      
      if (currentUser?.walletAddress && currentUser.walletAddress !== address) {
        this.showToast('Connected wallet does not match your account. Disconnecting...');
        await this.disconnectWallet();
        return;
      }

      this.walletAddress = address;
      this.signer = await this.provider.getSigner();
      await this.updateContractsWithSigner();
      await this.updateBalance();
      
      this.onWalletConnected.emit(address);
    } catch (error) {
      console.error('Account change error:', error);
      this.onConnectionError.emit('Failed to handle account change');
    }
  }

  async connectWallet(): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Browser environment required');
    }

    if (!window.ethereum) {
      throw new Error('MetaMask or similar wallet required');
    }

    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts[0]) {
      throw new Error('No accounts found');
    }

    // Add validation for Ethereum address format
    const address = accounts[0];
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid Ethereum address format');
    }

    const currentUser = this.auth.getCurrentUser();
  
    if (currentUser?.walletAddress && currentUser.walletAddress !== address) {
      throw new Error(`Please connect with your registered wallet: ${currentUser.walletAddress}`);
    }

    await this.handleSuccessfulConnection(address);
    return address;

  } catch (error: any) {
    // Only fall back to test mode if it's not a user rejection
    if (!error.message.includes('User rejected the request') && this.testMode) {
      console.warn('Falling back to test mode wallet');
      const userEmail = this.auth.getCurrentUser()?.email || 'anonymous';
      const hash = await this.hashString(userEmail);
      
      // Ensure test address follows proper format
      this.walletAddress = `0x${'0000000000000000000000000000000000000000'.substr(0, 40 - userEmail.length)}${hash.substr(0, 8)}`;
      this.isConnected = true;
      await this.updateBalance();
      this.onWalletConnected.emit(this.walletAddress);
      return this.walletAddress;
    }
  
    console.error('Wallet connection error:', error);
    let errorMessage = 'Wallet connection failed';
  
    if (error.message.includes('User rejected the request')) {
      errorMessage = 'Connection cancelled by user';
    } else if (error.message.includes('Invalid Ethereum address format')) {
      errorMessage = 'Invalid wallet address format';
    } else {
      errorMessage += `: ${error.message}`;
    }

    this.onConnectionError.emit(errorMessage);
    throw error;
  }
}

// Helper method to validate addresses
private isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async handleSuccessfulConnection(address: string): Promise<void> {
    this.walletAddress = address;
    this.signer = await this.provider.getSigner();
    this.isConnected = true;
    
    await this.updateContractsWithSigner();
    await this.updateBalance();
    this.currentNetwork = await this.provider.getNetwork();
    
    this.onWalletConnected.emit(address);
    this.showToast('Wallet connected successfully');
  }

  async disconnectWallet(): Promise<void> {
    this.signer = undefined;
    this.walletAddress = '';
    this.isConnected = false;
    this.ebtBalance = '0';
    this.onWalletDisconnected.emit();
    this.onBalanceChanged.emit('0');
  }

  async updateBalance(): Promise<void> {
    if (this.testMode) {
      // Generate a consistent balance based on wallet address
      const hash = await this.hashString(this.walletAddress);
      const balance = parseInt(hash.substr(0, 8), 16) % 1000;
      this.ebtBalance = (100 + balance).toFixed(4);
      this.onBalanceChanged.emit(this.ebtBalance);
      return;
    }

    if (!this.ecoBlockContract || !this.walletAddress) return;
    
    try {
      const balance = await this.ecoBlockContract['balanceOf'](this.walletAddress);
      this.ebtBalance = ethers.formatEther(balance);
      this.onBalanceChanged.emit(this.ebtBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      this.onConnectionError.emit('Failed to load balance');
    }
  }

  async getEnergyListings(): Promise<EnergyListing[]> {
    if (this.testMode) {
      return this.sharedMarketplaceListings; // Use the getter
    }
    
    if (!this.energyMarketContract) return [];
    
    try {
      const listings = await this.energyMarketContract['getAllListings']();
      return listings.map((l: any) => ({
        id: l.id.toString(),
        seller: l.seller,
        amount: parseFloat(ethers.formatEther(l.amount)),
        price: parseFloat(ethers.formatEther(l.pricePerUnit)),
        energyType: l.energyType,
        location: l.location,
        timestamp: new Date(Number(l.timestamp) * 1000)
      }));
    } catch (error) {
      console.error('Error fetching listings:', error);
      this.onConnectionError.emit('Failed to load energy listings');
      return [];
    }
  }

  async listEnergy(
    amount: number,
    pricePerUnit: number,
    energyType: string,
    location: string
  ): Promise<ContractTransactionResponse> {
    if (this.testMode) {
      const newListing = {
        id: Date.now().toString(),
        seller: this.walletAddress || '0xTestUser' + Math.random().toString(16).substr(2, 6),
        amount,
        price: pricePerUnit,
        energyType,
        location,
        timestamp: new Date()
      };
      
      this._testListings.push(newListing);
      this.saveTestListings();
      this.onListingsChanged.emit(this.sharedMarketplaceListings);
      
      return {
        wait: async () => ({
          status: 1,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
        })
      } as unknown as ContractTransactionResponse;
    }

    if (!this.energyMarketContract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    return this.energyMarketContract['listEnergy'](
      ethers.parseEther(amount.toString()),
      ethers.parseEther(pricePerUnit.toString()),
      energyType,
      location
    );
  }

  async buyEnergy(listingId: string, amount: number): Promise<ContractTransactionResponse> {
    if (this.testMode) {
      const listing = this._testListings.find(l => l.id === listingId);
      if (listing) {
        this.showToast(`TEST MODE: Purchased ${amount}kWh ${listing.energyType} energy from ${listing.seller}`);
      }
      
      return {
        wait: async () => ({
          status: 1,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
        })
      } as unknown as ContractTransactionResponse;
    }

    if (!this.energyMarketContract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    return this.energyMarketContract['buyEnergy'](
      listingId,
      ethers.parseEther(amount.toString())
    );
  }

  async getMaterialHistory(materialId: string): Promise<any[]> {
    if (!this.materialTraceContract) return [];
    
    try {
      const history = await this.materialTraceContract['getHistory'](materialId);
      return history.map((h: any) => ({
        ...h,
        timestamp: new Date(Number(h.timestamp) * 1000)
      }));
    } catch (error) {
      console.error('Error fetching material history:', error);
      return [];
    }
  }
  
  async registerMaterial(materialId: string, data: string): Promise<ContractTransactionResponse> {
    if (!this.materialTraceContract || !this.signer) {
      throw new Error('Wallet not connected');
    }
  
    return this.materialTraceContract['registerMaterial'](
      materialId,
      data
    );
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return this.signer.signMessage(message);
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}