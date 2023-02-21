export interface Task {
  (): Generator<Promise<unknown>, void, unknown>;

  isRunning: boolean;
  perform<T>(args?: any[]): Promise<T>;
  cancel(): void;
  cancelAll(): void;
}
