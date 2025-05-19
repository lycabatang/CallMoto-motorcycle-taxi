import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RideHistoryRoutingModule } from './ride-history-routing.module';
import { RideHistoryComponent } from './ride-history.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RideHistoryRoutingModule,
    RideHistoryComponent
  ]
})
export class RideHistoryModule {}
