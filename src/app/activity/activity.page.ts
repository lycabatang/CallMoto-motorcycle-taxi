import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../services/booking.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ActivityPage implements OnInit, OnDestroy {
  rides: any[] = [];
  user: User | null = null;
  isLoading = true;
  userLocation: { lat: number; lng: number } | null = null;
  activeTab: 'active' | 'completed' | 'history' = 'active';

  private bookingsSubscription?: Subscription;
  private mapInstances: { [rideId: string]: L.Map } = {};

  constructor(
    private bookingService: BookingService,
    private auth: Auth,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        this.getUserLocation();
        this.subscribeToUserBookings(user.uid);
      } else {
        this.isLoading = false;
        this.unsubscribeBookings();
      }
    });
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.ngZone.run(() => {
            this.userLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            };
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
    } else {
      console.warn('Geolocation not supported');
    }
  }

  subscribeToUserBookings(userId: string) {
    this.isLoading = true;
    this.unsubscribeBookings();

    this.bookingsSubscription = this.bookingService
      .getBookings(userId, 'customer')
      .subscribe(async (bookings) => {
        const enrichedBookings = await Promise.all(
          bookings.map(async (booking) => {
            if (booking.riderId) {
              const riderDetails = await this.bookingService.getRiderDetails(booking.riderId);
              booking.riderName = riderDetails?.fullName || 'Unnamed Rider';
              booking.riderLocation = riderDetails?.location || null;
            } else {
              booking.riderName = 'No rider assigned';
              booking.riderLocation = null;
            }
            return booking;
          })
        );

        this.ngZone.run(() => {
          // Filter rides to accepted, in-progress, or completed
          this.rides = enrichedBookings.filter(
            b => ['accepted', 'in-progress', 'completed', 'done'].includes(b.status)
          );
          this.isLoading = false;

          // Initialize maps for 'in-progress' rides in active tab
          setTimeout(() => this.initializeMaps(), 300);
        });
      }, (error: any) => {
        console.error('Error subscribing to bookings:', error);
        this.isLoading = false;
      });
  }

  initializeMaps() {
    // Remove previous map instances
    Object.values(this.mapInstances).forEach(map => map.remove());
    this.mapInstances = {};

    if (this.activeTab !== 'active') return; // Only show maps on active rides tab

    this.rides.forEach(ride => {
      if (
        ride.status === 'in-progress' &&
        ride.pickupLocation &&
        ride.dropoffLocation
      ) {
        const mapId = `map-${ride.id}`;
        const mapContainer = document.getElementById(mapId);
        if (!mapContainer) return;

        mapContainer.style.height = '200px';
        mapContainer.innerHTML = ''; // Clear old map if any

        const map = L.map(mapId).setView(
          [ride.pickupLocation.latitude, ride.pickupLocation.longitude], 13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const redIcon = L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const blueIcon = L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const pickupLatLng = L.latLng(ride.pickupLocation.latitude, ride.pickupLocation.longitude);
        const dropoffLatLng = L.latLng(ride.dropoffLocation.latitude, ride.dropoffLocation.longitude);

        L.marker(pickupLatLng, { icon: redIcon }).addTo(map).bindPopup('Pickup Location');
        L.marker(dropoffLatLng, { icon: blueIcon }).addTo(map).bindPopup('Dropoff Location');

        L.polyline([pickupLatLng, dropoffLatLng], {
          color: 'blue',
          weight: 4,
          opacity: 0.7,
          dashArray: '6, 10'
        }).addTo(map);

        map.fitBounds(
          [
            [pickupLatLng.lat, pickupLatLng.lng],
            [dropoffLatLng.lat, dropoffLatLng.lng]
          ],
          { padding: [20, 20] }
        );

        this.mapInstances[ride.id] = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }
    });
  }

  setRating(ride: any, rating: number) {
    ride.customerRating = rating;
  }

  submitFeedback(ride: any) {
    if (!ride.customerFeedback || !ride.customerRating) {
      alert('Please provide both feedback and a rating.');
      return;
    }

    this.bookingService.submitFeedback(ride.id, ride.customerFeedback, ride.customerRating)
      .then(() => {
        this.ngZone.run(() => {
          ride.customerFeedbackSubmitted = true;
          ride.status = 'done'; // Optional: update status after feedback
        });
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to submit feedback. Please try again.');
      });
  }

  unsubscribeBookings() {
    if (this.bookingsSubscription) {
      this.bookingsSubscription.unsubscribe();
      this.bookingsSubscription = undefined;
    }

    Object.values(this.mapInstances).forEach(map => map.remove());
    this.mapInstances = {};
  }

  ngOnDestroy() {
    this.unsubscribeBookings();
  }

 onTabChange(tab: 'active' | 'completed' | 'history') {
  this.activeTab = tab;
  setTimeout(() => this.initializeMaps(), 300);
}

  get activeRides() {
    return this.rides.filter(r => ['accepted', 'in-progress'].includes(r.status));
  }

  get completedRides() {
    return this.rides.filter(r => r.status === 'completed');
  }
  get historyRides() {
    return this.rides.filter(r => r.status === 'done'); // or other logic
  }
}
