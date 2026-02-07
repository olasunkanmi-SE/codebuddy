export interface IProgress<T> {
  report(value: T): void;
}
