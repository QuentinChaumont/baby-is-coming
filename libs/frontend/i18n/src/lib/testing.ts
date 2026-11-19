import { Provider } from '@angular/core';
import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
import { en } from './i18n/en';
import { fr } from './i18n/fr';

/**
 * Drop into a component spec's `providers` so `| transloco` resolves
 * against the real bundled translations. Specs run in English (both
 * bundles loaded) even though the app itself ships French only.
 *
 *   TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [provideTranslocoTesting()],
 *   });
 */
export function provideTranslocoTesting(
  options: TranslocoTestingOptions = {},
): Provider[] {
  return [
    TranslocoTestingModule.forRoot({
      langs: { en, fr },
      translocoConfig: {
        availableLangs: ['en', 'fr'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
      },
      preloadLangs: true,
      ...options,
    }).providers ?? [],
  ];
}
