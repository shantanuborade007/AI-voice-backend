import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}

export function getRequestUserId(): string | undefined {
  return requestContextStorage.getStore()?.userId;
}

export function setRequestUserId(userId: string): void {
  const store = requestContextStorage.getStore();
  if (store) {
    store.userId = userId;
  }
}
