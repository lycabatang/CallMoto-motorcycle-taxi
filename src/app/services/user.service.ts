import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private ridersCollection;

  constructor(private firestore: Firestore) {
    this.ridersCollection = collection(this.firestore, 'users') as CollectionReference<DocumentData>;
  }

  // Fetch all riders based on userType
  // RiderService (Updated)

async fetchAllRiders() {
  try {
    const user = collection(this.firestore, 'userDetails');
    
    // Filter by userType 'rider' and ensure the status is not 'deleted'
    const q = query(user, 
      where('userType', '==', 'rider'),
      where('status', '!=', 'deleted')  // Filter out deleted riders
    );

    const querySnapshot = await getDocs(q);

    const riders = querySnapshot.docs.map(doc => doc.data());
    console.log('Fetched riders:', riders);  // Log fetched riders

    return riders;  // Return filtered list of riders
  } catch (error) {
    console.error('Error fetching riders:', error);
    throw error;
  }
}

async fetchAllCustomer() {
  try {
    const user = collection(this.firestore, 'userDetails');
    
    // Filter by userType 'rider' and ensure the status is not 'deleted'
    const q = query(user, 
      where('userType', '==', 'customer'),
      where('status', '!=', 'deleted')  // Filter out deleted riders
    );

    const querySnapshot = await getDocs(q);

    const customers = querySnapshot.docs.map(doc => doc.data());
    console.log('Fetched customer:', customers);  // Log fetched riders

    return customers;  // Return filtered list of riders
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
}


  // Fetch all users, not filtered by userType
  fetchAllUsers(): Observable<any[]> {
    const q = query(this.ridersCollection);  // Fetching all users, no filter
    console.log("Fetching all users with query:", q);

    return new Observable(observer => {
        getDocs(q)
        .then(snapshot => {
            if (snapshot.empty) {
            console.log('No users found.');
            observer.next([]);  // Return empty array if no users found
            observer.complete();
            } else {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Fetched all users:', users);  // Log all users
            observer.next(users);
            observer.complete();
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            observer.error(error);
        });
    });
  }
}
