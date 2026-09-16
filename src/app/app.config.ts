import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideFrenchPaginatorIntl } from './core/utils/french-paginator-intl';
import { provideMaterialSymbolsIcons } from './core/utils/material-symbols-icon-initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: MatPaginatorIntl, useFactory: provideFrenchPaginatorIntl },
    provideMaterialSymbolsIcons()
  ]
};
