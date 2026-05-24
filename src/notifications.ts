// Notification manager — manages toast notifications beyond achievements
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'powerup' | 'commentary';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  duration: number;
  timer: number;
  visible: boolean;
  priority: number;
}

const MAX_VISIBLE = 3;
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  achievement: '🏆',
  powerup: '⚡',
  commentary: '🎙️',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  info: '#004466',
  success: '#004422',
  warning: '#444400',
  error: '#440000',
  achievement: '#442200',
  powerup: '#440044',
  commentary: '#222244',
};

export class NotificationManager {
  private queue: Notification[] = [];
  private active: Notification[] = [];
  private nextId = 0;
  private onShow: ((notification: Notification) => void) | null = null;
  private onHide: ((id: string) => void) | null = null;

  constructor() {}

  setCallbacks(
    onShow: (notification: Notification) => void,
    onHide: (id: string) => void,
  ): void {
    this.onShow = onShow;
    this.onHide = onHide;
  }

  notify(
    type: NotificationType,
    title: string,
    message: string = '',
    duration: number = 3,
    priority: number = 0,
  ): string {
    const id = `notif-${++this.nextId}`;
    const icon = NOTIFICATION_ICONS[type];

    const notification: Notification = {
      id,
      type,
      title,
      message,
      icon,
      duration,
      timer: 0,
      visible: false,
      priority,
    };

    // Insert by priority
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (priority > this.queue[i].priority) {
        this.queue.splice(i, 0, notification);
        inserted = true;
        break;
      }
    }
    if (!inserted) this.queue.push(notification);

    this.processQueue();
    return id;
  }

  private processQueue(): void {
    while (this.active.length < MAX_VISIBLE && this.queue.length > 0) {
      const notification = this.queue.shift()!;
      notification.visible = true;
      this.active.push(notification);
      this.onShow?.(notification);
    }
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const notif = this.active[i];
      notif.timer += dt;
      if (notif.timer >= notif.duration) {
        notif.visible = false;
        this.active.splice(i, 1);
        this.onHide?.(notif.id);
      }
    }
    this.processQueue();
  }

  dismiss(id: string): void {
    const idx = this.active.findIndex(n => n.id === id);
    if (idx >= 0) {
      this.active[idx].visible = false;
      this.active.splice(idx, 1);
      this.onHide?.(id);
    }
    this.processQueue();
  }

  dismissAll(): void {
    for (const notif of this.active) {
      notif.visible = false;
      this.onHide?.(notif.id);
    }
    this.active = [];
    this.queue = [];
  }

  getActive(): Notification[] {
    return [...this.active];
  }

  getColor(type: NotificationType): string {
    return NOTIFICATION_COLORS[type];
  }

  getActiveCount(): number {
    return this.active.length;
  }

  getQueueCount(): number {
    return this.queue.length;
  }
}
