import type { Disposer } from '~/misc/disposer';

export enum Severity {
  Error = 'error',
  Warning = 'warn',
  Info = 'info',
  Success = 'success',
}

export type NotificationOptions = {
  severity?: Severity;
  title?: string;
  description?: string;
  icon?: string;
  datum?: any;
  closable?: boolean;
  timeout?: number;
  countdown?: boolean;
  group?: string;
};

export type NotificationDescriptor = {
  opts: NotificationOptions;
  id: string;
};

export interface NotificationHandle {
  desc: NotificationDescriptor;
  hide: () => boolean;
}

export type NotificationHideCallback = (descId: string, timeouted: boolean) => void;

export interface NotificationsImpl {
  show: (n: NotificationDescriptor) => NotificationHandle;
  clear: (group?: string) => void;

  onNotificationHide: (fn: NotificationHideCallback) => Disposer;
}
