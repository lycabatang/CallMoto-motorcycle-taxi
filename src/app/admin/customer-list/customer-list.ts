import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../../services/user.service';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';

export interface Customer {
  userId: string;
  fullName: string;
  status: 'active' | 'inactive';
  email: string;
  mobileNumber: string;
}

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.scss'],
  imports: [IonicModule, CommonModule],
})
export class CustomerLists  implements OnInit {
  customer: Customer[] = [];

  constructor(private userSerivce: UserService, private firestore: Firestore) {}

  ngOnInit(): void {
    this.fetchCustomer();
  }

  private async fetchCustomer(): Promise<void> {
    try {
      const data = await this.userSerivce.fetchAllCustomer();  // Await the result from the service
      console.log("Fetched riders:", data);
      this.customer = data.map(doc => ({
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

    async activateCustomer(customer: Customer): Promise<void> {
      try {
        const customerrDoc = doc(this.firestore, `userDetails/${customer.userId}`);
        await updateDoc(customerrDoc, { status: 'active' });
        customer.status = 'active';
      } catch (error) {
        console.error('Error activating customer:', error);
      }
    }
  
    async deactivateCustomer(customer: Customer): Promise<void> {
      try {
        const customerrDoc = doc(this.firestore, `userDetails/${customer.userId}`);
        await updateDoc(customerrDoc, { status: 'inactive' });
        customer.status = 'inactive';
      } catch (error) {
        console.error('Error deactivating customer:', error);
      }
    }
  
    // RiderLists Component (Updated)
  
      async deleteCustomer(userId: string): Promise<void> {
      try {
          const customerrDoc = doc(this.firestore, `userDetails/${userId}`);
          await updateDoc(customerrDoc, { status: 'deleted' });
          console.log('Rider marked as deleted.');
  
          this.customer = this.customer.filter(c => c.userId !== userId);
      } catch (error) {
          console.error('Error marking rider as deleted:', error);
      }
      }

}
