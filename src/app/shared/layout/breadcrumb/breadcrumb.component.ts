import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';

/**
 * Fil d'Ariane dynamique : reconstruit le chemin à partir de `data.breadcrumb`
 * (tableau de libellés) déclaré sur chaque route dans app.routes.ts. "Accueil" est
 * toujours le premier maillon, fixe (voir breadcrumb.component.html pour sa cible).
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css'
})
export class BreadcrumbComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly crumbs = signal<string[]>([]);

  ngOnInit(): void {
    this.updateCrumbs();

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updateCrumbs());
  }

  private updateCrumbs(): void {
    let route = this.activatedRoute.root;
    let breadcrumb: string[] = [];

    while (route.firstChild) {
      route = route.firstChild;
      const data = route.snapshot.data as { breadcrumb?: string[] };
      if (data.breadcrumb) {
        breadcrumb = data.breadcrumb;
      }
    }

    this.crumbs.set(breadcrumb);
  }
}
