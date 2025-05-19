import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-rider-dashboard',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
  templateUrl: './rider-dashboard.component.html',
  styleUrls: ['./rider-dashboard.component.scss']
})
export class RiderDashboardComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
