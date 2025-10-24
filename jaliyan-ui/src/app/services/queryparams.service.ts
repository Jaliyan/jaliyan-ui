import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QueryParamsService {
  private queryParamsSubject = new BehaviorSubject<{ [key: string]: string | null }>({});
  public queryParams$ = this.queryParamsSubject.asObservable();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.queryParams;
      })
    ).subscribe(params => {
      this.queryParamsSubject.next(params);
    });
  }

  getCurrentQueryParam(key: string): string | null {
    return this.queryParamsSubject.value[key] || null;
  }
}
