import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerLists } from './customer-list';

const routes: Routes = [
  {
    path: '',
    component: CustomerLists
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerListsRouting {}
