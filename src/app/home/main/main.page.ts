import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MainPage implements OnInit {
  motorcycles: any[] = [];

  constructor() { }

  ngOnInit() {
    // Initialize motorcycles data
  }
}
