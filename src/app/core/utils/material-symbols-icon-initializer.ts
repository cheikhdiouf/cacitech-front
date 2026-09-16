import { Provider } from '@angular/core';
import { APP_INITIALIZER } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';

/** Bascule tous les <mat-icon>nom</mat-icon> existants sur Material Symbols (police chargée
 * dans index.html) sans avoir à toucher un seul template — même noms d'icônes que Material
 * Icons, juste un dessin plus moderne. */
export function provideMaterialSymbolsIcons(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [MatIconRegistry],
    useFactory: (iconRegistry: MatIconRegistry) => () => iconRegistry.setDefaultFontSetClass('material-symbols-outlined')
  };
}
