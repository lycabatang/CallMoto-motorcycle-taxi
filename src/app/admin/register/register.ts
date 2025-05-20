import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { ToastController, LoadingController, IonicModule, ModalController } from '@ionic/angular';
import { FirebaseError } from 'firebase/app';
import { TempCredentialsModalComponent } from './temp-credentials-modal/temp-credentials-modal.component';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, TempCredentialsModalComponent],
})
export class Register implements OnInit {
  registerForm: FormGroup;
  userTypes = ['admin', 'rider'];
  countryCode = '63';
  mobileNumber = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {
    this.registerForm = this.fb.group({
      userType: ['rider', Validators.required],
      firstName: ['', Validators.required],
      middleName: ['', Validators.required],
      lastName: ['', Validators.required],
      suffix: [''], // optional
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      address: ['', Validators.required],

      // Rider-specific
      motorcycleModel: [''],
      plateNumber: [''],
      licenseNumber: [''],
      nbiClearance: [''],
    });
  }

  ngOnInit(): void {}

  isRider(): boolean {
    return this.registerForm.get('userType')?.value === 'rider';
  }

  onMobileInput(event: any) {
    const input = event.detail.value || '';
    const numericOnly = input.replace(/\D/g, '');

    const raw = numericOnly.startsWith(this.countryCode)
      ? numericOnly.slice(this.countryCode.length)
      : numericOnly;

    this.mobileNumber = raw.slice(0, 10);
    this.registerForm.get('mobileNumber')?.setValue(this.mobileNumber);
  }

  validateKeyPress(event: KeyboardEvent) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  generateTempPassword(): string {
    return Math.random().toString(36).slice(-10); // 10-char alphanumeric
  }

  async onSubmit() {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      const toast = await this.toastCtrl.create({
        message: 'Please fill in all required fields correctly.',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Registering user...' });
    await loading.present();

    const formData = this.registerForm.value;
    formData.mobileNumber = '+63' + formData.mobileNumber;

    const tempPassword = this.generateTempPassword();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        formData.email,
        tempPassword
      );

      const userData: any = {
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
        lastLoginAt: null,
        emailVerified: false,
        profileComplete: false,
        accountSettings: {
          notifications: true,
          emailUpdates: true,
        },
        motorcycleModel: formData.motorcycleModel,
        plateNumber: formData.plateNumber,
        licenseNumber: formData.licenseNumber,
        nbiClearance: formData.nbiClearance,
        tempPasswordUsed: true,
      };

      await setDoc(doc(this.firestore, 'userDetails', userCredential.user.uid), userData);
      await loading.dismiss();

      const modal = await this.modalCtrl.create({
        component: TempCredentialsModalComponent,
        componentProps: {
          email: formData.email,
          tempPassword: tempPassword,
        },
      });
      await modal.present();
    } catch (error) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: this.getFirebaseErrorMessage(error as FirebaseError),
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }

  private generateFullName(first: string, middle: string, last: string, suffix?: string): string {
    const parts = [first.trim(), middle.trim(), last.trim()];
    if (suffix?.trim()) parts.push(suffix.trim());
    return parts.join(' ');
  }

  private getFirebaseErrorMessage(error: FirebaseError): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      default:
        return error.message || 'An error occurred.';
    }
  }
}
