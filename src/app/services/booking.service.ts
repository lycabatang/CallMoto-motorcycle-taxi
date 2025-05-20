import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  docData,
  onSnapshot,
  getDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsCollection = collection(this.firestore, 'bookings');

  constructor(private firestore: Firestore) {}

  /** Creates a new booking document and returns the document ID */
  async createBooking(bookingData: any): Promise<string> {
    try {
      const docRef = await addDoc(this.bookingsCollection, bookingData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /** Fetch all bookings (for debugging/testing) */
  async getBookingsTest() {
    try {
      const q = query(this.bookingsCollection);
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched bookings:', bookings);
      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  /**
   * Fetch bookings for a user (customer or rider) including rider's full name
   * @param userId ID of the user (customer or rider)
   * @param role 'customer' or 'rider'
   * @returns Array of bookings with riderName included
   */

  async hasOngoingBooking(userId: string): Promise<boolean> {
    console.log('hasOngoingBooking called with userId:', userId);
    try {
      const q = query(
        collection(this.firestore, 'bookings'),
        where('customerId', '==', userId),
        where('status', 'in', ['pending', 'accepted', 'ongoing'])
      );
  
      const querySnapshot = await getDocs(q);
  
      console.log('QuerySnapshot:', querySnapshot);
      console.log('Ongoing bookings found:', querySnapshot.size);
  
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking ongoing bookings:', error);
      return false;
    }
  }

  async getRiderDetails(riderId: string): Promise<{ fullName?: string; location?: { lat: number; lng: number } } | null> {
    try {
      const riderDocRef = doc(this.firestore, 'userDetails', riderId);
      const riderDoc = await getDoc(riderDocRef);
      return riderDoc.exists() ? riderDoc.data() as { fullName?: string; location?: { lat: number; lng: number } } : null;
    } catch (error) {
      console.error('Error fetching rider details:', error);
      return null;
    }
  }
  
  
  async getBookingsWithRiderName(userId: string, role: 'customer' | 'rider') {
    try {
      const q = query(
        this.bookingsCollection,
        where(`${role}Id`, '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No bookings found for the userId:', userId);
        return [];
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

  /**
   * Real-time observable to fetch bookings for a user
   * @param userId user ID (customer or rider)
   * @param role role string ('customer' or 'rider')
   * @returns Observable of booking arrays
   */
  getBookings(userId: string, role: 'customer' | 'rider'): Observable<any[]> {
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
        console.log('Fetched bookings (real-time):', bookings);
        observer.next(bookings);
      }, (error) => {
        console.error('Error fetching bookings:', error);
        observer.error(error);
      });

      return { unsubscribe };
    });
  }

  
  /** Returns an observable for a single booking by ID */
  getBookingById(bookingId: string): Observable<any> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingId);
    return docData(bookingDoc, { idField: 'id' }) as Observable<any>;
  }


  submitFeedback(rideId: string, feedback: string, rating: number): Promise<void> {
    const bookingDocRef = doc(this.firestore, 'bookings', rideId);
    return updateDoc(bookingDocRef, {
      customerFeedback: feedback,
      customerRating: rating,
      customerFeedbackSubmitted: true,
      status: 'done',   // <-- update status here
      updatedAt: new Date()  // optional, keep track of update time
    });
  }
  
  
  /** Updates a booking document with new data */
  async updateBooking(bookingId: string, data: any): Promise<void> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingId);
    try {
      await updateDoc(bookingDoc, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating booking with ID ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Sets up a real-time listener for booking updates
   * @param bookingId ID of the booking to listen to
   * @param callback callback function called with updated booking data
   */
  listenToBookingUpdates(bookingId: string, callback: (booking: any) => void): void {
    const bookingDocRef = doc(this.firestore, 'bookings', bookingId);

    onSnapshot(bookingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  }

  /** Calculates distance between two coordinates in kilometers */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
  
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /** Calculates price based on distance */
  calculatePrice(distanceInKm: number): number {
    const baseFare = 50; // Base fare in PHP
    const ratePerKm = 15; // PHP per kilometer
    return Math.round(baseFare + (distanceInKm * ratePerKm));
  }
}
