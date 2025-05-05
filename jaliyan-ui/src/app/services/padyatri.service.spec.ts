import { TestBed } from '@angular/core/testing';

import { PadyatriService } from './padyatri.service';

describe('PadyatriService', () => {
  let service: PadyatriService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PadyatriService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
