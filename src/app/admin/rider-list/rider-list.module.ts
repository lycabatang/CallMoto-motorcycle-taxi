import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RiderListsRouting } from './rider-list.routing.module';
import { RiderLists } from './rider-list';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RiderListsRouting,
    RiderLists
  ]
})
export class RiderListsModule {}
