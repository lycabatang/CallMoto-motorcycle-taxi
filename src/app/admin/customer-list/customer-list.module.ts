import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CustomerLists } from './customer-list';
import { CustomerListsRouting } from './customer-list-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomerListsRouting,
    CustomerLists
  ]
})
export class CustomerListsModule {}
