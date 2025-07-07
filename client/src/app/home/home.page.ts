import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
  IonGrid, IonRow, IonCol, IonText, IonCardSubtitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flash, reloadCircle } from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { CommonModule, NgFor } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
    IonGrid, IonRow, IonCol, IonText, IonCardSubtitle,
    CommonModule // This includes NgFor directive
  ]
})
export class HomePage implements AfterViewInit {
  @ViewChild('energyChart') chartRef!: ElementRef;
  energyChart: any;

  quickStats = [
    { value: '1.2M+', label: 'Total Transactions' },
    { value: '45K+', label: 'Active Users' },
    { value: '350K+', label: 'kWh Traded' },
    { value: '85K+', label: 'Items Recycled' }
  ];

  constructor() {
    addIcons({ flash, reloadCircle }); // Using reloadCircle instead of recycle
    Chart.register(...registerables);
  }

  ngAfterViewInit() {
    this.createChart();
  }

  createChart() {
    const ctx = this.chartRef.nativeElement.getContext('2d');
    
    this.energyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Solar Energy (EBT/kWh)',
            data: [0.12, 0.11, 0.10, 0.09, 0.08, 0.07],
            borderColor: '#FFA726',
            backgroundColor: 'rgba(255, 167, 38, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Wind Energy (EBT/kWh)',
            data: [0.10, 0.09, 0.08, 0.07, 0.06, 0.05],
            borderColor: '#42A5F5',
            backgroundColor: 'rgba(66, 165, 245, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Price (EBT/kWh)'
            }
          }
        }
      }
    });
  }
}