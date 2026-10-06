import { Injectable, NgZone, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

/** The browser's beforeinstallprompt event (not yet in the TS DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
/** How long to respect a dismissal before offering the popup again (14 days). */
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** True when the browser has fired beforeinstallprompt and the app can be installed. */
  readonly installable$ = new BehaviorSubject<boolean>(false);
  /** True when running as an installed app (standalone display mode). */
  readonly installed$ = new BehaviorSubject<boolean>(false);
  /** True when the browser reports an active network connection. */
  readonly online$ = new BehaviorSubject<boolean>(true);
  /** Emits when a new app version has been downloaded and is ready to activate. */
  readonly updateAvailable$ = new BehaviorSubject<boolean>(false);

  constructor(private zone: NgZone, private swUpdate: SwUpdate) {
    this.online$.next(navigator.onLine);
    this.installed$.next(this.isRunningStandalone());
    this.registerListeners();
    this.watchForUpdates();
  }

  private registerListeners(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      // Stop Chrome's default mini-infobar so we can show our own popup.
      event.preventDefault();
      this.zone.run(() => {
        this.deferredPrompt = event as BeforeInstallPromptEvent;
        this.installable$.next(true);
      });
    });

    window.addEventListener('appinstalled', () => {
      this.zone.run(() => {
        this.deferredPrompt = null;
        this.installable$.next(false);
        this.installed$.next(true);
      });
    });

    window.addEventListener('online', () => this.zone.run(() => this.online$.next(true)));
    window.addEventListener('offline', () => this.zone.run(() => this.online$.next(false)));
  }

  private watchForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.zone.run(() => this.updateAvailable$.next(true)));
  }

  /** True if the app is currently launched as an installed PWA. */
  isRunningStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }

  /**
   * Triggers the native install prompt. Returns true if the user accepted.
   * Safe to call only when installable$ is true.
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }
    const prompt = this.deferredPrompt;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    this.deferredPrompt = null;
    this.installable$.next(false);
    return choice.outcome === 'accepted';
  }

  /** Whether the first-visit install popup should be shown right now. */
  shouldShowAutoPopup(): boolean {
    if (this.isRunningStandalone()) {
      return false;
    }
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      return false;
    }
    return true;
  }

  /** Remember that the user dismissed the popup so we don't nag them. */
  rememberDismissal(): void {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  /** Activate a downloaded update and reload the app. */
  applyUpdateAndReload(): void {
    if (isDevMode() || !this.swUpdate.isEnabled) {
      document.location.reload();
      return;
    }
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
