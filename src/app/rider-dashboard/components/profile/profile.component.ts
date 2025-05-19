import { Component, OnInit, NgZone } from '@angular/core';
import { Auth, User, onAuthStateChanged, updatePassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { getFirestore } from 'firebase/firestore';
import { LoadingController, AlertController, IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface UserProfile {
  fullName: string;
  email: string;
  mobileNumber: string;
  photoURL?: string;
  newPassword: string; // Add the new password
  confirmPassword: string; // Add confirm password
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  showNewPassword = false;
  showConfirmPassword = false;

  userProfile: UserProfile = {
    fullName: '',
    email: '',
    mobileNumber: '',
    photoURL: '',
    newPassword: '', // Initialize newPassword
    confirmPassword: '', // Initialize confirmPassword
  };

  isLoading = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('has user', user);
        this.user = user;
        this.loadUserProfile();
      } else {
        console.log('No user is signed in');
        this.isLoading = false;
      }
    });
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }


  async onSubmit() {
    this.router.navigate(['/welcome']);
  }

  async loadUserProfile() {
    this.isLoading = true;
    if (this.user) {
      const userDocRef = doc(this.firestore, 'userDetails', this.user.uid);

      try {
        await this.ngZone.run(async () => {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<UserProfile>;
            console.log('User data:', data);
            this.userProfile = {
              fullName: data.fullName || '',
              email: data.email || '',
              mobileNumber: data.mobileNumber || '',
              photoURL: data.photoURL || '',
              newPassword: '', // Reset newPassword
              confirmPassword: '', // Reset confirmPassword
            };
            console.log('User profile loaded:', this.userProfile);
          } else {
            console.log('User document does not exist in Firestore');
          }
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log('No user signed in');
    }
  }

  async updateProfile(updatedData: Partial<UserProfile>) {
    const user = this.auth.currentUser;
    if (user) {
      const db = getFirestore();
      const userDocRef = doc(db, 'userDetails', user.uid);

      const loading = await this.loadingCtrl.create({
        message: 'Updating your profile...',
      });
      await loading.present();

      try {
        await updateDoc(userDocRef, updatedData);
        const successAlert = await this.alertCtrl.create({
          header: 'Profile Updated',
          message: 'Your profile has been successfully updated.',
          buttons: ['OK'],
        });
        await successAlert.present();
      } catch (error) {
        console.error('Error updating profile:', error);
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Failed to update profile. Please try again.',
          buttons: ['OK'],
        });
        await errorAlert.present();
      } finally {
        await loading.dismiss();
      }
    }
  }

  // Add method to handle password change
  async changePassword() {
    const user = this.auth.currentUser;
    if (!user) {
      const alert = await this.alertCtrl.create({
        header: 'No user signed in',
        message: 'Please log in to change your password.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (this.userProfile.newPassword !== this.userProfile.confirmPassword) {
      const alert = await this.alertCtrl.create({
        header: 'Password Mismatch',
        message: 'The new password and confirm password do not match.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Changing your password...',
    });
    await loading.present();

    try {
      await updatePassword(user, this.userProfile.newPassword);
      const successAlert = await this.alertCtrl.create({
        header: 'Password Changed',
        message: 'Your password has been successfully changed.',
        buttons: ['OK'],
      });
      await successAlert.present();
      // Optionally log out the user to force them to log in with the new password
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorAlert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Failed to change password. Please try again.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    } finally {
      await loading.dismiss();
    }
  }
}
