import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { LoadingController, ToastController } from '@ionic/angular';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: false,
})
export class SignupPage implements OnInit {
  signupForm: FormGroup;
  isSubmitting = false;
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';
  countryCode: string = '63';
  mobileNumber: string = ''; // This will hold only the 10-digit number

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: Auth,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.signupForm = this.formBuilder.group({
      userType: ['customer', Validators.required],
      firstName: ['', Validators.required],
      middleName: ['', Validators.required],
      lastName: ['', Validators.required],
      suffix: [''],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      address: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {}

  togglePassword() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPassword() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  onMobileInput(event: any) {
    const input = event.detail.value || '';
    const numericOnly = input.replace(/\D/g, ''); // Remove non-numeric chars

    // Ensure it doesn't contain the country code manually entered
    const raw = numericOnly.startsWith(this.countryCode)
      ? numericOnly.slice(this.countryCode.length)
      : numericOnly;

    // Keep only the first 10 digits (Philippine format)
    this.mobileNumber = raw.slice(0, 10);

    // Update the form control with the clean number
    this.signupForm.get('mobileNumber')?.setValue(this.mobileNumber);
  }

  validateKeyPress(event: KeyboardEvent) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }



  async onSubmit() {
    if (!this.signupForm.valid) {
      const toast = await this.toastCtrl.create({
        message: 'Please fill in all required fields correctly.',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    if (this.signupForm.value.password !== this.signupForm.value.confirmPassword) {
      const toast = await this.toastCtrl.create({
        message: 'Passwords did not match',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    const formData = this.signupForm.value;
    formData.mobileNumber = this.formatMobileNumber(formData.mobileNumber);

    const loading = await this.loadingCtrl.create({
      message: 'Creating your account...',
    });
    await loading.present();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        formData.email,
        formData.password
      );

      const userData = {
        userId: userCredential.user.uid,
        fullName: this.generateFullName(
          formData.firstName,
          formData.middleName,
          formData.lastName,
          formData.suffix
        ),
        email: formData.email.toLowerCase(),
        mobileNumber: formData.mobileNumber,
        address: formData.address,
        userType: formData.userType,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profileComplete: true,
        emailVerified: false,
        accountSettings: {
          notifications: true,
          emailUpdates: true,
        },
      };

      await setDoc(doc(this.firestore, 'userDetails', userCredential.user.uid), userData);
      await loading.dismiss();

      const successToast = await this.toastCtrl.create({
        message: 'Account created successfully!',
        duration: 2000,
        color: 'success',
      });
      await successToast.present();
      this.router.navigate(['/login'], { replaceUrl: true });

    } catch (error: unknown) {
      await loading.dismiss();
      const errorMessage = this.getFirebaseErrorMessage(error as FirebaseError);
      const toast = await this.toastCtrl.create({
        message: errorMessage,
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }

  private formatMobileNumber(mobileNumber: string): string {
    return '+63' + mobileNumber;
  }

  private generateFullName(firstName: string, middleName: string, lastName: string, suffix?: string): string {
    const parts = [firstName.trim(), middleName.trim(), lastName.trim()];
    if (suffix && suffix.trim()) {
      parts.push(suffix.trim());
    }
    return parts.join(' ');
  }


  private getFirebaseErrorMessage(error: FirebaseError): string {
    switch (error.code) {
      case 'permission-denied':
        return 'Permission denied. Please try again or contact support.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
}
