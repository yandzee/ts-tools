import { isRecord, isString } from '~/misc/types';
import {
  type NotificationDescriptor,
  type NotificationHandle,
  type NotificationsImpl,
  type NotificationOptions,
  Severity,
} from '~/ui/notifications';

export class Notifications {
  private readonly backends: Map<string, NotificationsImpl> = new Map();
  private descriptorCounters: Map<string, number> = new Map();

  public readonly descriptors: Map<string, NotificationDescriptor> = new Map();

  public registerBackend(kind: string, impl: NotificationsImpl): boolean {
    const isReplaced = this.backends.has(kind);

    this.backends.set(kind, impl);

    impl.onNotificationHide((descId, timeouted) => {
      console.log(`NotificationsUI: notification hide`, descId, timeouted);
      const counter = Math.max(
        0,
        (this.descriptorCounters.get(descId) || 0) - 1
      );

      if (counter === 0) {
        this.descriptors.delete(descId);
        this.descriptorCounters.delete(descId);
      } else {
        this.descriptorCounters.set(descId, counter);
      }
    });

    return isReplaced;
  }

  public dropBackend(kind: string): boolean {
    return this.backends.delete(kind);
  }

  public showError(datum: any, opts?: NotificationOptions): NotificationHandle {
    const baseOpts = {
      severity: Severity.Error,
      datum,
      title: 'Error',
      closable: true,
      timeout: 0,
    };

    Object.assign(baseOpts, opts || {});
    return this.show(baseOpts);
  }

  public show(n: NotificationOptions): NotificationHandle {
    const desc: NotificationDescriptor = {
      opts: n,
      id: this.generateNotificationId(),
    };

    this.descriptors.set(desc.id, desc);
    this.descriptorCounters.set(desc.id, 1);

    const handles: NotificationHandle[] = [];

    this.backends.forEach((impl) => {
      handles.push(impl.show(desc));
    });

    return {
      desc,
      hide: (): boolean => {
        return handles.some((h) => h.hide());
      },
    };
  }

  public getDescriptor(msg: any): NotificationDescriptor | null {
    if (msg == null || !isRecord(msg)) return null;

    const chelnokId =
      msg.chelnokId || msg.detail?.chelnokId || (msg.opts != null && msg.id);

    if (!!chelnokId && isString(chelnokId)) {
      return this.descriptors.get(chelnokId) ?? null;
    }

    return null;
  }

  private generateNotificationId() {
    return Math.random().toString(36).slice(2);
  }
}
