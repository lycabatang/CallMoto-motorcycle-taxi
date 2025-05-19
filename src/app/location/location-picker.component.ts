import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

// Interface for location data
export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  @Input() initialLocation!: LocationData;
  @Output() locationSelected = new EventEmitter<LocationData>();

  map: L.Map | undefined;
  marker: L.Marker | undefined;
  searchAddress = '';
  loading = true;

  // Define Tuguegarao bounds (latitude/longitude corners)
  private tuguegaraoBounds = L.latLngBounds(
    L.latLng(17.5983, 121.7044),  // Southwest corner
    L.latLng(17.6394, 121.7613)   // Northeast corner
  );

  constructor(private modalCtrl: ModalController, private platform: Platform) {}

  async ngOnInit() {
    await this.platform.ready();
    this.loadMap();
  }

  async loadMap() {
    const defaultCoords = this.initialLocation || { latitude: 17.6131, longitude: 121.7269, address: '' }; // Tuguegarao default
    const latLng = L.latLng(defaultCoords.latitude, defaultCoords.longitude);

    this.map = L.map(this.mapElement.nativeElement).setView(latLng, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker(latLng, { draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const pos = this.marker?.getLatLng();
      if (pos) this.getAddressFromCoords(pos.lat, pos.lng);
    });

    this.getAddressFromCoords(latLng.lat, latLng.lng);
    this.loading = false;

    // Restrict panning and zooming to within the bounds of Tuguegarao
    this.map.setMaxBounds(this.tuguegaraoBounds);
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLatLng = e.latlng;

      // Prevent selecting locations outside of Tuguegarao City
      if (!this.tuguegaraoBounds.contains(clickedLatLng)) {
        alert('Please select a location within Tuguegarao City.');
        return;
      }

      this.marker?.setLatLng(clickedLatLng);
      this.getAddressFromCoords(clickedLatLng.lat, clickedLatLng.lng);
    });
  }

  async getAddressFromCoords(lat: number, lng: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();

      const address = data.display_name || 'Unknown location';
      this.searchAddress = address;

      this.locationSelected.emit({ address, latitude: lat, longitude: lng });
    } catch (err) {
      console.error('Error fetching address:', err);
    }
  }

  async searchLocation() {
    if (!this.searchAddress.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.searchAddress)}&format=json&limit=1`
      );
      const results = await response.json();

      if (results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        const latLng = L.latLng(lat, lon);

        // Check if the result is within Tuguegarao City bounds before setting the map view
        if (!this.tuguegaraoBounds.contains(latLng)) {
          alert('Search result is outside Tuguegarao City.');
          return;
        }

        this.map?.setView(latLng, 17);
        this.marker?.setLatLng(latLng);

        this.locationSelected.emit({ address: result.display_name, latitude: lat, longitude: lon });
        this.searchAddress = result.display_name;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  }

  confirmLocation() {
    if (!this.marker) return;
    const pos = this.marker.getLatLng();
    this.modalCtrl.dismiss({
      address: this.searchAddress,
      latitude: pos.lat,
      longitude: pos.lng,
    });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
