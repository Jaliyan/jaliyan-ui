import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
interface JourneyStep {
  day: number;
  from: string;
  to: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: false,
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router,
    private auth: AuthService, private sanitizer: DomSanitizer) { }

  currentYear = new Date().getFullYear();
  videoId = 'bkYqvNDJY90'; // 🔹 Replace with your YouTube video ID
  safeUrl!: SafeResourceUrl;
  videoLoaded = false;

  journeyTimeline: JourneyStep[] = [
    { day: 1, from: 'Porbandar', to: 'Stop 1' },
    { day: 2, from: 'Stop 1', to: 'Stop 2' },
    { day: 3, from: 'Stop 2', to: 'Stop 3' },
    { day: 4, from: 'Stop 3', to: 'Virpur' }
  ];

  ngOnInit() {

  }

  get thumbnailUrl() {
    return `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
  }

  loadVideo() {
    const url = `https://www.youtube.com/embed/${this.videoId}?autoplay=1&rel=0`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.videoLoaded = true;
  }

}
