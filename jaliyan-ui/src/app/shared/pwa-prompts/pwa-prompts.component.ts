import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-pwa-prompts',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './pwa-prompts.component.html',
  styleUrl: './pwa-prompts.component.css'
})
export class PwaPromptsComponent implements OnInit, OnDestroy {
  showInstallPopup = false;
  updateAvailable = false;
  offline = false;

  private subs = new Subscription();

  constructor(public pwa: PwaService) {}

  ngOnInit(): void {
    this.subs.add(
      this.pwa.installable$.subscribe((installable) => {
        this.showInstallPopup = installable && this.pwa.shouldShowAutoPopup();
      })
    );
    this.subs.add(
      this.pwa.updateAvailable$.subscribe((v) => (this.updateAvailable = v))
    );
    this.subs.add(
      this.pwa.online$.subscribe((online) => (this.offline = !online))
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async install(): Promise<void> {
    this.showInstallPopup = false;
    await this.pwa.promptInstall();
  }

  dismiss(): void {
    this.showInstallPopup = false;
    this.pwa.rememberDismissal();
  }

  reload(): void {
    this.pwa.applyUpdateAndReload();
  }
}
