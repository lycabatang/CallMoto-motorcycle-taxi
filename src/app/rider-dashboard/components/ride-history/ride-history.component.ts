import { Component, OnInit, NgZone } from '@angular/core';
import { collection, getDocs, query, where, CollectionReference } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Ride {
  bookingId: string;
  pickup: string;
  dropoff: string;
  status: string;
  price: number;
}

@Component({
  selector: 'app-ride-history',
  templateUrl: './ride-history.component.html',
  styleUrls: ['./ride-history.component.scss'],
  imports: [IonicModule, RouterModule, CommonModule],
})
export class RideHistoryComponent implements OnInit {
  rides: Ride[] = [];
  rider: User | null = null;
  isLoading = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.rider = user;
        this.loadCompletedRides();
      } else {
        console.warn('No rider is signed in');
      }
    });
  }

  async loadCompletedRides() {
    this.isLoading = true;
    const bookingsRef = collection(this.firestore, 'bookings') as CollectionReference;

    const q = query(
      bookingsRef,
      where('riderId', '==', this.rider?.uid)
    );

    try {
      const querySnapshot = await getDocs(q);
      this.ngZone.run(() => {
        this.rides = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            bookingId: doc.id,
            pickup: `${data['pickupLocation'].latitude}, ${data['pickupLocation'].longitude}`,
            dropoff: `${data['dropoffLocation'].latitude}, ${data['dropoffLocation'].longitude}`,
            status: data['status'],
            price: data['price'] ?? 0
          } as Ride;
        });
      });
    } catch (error) {
      console.error('Error fetching ride history:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
