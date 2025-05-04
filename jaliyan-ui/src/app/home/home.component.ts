import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: false,
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit,OnDestroy {

  activeIndex = 0; // Index of the active slide
  interval: any; 

  slides = [
    { image: 'assets/images/slide1.jpg', altText: 'Slide 1', title: 'Jalaram Padyatra', description: 'Join the sacred journey' },
    { image: 'assets/images/slide2.jpg', altText: 'Slide 2', title: 'Spiritual Journey', description: 'Experience peace and devotion' },
    { image: 'assets/images/slide1.jpg', altText: 'Slide 3', title: 'Faith and Devotion', description: 'Feel the divine blessings' }
  ];


  ngOnInit() {
    // Optionally start automatic slide transitions
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Automatically change slides every 5 seconds

    console.log("Interval " + this.interval);
  }

  ngOnDestroy() {
    // Clear the interval when the component is destroyed
    console.log("Interval Destroy before" + this.interval);
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log("Interval After" + this.interval);
  }

  nextSlide() {
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
  }


  prevSlide() {
    this.activeIndex = (this.activeIndex - 1 + this.slides.length) % this.slides.length;
  }
}
