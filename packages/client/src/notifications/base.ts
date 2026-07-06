import type {
  BackendNotificationHandle,
  NotificationDescriptor,
  NotificationHandle,
  NotificationOptions,
  NotificationsBackend,
} from './index';

export class Notifications {
  private readonly backends: Map<string, NotificationsBackend> = new Map();

  public readonly descriptors: Map<string, NotificationDescriptor> = new Map();

  public registerBackend(kind: string, impl: NotificationsBackend): boolean {
    const isReplaced = this.backends.has(kind);
    this.backends.set(kind, impl);

    return isReplaced;
  }

  public dropBackend(kind: string): boolean {
    return this.backends.delete(kind);
  }

  public show(opts: NotificationOptions): NotificationHandle {
    const descriptor: NotificationDescriptor = {
      opts,
      id: this.generateNotificationId(),
    };

    this.descriptors.set(descriptor.id, descriptor);
    const handles: BackendNotificationHandle[] = [];

    this.backends.forEach((impl) => {
      handles.push(impl.show(opts));
    });

    return {
      descriptor: () => descriptor,
      hide: (): boolean => {
        return handles.reduce((hidden, h) => hidden || h.hide(), false);
      },
    };
  }

  private generateNotificationId() {
    return Math.random().toString(36).slice(2);
  }
}
