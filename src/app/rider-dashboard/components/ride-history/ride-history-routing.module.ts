import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RideHistoryComponent } from './ride-history.component';

const routes: Routes = [
  {
    path: '',
    component: RideHistoryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RideHistoryRoutingModule {}
