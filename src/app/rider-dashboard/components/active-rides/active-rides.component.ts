import { Component, OnInit, NgZone } from '@angular/core';
import {
  collection,
  getDocs,
  query,
  where,
  CollectionReference,
  doc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';


interface Ride {
  bookingId: string;
  pickup: string;
  dropoff: string;
  status: 'pending' | 'accepted' | 'declined' | 'in-progress' | 'completed';
  price: number;
}

@Component({
  selector: 'app-active-rides',
  templateUrl: './active-rides.component.html',
  styleUrls: ['./active-rides.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ActiveRidesComponent implements OnInit {
  rides: Ride[] = [];
  rider: User | null = null;
  isLoading = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private loadingCtrl: LoadingController,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.rider = user;
        this.loadActiveRides();
      } else {
        console.warn('No rider is signed in');
      }
    });
  }

  async loadActiveRides() {
    this.isLoading = true;
    const bookingsRef = collection(this.firestore, 'bookings') as CollectionReference;

    const q = query(
      bookingsRef,
      where('status', 'in', ['pending', 'accepted', 'in-progress'])
    );


    const loading = await this.loadingCtrl.create({ message: 'Loading rides...' });
    await loading.present();

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
      console.error('Error fetching rides:', error);
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async declineRide(ride: Ride) {
    const bookingRef = doc(this.firestore, 'bookings', ride.bookingId);

    const loading = await this.loadingCtrl.create({
      message: 'Declining ride...',
    });
    await loading.present();

    try {
      await updateDoc(bookingRef, {
        status: 'declined',
        updatedAt: serverTimestamp(),
      });
      ride.status = 'declined';
    } catch (error) {
      console.error('Error declining ride:', error);
    } finally {
      await loading.dismiss();
    }
  }

  async acceptRide(ride: Ride) {
    if (!this.rider) {
      console.error('No signed-in rider found.');
      return;
    }

    const bookingRef = doc(this.firestore, 'bookings', ride.bookingId);

    const loading = await this.loadingCtrl.create({
      message: 'Accepting ride...',
    });
    await loading.present();

    try {
      await updateDoc(bookingRef, {
        status: 'accepted',
        riderId: this.rider.uid,
        updatedAt: serverTimestamp(),
      });
      ride.status = 'accepted';
    } catch (error) {
      console.error('Error accepting ride:', error);
    } finally {
      await loading.dismiss();
    }
  }

  async startRide(ride: Ride) {
    const bookingRef = doc(this.firestore, 'bookings', ride.bookingId);

    const loading = await this.loadingCtrl.create({
      message: 'Starting ride...',
    });
    await loading.present();

    try {
      await updateDoc(bookingRef, {
        status: 'in-progress',
        updatedAt: serverTimestamp(),
      });
      ride.status = 'in-progress';
    } catch (error) {
      console.error('Error starting ride:', error);
    } finally {
      await loading.dismiss();
    }
  }

  async completeRide(ride: Ride) {
    const bookingRef = doc(this.firestore, 'bookings', ride.bookingId);

    const loading = await this.loadingCtrl.create({
      message: 'Completing ride...',
    });
    await loading.present();

    try {
      await updateDoc(bookingRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Remove the completed ride from the list
      this.rides = this.rides.filter(r => r.bookingId !== ride.bookingId);

      // Navigate to ride history
      this.router.navigate(['/rider-dashboard/ride-history']);
    } catch (error) {
      console.error('Error completing ride:', error);
    } finally {
      await loading.dismiss();
    }
  }
}
