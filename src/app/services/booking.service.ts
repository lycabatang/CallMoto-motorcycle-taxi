import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDocs, updateDoc, query, where, orderBy, docData, onSnapshot, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsCollection = collection(this.firestore, 'bookings');

  constructor(private firestore: Firestore) {}

  async createBooking(bookingData: any): Promise<string> {
    try {
      const docRef = await addDoc(this.bookingsCollection, bookingData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getBookingsTest() {
    try {
      const bookingsCollection = collection(this.firestore, 'bookings');
      const q = query(bookingsCollection);  // Fetch all bookings

      const querySnapshot = await getDocs(q);
      
      const bookings = querySnapshot.docs.map(doc => doc.data());
      console.log('Fetched bookings:', bookings);  // Log fetched data

      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  async getBookingsWithRiderName(userId: string, role: 'customer' | 'rider') {
  try {
    const bookingsCollection = collection(this.firestore, 'bookings');

    const q = query(
      bookingsCollection,
      where(`${role}Id`, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No bookings found for the userId:', userId);
    } else {
      console.log('Bookings found:', querySnapshot.docs.length);
    }

    const bookingsWithRiderName = await Promise.all(
      querySnapshot.docs.map(async (snapshotDoc) => {
        const bookingData = snapshotDoc.data();

        if (bookingData['riderId']) {
          const riderDocRef = doc(this.firestore, 'userDetails', bookingData['riderId']);
          const riderDoc = await getDoc(riderDocRef);

          if (riderDoc.exists()) {
            const riderData = riderDoc.data() as { fullName?: string };
            bookingData['riderName'] = riderData.fullName || 'Unnamed Rider';
          } else {
            bookingData['riderName'] = 'Rider not found';
          }
        } else {
          bookingData['riderName'] = 'No rider assigned';
        }

        return { id: snapshotDoc.id, ...bookingData };
      })
    );

    console.log('Fetched bookings with rider names:', bookingsWithRiderName);
    return bookingsWithRiderName;
  } catch (error) {
    console.error('Error fetching bookings with rider names:', error);
    throw error;
  }
}



  getBookings(userId: string, role: 'customer' | 'driver') {
    const q = query(
      collection(this.firestore, 'bookings'),
      where(`${role}Id`, '==', userId),
      orderBy('createdAt', 'desc')
    );

    return new Observable<any[]>(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched bookings:', bookings); // Add this
        observer.next(bookings);
      }, (error) => {
        console.error('Error fetching bookings:', error);
        observer.error(error);
      });

      return { unsubscribe };
    });
  }

  getBookingById(bookingId: string): Observable<any> {
    const bookingDocument = doc(this.firestore, 'bookings', bookingId);
    return docData(bookingDocument, { idField: 'id' }) as Observable<any>;
  }

  async updateBooking(bookingId: string, data: any): Promise<void> {
    const bookingDocument = doc(this.firestore, 'bookings', bookingId);
    try {
      // Ensure riderId is set and status is updated
      await updateDoc(bookingDocument, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating booking with ID ${bookingId}:`, error);
      throw error;
    }
  }

  // Real-time listener for booking updates
  listenToBookingUpdates(bookingId: string, callback: (booking: any) => void): void {
    const bookingDocRef = doc(this.firestore, 'bookings', bookingId);

    // Listen to changes in the booking document
    onSnapshot(bookingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data()); // Pass the updated data to the callback
      }
    });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Calculate price based on distance
  calculatePrice(distanceInKm: number): number {
    const baseFare = 50; // Base fare in PHP
    const ratePerKm = 15; // PHP per kilometer

    return Math.round(baseFare + (distanceInKm * ratePerKm));
  }
}
