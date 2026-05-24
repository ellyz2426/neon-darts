// Object pool — reusable object pool for particle-like systems
export class ObjectPool<T> {
  private pool: T[] = [];
  private active: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    let obj: T;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else if (this.active.length + this.pool.length < this.maxSize) {
      obj = this.factory();
    } else {
      // Recycle oldest active
      obj = this.active.shift()!;
    }
    this.reset(obj);
    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    const idx = this.active.indexOf(obj);
    if (idx >= 0) {
      this.active.splice(idx, 1);
      this.pool.push(obj);
    }
  }

  releaseAll(): void {
    while (this.active.length > 0) {
      this.pool.push(this.active.pop()!);
    }
  }

  getActive(): T[] {
    return this.active;
  }

  getActiveCount(): number {
    return this.active.length;
  }

  getPoolCount(): number {
    return this.pool.length;
  }

  getTotalCount(): number {
    return this.active.length + this.pool.length;
  }
}
