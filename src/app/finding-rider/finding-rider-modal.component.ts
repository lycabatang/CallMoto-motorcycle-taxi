import { Component, Input, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  getDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-finding-rider-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Finding Riders…</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancelSearch()" aria-label="Cancel searching for rider">
            Cancel
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding ion-text-center">
      <div class="spinner-container">
        <ion-spinner name="crescent" color="primary" style="width: 80px; height: 80px;"></ion-spinner>
      </div>

      <h2 class="status-title">Looking for a nearby rider</h2>
      <p class="status-subtitle">Please wait while we find the best rider for you.</p>

      <ion-card class="ride-details-card">
        <ion-card-header>
          <ion-card-title>Ride Details</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Ride ID:</strong> {{ bookingId }}</p>
          <p><strong>Distance:</strong> {{ distance | number: '1.1-2' }} km</p>
          <p><strong>Amount:</strong> ₱{{ price | number: '1.2-2' }}</p>
        </ion-card-content>
      </ion-card>

      <ion-card class="ride-details-card" *ngIf="riders.length > 0">
        <ion-card-header>
          <ion-card-title>Available Riders ({{ riders.length }})</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let rider of riders">
              <ion-label>
                <h2>{{ rider.fullName || 'Unnamed Rider' }}</h2>
                <p>{{ rider.email || 'No email' }}</p>
                <p><small>{{ rider.distance | number:'1.2-2' }} km away</small></p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .spinner-container {
      margin: 30px auto 10px auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .status-title {
      font-weight: 600;
      font-size: 1.5rem;
      margin-top: 0;
    }
    .status-subtitle {
      font-weight: 400;
      color: var(--ion-color-medium);
      margin-bottom: 25px;
    }
    .ride-details-card {
      border-radius: 12px;
      box-shadow: var(--ion-box-shadow);
      max-width: 320px;
      margin: 10px auto;
    }
  `]
})
export class FindingRiderModalComponent implements OnInit, OnDestroy {
  @Input() distance!: number;
  @Input() price!: number;
  @Input() bookingId?: string;

  @Input() userLat!: number;
  @Input() userLng!: number;

  riders: any[] = [];
  private unsubscribe?: () => void;

  constructor(
    public modalCtrl: ModalController,
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.bookingId) {
      console.error('❌ No bookingId provided');
      return;
    }
    if (this.userLat === undefined || this.userLng === undefined) {
      console.error('❌ No user location provided');
      return;
    }

    this.listenToBookingStatus();
    this.findAvailableRiders();
  }

  async ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (!this.bookingId) return;

    const bookingDocRef = doc(this.firestore, 'bookings', this.bookingId);
    try {
      const docSnap = await getDoc(bookingDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const status = data['status'];
        if (status !== 'accepted' && status !== 'cancelled' && status !== 'expired') {
          await this.updateBookingStatusToCancelled();
        }
      }
    } catch (error) {
      console.error('❌ Error checking booking status on destroy:', error);
    }
  }

  listenToBookingStatus() {
    const bookingDocRef = doc(this.firestore, 'bookings', this.bookingId!);
    this.unsubscribe = onSnapshot(bookingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data['status'] === 'accepted' && data['riderId']) {
          this.dismissModalAndNavigate();
        } else if (data['status'] === 'cancelled' || data['status'] === 'expired') {
          this.cancelSearch();
        }
      }
    });
  }

  async findAvailableRiders() {
    const userDetailsRef = collection(this.firestore, 'userDetails');
    const q = query(
      userDetailsRef,
      where('userType', '==', 'rider'),
      where('status', '==', 'active'),
      where('profileComplete', '==', true)
    );

    try {
      const snapshot = await getDocs(q);

      const ridersWithDistance = snapshot.docs.map(doc => {
        const data = doc.data();
        const lat = data['latitude'];
        const lng = data['longitude'];

        const distance = (lat !== undefined && lng !== undefined)
          ? this.getDistanceFromLatLonInKm(this.userLat, this.userLng, lat, lng)
          : Number.MAX_SAFE_INTEGER;

        return { id: doc.id, distance, ...data };
      });

      ridersWithDistance.sort((a, b) => a.distance - b.distance);

      this.riders = ridersWithDistance.slice(0, 5);

      console.log('✅ Top 5 nearest riders:', this.riders);

      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error fetching riders:', error);
    }
  }

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async updateBookingStatusToCancelled() {
    if (!this.bookingId) return;
    const bookingDocRef = doc(this.firestore, 'bookings', this.bookingId);
    try {
      await updateDoc(bookingDocRef, { status: 'cancelled' });
      console.log('✅ Booking status updated to cancelled');
    } catch (error) {
      console.error('❌ Failed to update booking status:', error);
    }
  }

  async dismissModalAndNavigate() {
    await this.modalCtrl.dismiss();
    setTimeout(() => {
      this.router.navigate(['/home/activity']);
    }, 500);
  }

  async cancelSearch() {
    await this.updateBookingStatusToCancelled();
    await this.modalCtrl.dismiss({ cancelled: true });
  }
}
