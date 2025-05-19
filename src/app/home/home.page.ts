import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { LocationPickerComponent, LocationData } from '../location/location-picker.component';
import { BookingService } from '../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { FindingRiderModalComponent } from '../finding-rider/finding-rider-modal.component';
import { firstValueFrom } from 'rxjs';  // For converting Observable to Promise
import { Auth } from '@angular/fire/auth';  // Import Firebase Auth

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class HomePage implements OnInit {
  riders = [
    { name: 'John Rider', photo: 'assets/avatar-placeholder.png', rating: 4.8, distance: '0.5 km' },
    { name: 'Maria Rides', photo: 'assets/avatar-placeholder.png', rating: 4.9, distance: '0.8 km' }
  ];

  pickupLocation: LocationData = { address: '', latitude: 0, longitude: 0 };
  dropoffLocation: LocationData = { address: '', latitude: 0, longitude: 0 };
  isOnMainPage = false;
  userId: string | null = null;

  constructor(
    public router: Router,
    private modalCtrl: ModalController,
    private bookingService: BookingService,
    private auth: Auth  // Inject Firebase Auth service
  ) {}

  ngOnInit() {
    console.log("HomePage initialized");

    // Get the current user ID from Firebase Auth
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userId = user.uid;  // Save the user ID
        console.log("Current User ID:", this.userId);
      } else {
        console.log("No user is signed in");
      }
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isOnMainPage = event.url === '/home' || event.url === '/home/home';
      });
  }

  toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  calculateDistance(pickup: LocationData, dropoff: LocationData): number {
    const R = 6371; // Radius of the Earth in km
    const lat1 = this.toRad(pickup.latitude);
    const lon1 = this.toRad(pickup.longitude);
    const lat2 = this.toRad(dropoff.latitude);
    const lon2 = this.toRad(dropoff.longitude);

    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in km
    return distance;
  }

  async openPickupLocationPicker() {
    console.log('Opening Pickup Modal');
    try {
      const modal = await this.modalCtrl.create({
        component: LocationPickerComponent,
        componentProps: {
          initialLocation: this.pickupLocation.latitude ? this.pickupLocation : null
        }
      });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (data) {
        this.pickupLocation = data;
      }
    } catch (error) {
      console.error('Error creating modal:', error);
    }
  }

  async openDropoffLocationPicker() {
    console.log('Opening Destination Modal');
    const modal = await this.modalCtrl.create({
      component: LocationPickerComponent,
      componentProps: {
        initialLocation: this.dropoffLocation.latitude ? this.dropoffLocation : null
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.dropoffLocation = data;
    }
  }

  async findRiders() {
    console.log('find riders');
    if (!this.pickupLocation.latitude || !this.dropoffLocation.latitude) {
      console.error('Pickup and/or Dropoff location not selected');
      return;
    }

    // Calculate distance
    const distance = this.calculateDistance(this.pickupLocation, this.dropoffLocation);

    // Price per kilometer
    const pricePerKm = 30;

    // Calculate the price based on the distance
    const price = 40 + (distance * pricePerKm);
    console.log("this", this);
    const bookingData = {
      customerId: this.userId,  // Use the current user ID
      pickupLocation: {
        latitude: this.pickupLocation.latitude,
        longitude: this.pickupLocation.longitude
      },
      dropoffLocation: {
        latitude: this.dropoffLocation.latitude,
        longitude: this.dropoffLocation.longitude
      },
      status: 'pending',
      riderId: null,
      distance: distance, // Include computed distance
      price: price, // Include calculated price
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Booking Data:', bookingData);

    try {
      // Creating booking
      const bookingId: string = await this.bookingService.createBooking(bookingData);
      console.log('Booking created successfully');

      // Fetch the full booking data using bookingId
      const createdBooking = await firstValueFrom(this.bookingService.getBookingById(bookingId)); // Using firstValueFrom to convert Observable to Promise
      console.log('Created Booking:', createdBooking);

      // Show loading modal
      const modal = await this.modalCtrl.create({
        component: FindingRiderModalComponent,
        componentProps: {
          distance: createdBooking.distance,
          price: createdBooking.price,
          bookingId: bookingId  // Pass bookingId to the modal
        },
        backdropDismiss: false,
        showBackdrop: true
      });
      await modal.present();
    } catch (error) {
      console.error('Error creating booking', error);
    }
  }
}
