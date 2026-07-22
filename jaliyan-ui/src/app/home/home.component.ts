import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface JourneyDay {
  day: number;
  title: string;   // Gujarati day label
  place: string;   // location / halt
  note: string;    // short devotional note
}

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  currentYear = new Date().getFullYear();
  channelUrl = 'https://www.youtube.com/@ShreeJalaramPadyatra';

  /**
   * ▶️ FULLY DYNAMIC video player.
   * Paste your channel's UPLOADS playlist id below (starts with "UU") — then EVERY video
   * you upload appears here automatically, with NO code change ever again.
   *
   * How to find it: open your channel, copy the channel id (starts with "UC..."),
   * then change the "UC" prefix to "UU" → that is your uploads playlist id.
   * You can also use any normal playlist id (starts with "PL...").
   */
  youtubePlaylistId = ''; // e.g. 'UUxxxxxxxxxxxxxxxxxxxxxx'  (leave empty to show the single fallback video)
  private fallbackVideoId = 'eLOuHnONEao';

  playerUrl!: SafeResourceUrl;

  private revealEls: HTMLElement[] = [];
  private onScroll = () => this.checkReveal();

  /** ✨ Welcome / about bullet points */
  aboutPoints: string[] = [
    'સુદામાપુરી થી વિરપુરધામ ૧૨૬ કિમીની પવિત્ર યાત્રા',
    'નિઃશુલ્ક મહાપ્રસાદ અને અન્નદાનની સેવા',
    'ભજન, પ્રાર્થના અને સત્સંગનો દિવ્ય અનુભવ',
  ];

  /**
   * 🚶 Day-by-day journey (Porbandar → Virpur).
   * Update the halt names/notes below with the real stops when confirmed.
   */
  journey: JourneyDay[] = [
    { day: 1, title: 'પ્રસ્થાન',      place: 'પોરબંદર · સુદામાપુરી', note: 'ધ્વજ વંદન સાથે પવિત્ર યાત્રાનો શુભારંભ' },
    { day: 2, title: 'દ્વિતીય દિવસ',  place: 'પ્રથમ પડાવ',           note: 'ભજન, પ્રાર્થના અને વિશ્રામ' },
    { day: 3, title: 'તૃતીય દિવસ',   place: 'દ્વિતીય પડાવ',         note: 'સેવા, અન્નદાન અને સત્સંગ' },
    { day: 4, title: 'વિરામ',         place: 'વિરપુરધામ',            note: 'બાપાના ધામે દર્શન અને આરતી' },
  ];

  /** ❔ Padyatri guidelines shown as an accordion */
  faqs: FaqItem[] = [
    { q: 'નોંધણી કેવી રીતે કરવી?', a: 'પદયાત્રા ટીમનો સંપર્ક કરો અથવા સોશિયલ મીડિયા પર અમને અનુસરો. ટીમના સભ્યો ટીમ લોગિન દ્વારા નોંધણી કરી શકે છે.' },
    { q: 'સાથે શું લાવવું?', a: 'ઓળખકાર્ડ, પૂરતું પાણી, જરૂરી દવાઓ, આરામદાયક પગરખાં અને હળવો સામાન સાથે રાખો.' },
    { q: 'ભોજનની વ્યવસ્થા છે?', a: 'હા — સમગ્ર યાત્રા દરમિયાન નિઃશુલ્ક મહાપ્રસાદ અને અન્નદાનની વ્યવસ્થા હોય છે. દૈનિક મેનૂ “ભોજન માહિતી” માં જુઓ.' },
    { q: 'સ્વાસ્થ્ય અને સલામતી?', a: 'માર્ગ પર પ્રાથમિક સારવાર અને સ્વયંસેવકોની ટીમ ઉપલબ્ધ રહે છે. વૃદ્ધો અને બાળકો ખાસ કાળજી રાખે.' },
    { q: 'યાત્રા કેટલી લાંબી છે?', a: 'પોરબંદરથી વિરપુર સુધી ૪ દિવસમાં આશરે ૧૨૬ કિમીની પદયાત્રા છે.' },
  ];

  constructor(private sanitizer: DomSanitizer, private host: ElementRef<HTMLElement>) {}

  ngOnInit() {
    const src = this.youtubePlaylistId
      ? `https://www.youtube.com/embed/videoseries?list=${this.youtubePlaylistId}&rel=0`
      : `https://www.youtube.com/embed/${this.fallbackVideoId}?rel=0`;
    this.playerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
  }

  /**
   * Robust scroll-reveal. Uses capture-phase scroll listening so it fires no matter
   * which nested container actually scrolls, and getBoundingClientRect (viewport-relative)
   * so the maths is always correct.
   */
  ngAfterViewInit() {
    this.revealEls = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal'));
    // capture=true catches scroll events from any descendant scroll container
    window.addEventListener('scroll', this.onScroll, true);
    window.addEventListener('resize', this.onScroll, { passive: true });
    // initial pass (next frame so layout is settled)
    requestAnimationFrame(() => this.checkReveal());
    // safety: never leave content permanently hidden
    setTimeout(() => this.checkReveal(), 1200);
  }

  private checkReveal() {
    if (!this.revealEls.length) return;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = this.revealEls.length - 1; i >= 0; i--) {
      const el = this.revealEls[i];
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.9 && rect.bottom > 0) {
        el.classList.add('is-visible');
        this.revealEls.splice(i, 1);
      }
    }
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.onScroll);
  }
}
