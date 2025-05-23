import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { LocationPickerComponent, LocationData } from '../location/location-picker.component';
import { BookingService } from '../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, firstValueFrom } from 'rxjs';
import { FindingRiderModalComponent } from '../finding-rider/finding-rider-modal.component';
import { Auth } from '@angular/fire/auth';

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
    private alertCtrl: AlertController,
    private bookingService: BookingService,
    private auth: Auth
  ) {}

  ngOnInit() {
    console.log("HomePage initialized");

    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userId = user.uid;
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

    return R * c;
  }

  async openPickupLocationPicker() {
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
        // Check if address contains "Tuguegarao City"
        if (!data.address.toLowerCase().includes('tuguegarao')) {
          const alert = await this.alertCtrl.create({
            header: 'Invalid Location',
            message: 'Please select a location within Tuguegarao City only.',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        this.pickupLocation = data;
      }
    } catch (error) {
      console.error('Error opening pickup modal:', error);
    }
  }
  

  async openDropoffLocationPicker() {
    try {
      const modal = await this.modalCtrl.create({
        component: LocationPickerComponent,
        componentProps: {
          initialLocation: this.dropoffLocation.latitude ? this.dropoffLocation : null
        }
      });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (data) {
        if (!data.address.toLowerCase().includes('tuguegarao')) {
          const alert = await this.alertCtrl.create({
            header: 'Invalid Location',
            message: 'Please select a location within Tuguegarao City only.',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        this.dropoffLocation = data;
      }
    } catch (error) {
      console.error('Error opening dropoff modal:', error);
    }
  }
  

  async findRiders() {
    if (!this.pickupLocation.latitude || !this.dropoffLocation.latitude) {
      console.error('Pickup and/or Dropoff location not selected');
      return;
    }

    if (!this.userId) {
      console.error('User is not authenticated');
      return;
    }

    // 🚫 Check if user has an ongoing ride
    const hasOngoing = await this.bookingService.hasOngoingBooking(this.userId);
    if (hasOngoing) {
      const alert = await this.alertCtrl.create({
        header: 'Ongoing Ride',
        message: 'You already have an ongoing ride. Please complete it before booking another.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const distance = this.calculateDistance(this.pickupLocation, this.dropoffLocation);
    const price = 40 + (distance * 30);

    const bookingData = {
      customerId: this.userId,
      pickupLocation: {
        latitude: this.pickupLocation.latitude,
        longitude: this.pickupLocation.longitude,
        address: this.pickupLocation.address
      },
      dropoffLocation: {
        latitude: this.dropoffLocation.latitude,
        longitude: this.dropoffLocation.longitude,
        address: this.dropoffLocation.address
      },
      status: 'pending',
      riderId: null,
      distance,
      price,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const bookingId: string = await this.bookingService.createBooking(bookingData);
      console.log('Booking created successfully with ID:', bookingId);

      const createdBooking = await firstValueFrom(this.bookingService.getBookingById(bookingId));
      console.log('Fetched created booking:', createdBooking);

      const modal = await this.modalCtrl.create({
        component: FindingRiderModalComponent,
        componentProps: {
          distance: createdBooking.distance,
          price: createdBooking.price,
          bookingId,
          userLat: this.pickupLocation.latitude,
          userLng: this.pickupLocation.longitude
        },
        backdropDismiss: false,
        showBackdrop: true
      });

      await modal.present();
    } catch (error) {
      console.error('Error creating booking or opening modal:', error);
    }
  }
}
