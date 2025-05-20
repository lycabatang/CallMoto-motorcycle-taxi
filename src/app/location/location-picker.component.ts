import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

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
export class LocationPickerComponent implements OnInit, AfterViewInit {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;
  @Input() initialLocation!: LocationData;
  @Output() locationSelected = new EventEmitter<LocationData>();

  map!: L.Map;
  marker!: L.Marker;
  searchAddress = '';
  loading = true;

  private tuguegaraoBounds = L.latLngBounds(
    L.latLng(17.55, 121.67),  // Southwest corner (~1km south-west of city)
    L.latLng(17.68, 121.80)   // Northeast corner (~1km north-east of city)
  );

  constructor(private modalCtrl: ModalController, private platform: Platform) {}

  ngOnInit() {}

  async ngAfterViewInit() {
    await this.platform.ready();

    this.getUserLocation().then(coords => {
      this.loadMap(coords);
    }).catch(() => {
      const fallback = this.initialLocation || { latitude: 17.6131, longitude: 121.7269, address: '' };
      this.loadMap({ lat: fallback.latitude, lng: fallback.longitude });
    });
  }

  private getUserLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject('User denied location'),
        { timeout: 5000 }
      );
    });
  }

  private loadMap(center: { lat: number; lng: number }) {
    if (!this.mapElement) {
      console.error('Map container not found');
      return;
    }

    this.map = L.map(this.mapElement.nativeElement, {
      center,
      zoom: 15,
      maxBounds: this.tuguegaraoBounds,
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker(center, { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      if (pos) {
        this.map.setView(pos);
        this.getAddressFromCoords(pos.lat, pos.lng);
      }
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.tuguegaraoBounds.contains(e.latlng)) {
        alert('Please select a location within Tuguegarao City.');
        return;
      }

      this.marker.setLatLng(e.latlng);
      this.map.setView(e.latlng);
      this.getAddressFromCoords(e.latlng.lat, e.latlng.lng);
    });

    this.getAddressFromCoords(center.lat, center.lng);

    setTimeout(() => this.map.invalidateSize(), 300);

    this.loading = false;
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
    if (!this.searchAddress.trim()) {
      alert('Please enter a search term.');
      return;
    }

    try {
      // viewbox order: left, top, right, bottom (lon1, lat1, lon2, lat2)
      // Tuguegarao bounds approx
      const viewbox = [
        121.67, // left (min longitude)
        17.68,  // top (max latitude)
        121.80, // right (max longitude)
        17.55,  // bottom (min latitude)
      ].join(',');
      

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.searchAddress)}&format=json&limit=5&viewbox=${viewbox}&bounded=1`
      );
      const results = await response.json();

      if (results.length === 0) {
        alert('No results found within Tuguegarao City.');
        return;
      }

      const result = results[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const latLng = L.latLng(lat, lon);

      // Final check to make sure result is inside bounds
      if (!this.tuguegaraoBounds.contains(latLng)) {
        alert('Search result is outside Tuguegarao City.');
        return;
      }

      this.map.setView(latLng, 17);
      this.marker.setLatLng(latLng);

      this.locationSelected.emit({ address: result.display_name, latitude: lat, longitude: lon });
      this.searchAddress = result.display_name;
    } catch (err) {
      console.error('Geocoding error:', err);
      alert('Error searching location.');
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
