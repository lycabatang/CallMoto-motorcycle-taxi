import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RiderLists } from './rider-list';

const routes: Routes = [
  {
    path: '',
    component: RiderLists
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RiderListsRouting {}
