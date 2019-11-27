import { TestBed, inject } from '@angular/core/testing';

import { DataConnectorService } from './data-connector.service';

describe('DataConnectorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataConnectorService]
    });
  });

  it('should be created', inject([DataConnectorService], (service: DataConnectorService) => {
    expect(service).toBeTruthy();
  }));
});
