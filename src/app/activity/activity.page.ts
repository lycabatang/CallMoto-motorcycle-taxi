import { Component, OnInit, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BookingService } from '../services/booking.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ActivityPage implements OnInit {
  rides: any[] = [];
  user: User | null = null;
  isLoading = true;

  constructor(
    private bookingService: BookingService,
    private auth: Auth,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Logged-in user UID:', user.uid);
        this.user = user;
        this.fetchUserBookings(user.uid);
      } else {
        console.warn('No user signed in');
        this.isLoading = false;
      }
    });
  }

  fetchUserBookings(userId: string) {
  this.bookingService.getBookingsWithRiderName(userId, 'customer').then(
    (bookings) => {
      console.log('fetched bookings:', bookings);
      this.ngZone.run(() => {
        this.rides = bookings.filter(
          (b: { id: string; status?: string }) =>
            b.status === 'accepted' || b.status === 'in-progress'
        );
        this.isLoading = false;
      });
    },
    (error) => {
      console.error('Failed to fetch bookings:', error);
      this.isLoading = false;
    }
  );
}


}
