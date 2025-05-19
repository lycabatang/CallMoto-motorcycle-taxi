import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-content',
  template: `
    <div class="motorcycle-grid">
      <ion-card *ngFor="let motorcycle of motorcycles">
        <img [src]="motorcycle.image" alt="motorcycle"/>
        <ion-card-header>
          <ion-card-title>{{motorcycle.model}}</ion-card-title>
          <ion-card-subtitle>{{motorcycle.brand}}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>{{motorcycle.price}}</p>
          <ion-button expand="block">View Details</ion-button>
        </ion-card-content>
      </ion-card>
    </div>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomeContentComponent {
  motorcycles = [
    // Add your motorcycle data here
  ];
}
