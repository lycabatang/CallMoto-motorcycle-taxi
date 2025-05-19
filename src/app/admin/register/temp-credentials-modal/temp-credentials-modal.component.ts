import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-temp-credentials-modal',
  templateUrl: './temp-credentials-modal.component.html',
  styleUrls: ['./temp-credentials-modal.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class TempCredentialsModalComponent {
  @Input() email!: string;
  @Input() tempPassword!: string;

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }

  async copyToClipboard() {
    const text = `Email: ${this.email}\nTemporary Password: ${this.tempPassword}`;
    await navigator.clipboard.writeText(text);
  }
}
