import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeNlBe from '@angular/common/locales/nl-BE';
import { registerLocaleData } from '@angular/common';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';
import { unauthorizedInterceptor } from './core/http/unauthorized.interceptor';

registerLocaleData(localeNlBe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([unauthorizedInterceptor, apiInterceptor])),
    { provide: LOCALE_ID, useValue: 'nl-BE' },
  ],
};
