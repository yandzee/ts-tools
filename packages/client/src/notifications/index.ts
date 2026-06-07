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

export interface BackendNotificationHandle {
  hide: () => boolean;
}

export interface NotificationHandle extends BackendNotificationHandle {
  descriptor: () => NotificationDescriptor;
}

export type NotificationHideCallback = (descId: string, timeouted: boolean) => void;

export interface NotificationsBackend {
  show: (opts: NotificationOptions) => BackendNotificationHandle;
  clear: (group?: string) => void;
}

export { Notifications } from './base';
