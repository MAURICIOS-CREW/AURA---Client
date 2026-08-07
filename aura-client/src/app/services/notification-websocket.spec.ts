import { TestBed } from '@angular/core/testing';
import { NotificationWebsocket } from './notification-websocket';

describe('NotificationWebsocket', () => {
  let service: NotificationWebsocket;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationWebsocket);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
