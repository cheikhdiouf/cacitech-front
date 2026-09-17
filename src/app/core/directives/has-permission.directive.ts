import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { CurrentUserPermissionsService } from '../services/current-user-permissions.service';

/** `*appHasPermission="'add_organe'"` — affiche l'élément uniquement si l'utilisateur connecté
 * possède ce codename Django. Accepte aussi un tableau : visible si l'utilisateur a AU MOINS
 * une des permissions listées (`*appHasPermission="['add_organe', 'change_organe']"`). */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly permissions = inject(CurrentUserPermissionsService);

  private codenames: string[] = [];
  private hasView = false;

  @Input({ required: true })
  set appHasPermission(value: string | string[]) {
    this.codenames = Array.isArray(value) ? value : [value];
  }

  constructor() {
    effect(() => {
      const allowed = this.codenames.some((codename) => this.permissions.has(codename));

      if (allowed && !this.hasView) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.viewContainerRef.clear();
        this.hasView = false;
      }
    });
  }
}
