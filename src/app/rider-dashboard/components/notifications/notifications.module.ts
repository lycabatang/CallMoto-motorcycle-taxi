import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NotificationsRouting } from './notifications.routing.module';
import { NotificationsComponent } from './notifications.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificationsRouting,
    NotificationsComponent
  ]
})
export class NotificationsModule {}
