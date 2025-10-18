import { TestBed } from '@angular/core/testing';

import { MenuplannerService } from './menuplanner.service';

describe('MenuplannerService', () => {
  let service: MenuplannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuplannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
