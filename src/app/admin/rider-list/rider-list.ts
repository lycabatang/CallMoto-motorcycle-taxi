import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';  // Corrected import path
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';  // Import Firestore
import { IonicModule } from '@ionic/angular';

export interface Rider {
  userId: string;
  fullName: string;
  status: 'active' | 'inactive';
  email: string;
  mobileNumber: string;
}

@Component({
  selector: 'app-rider-list',
  templateUrl: './rider-list.html',
  styleUrls: ['./rider-list.scss'],
  imports: [IonicModule, CommonModule],
})
export class RiderLists implements OnInit {
  riders: Rider[] = [];

  constructor(private riderService: UserService, private firestore: Firestore) {}

  ngOnInit(): void {
    this.fetchRiders();
  }

  private async fetchRiders(): Promise<void> {
    try {
      const data = await this.riderService.fetchAllRiders();  // Await the result from the service
      console.log("Fetched riders:", data);
      this.riders = data.map(doc => ({
        userId: doc['userId'],
        fullName: doc['fullName'],
        status: doc['status'],
        email: doc['email'],
        mobileNumber: doc['mobileNumber'],
      }));  // Map DocumentData to Rider type
    } catch (error) {
      console.error('Failed to fetch riders:', error);  // Handle errors
    }
  }

  async activateRider(rider: Rider): Promise<void> {
    try {
      const riderDoc = doc(this.firestore, `userDetails/${rider.userId}`);
      await updateDoc(riderDoc, { status: 'active' });
      rider.status = 'active';
    } catch (error) {
      console.error('Error activating rider:', error);
    }
  }

  async deactivateRider(rider: Rider): Promise<void> {
    try {
      const riderDoc = doc(this.firestore, `userDetails/${rider.userId}`);
      await updateDoc(riderDoc, { status: 'inactive' });
      rider.status = 'inactive';
    } catch (error) {
      console.error('Error deactivating rider:', error);
    }
  }

  // RiderLists Component (Updated)

    async deleteRider(userId: string): Promise<void> {
    try {
        const riderDoc = doc(this.firestore, `userDetails/${userId}`);
        await updateDoc(riderDoc, { status: 'deleted' });
        console.log('Rider marked as deleted.');

        this.riders = this.riders.filter(r => r.userId !== userId);
    } catch (error) {
        console.error('Error marking rider as deleted:', error);
    }
    }


}
