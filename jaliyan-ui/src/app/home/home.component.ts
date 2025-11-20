import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface JourneyStep {
  day: number;
  from: string;
  to: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {
  currentYear = new Date().getFullYear();
  videoId = 'eLOuHnONEao'; // 🔹 Replace with your YouTube video ID
  safeUrl!: SafeResourceUrl;
  videoLoaded = false;

  journeyTimeline: JourneyStep[] = [
    { day: 1, from: 'Porbandar', to: 'Stop 1' },
    { day: 2, from: 'Stop 1', to: 'Stop 2' },
    { day: 3, from: 'Stop 2', to: 'Stop 3' },
    { day: 4, from: 'Stop 3', to: 'Virpur' }
  ];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Initialize the safe URL in case the video has already been loaded
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${this.videoId}?rel=0`);
  }

  // Get the YouTube thumbnail URL dynamically based on videoId
  get thumbnailUrl() {
    return `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
  }

  // Function to load the video when the play button is clicked
  loadVideo() {
    const url = `https://www.youtube.com/embed/${this.videoId}?autoplay=1&rel=0`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.videoLoaded = true;
  }
}
