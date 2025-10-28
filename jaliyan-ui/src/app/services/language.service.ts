import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('en');
  currentLang$ = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {
    // Add supported languages
    translate.addLangs(['en', 'gu']);
    translate.setDefaultLang('en');

    // Get saved language or default
    const savedLang = localStorage.getItem('lang');
    const lang = savedLang && translate.getLangs().includes(savedLang) ? savedLang : 'en';
    this.setLanguage(lang);
  }

  getCurrentLanguage(): string {
    return this.currentLangSubject.value;
  }

  setLanguage(lang: string): void {
    if (!this.translate.getLangs().includes(lang)) {
      console.warn(`Language ${lang} is not supported. Falling back to default.`);
      lang = this.translate.getDefaultLang();
    }

    localStorage.setItem('lang', lang);
    this.translate.use(lang);
    this.currentLangSubject.next(lang);
  }
}
