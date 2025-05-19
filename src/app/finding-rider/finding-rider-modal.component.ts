import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-finding-rider-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Finding Riders…</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-spinner name="dots"></ion-spinner>
      <p class="ion-margin-top">Looking for a nearby rider...</p>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Ride Details</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Distance:</strong> {{ distance | number: '1.1-2' }} km</p>
          <p><strong>Amount:</strong> ₱{{ price | number: '1.2-2' }}</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class FindingRiderModalComponent implements OnInit, OnDestroy {
  @Input() distance!: number;
  @Input() price!: number;
  @Input() bookingId!: string | undefined; // Explicitly allow undefined

  private unsubscribe!: () => void;

  constructor(
    public modalCtrl: ModalController,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.bookingId) {
      console.error('No bookingId provided');
      return; // Exit early if no bookingId is provided
    }

    const bookingDocRef = doc(this.firestore, 'bookings', this.bookingId);

    // Listen for ride status change
    this.unsubscribe = onSnapshot(bookingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data['status'] === 'accepted' && data['riderId']) {
          // Rider has accepted, dismiss modal and navigate
          this.dismissModalAndNavigate();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe(); // Cleanup listener
    }
  }

  // Handle modal dismissal and navigate after a short delay
  async dismissModalAndNavigate() {
    await this.modalCtrl.dismiss();
    setTimeout(() => {
      this.router.navigate(['/home/activity']); // Navigate to the desired page
    }, 500); // Small delay to ensure modal is dismissed first
  }
}
