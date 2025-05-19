import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveRidesComponent } from './active-rides.component';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActiveRidesRoutingModule } from './active-rides-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActiveRidesRoutingModule,
    ActiveRidesComponent
  ]
})
export class ActiveRidesModule {}
