import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, User } from '@angular/fire/auth';
import { ToastController } from '@ionic/angular';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  passwordType: string = 'password';
  loginErrorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: Auth,
    private toastController: ToastController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  togglePassword() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      try {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        console.log('User logged in:', user);

        const userType = await this.getUserType(user);
        console.log('User type:', userType);

        this.redirectUser(userType);

      } catch (error: any) {
        console.error('Login error:', error);
        // Ensure that error code is correctly passed and logged
        this.loginErrorMessage = this.getErrorMessage(error.code);
        console.log('Error message to display:', this.loginErrorMessage);
        await this.showToast(this.loginErrorMessage);
      }
    }
  }

  private async getUserType(user: User): Promise<string> {
    const db = getFirestore();
    const userDocRef = doc(db, 'userDetails', user.uid);

    try {
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log('User data retrieved from Firestore:', userData);
        return userData?.['userType'] || 'customer';
      } else {
        console.error('User document does not exist');
        return 'guest';
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return 'guest';
    }
  }

  private redirectUser(userType: string) {
    if (userType === 'customer') {
      this.router.navigate(['/home']);
    } else if (userType === 'rider') {
      this.router.navigate(['/rider-dashboard']);
    } else if (userType === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.showToast('Unable to determine user role.');
      this.router.navigate(['/home']);
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'Wrong email address';
      case 'auth/wrong-password':
        return 'Wrong password';
      case 'auth/invalid-email':
        return 'Invalid email address format';
      default:
        return 'An error occurred during login';
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: 'Invalid credentials. Please try again.',
      duration: 2000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}
