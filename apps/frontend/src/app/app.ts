import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegalLinks } from '@org/frontend-consent';
import { OfflineBanner } from '@org/frontend-core';
import { VerifyEmailBanner } from '@org/frontend-auth';

@Component({
  imports: [
    RouterModule,
    LegalLinks,
    VerifyEmailBanner,
    OfflineBanner,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'frontend';
}
