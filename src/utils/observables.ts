import { WithDisposables } from './disposables';

export interface IObserver<T extends object> {
	// Receive update from observable.
	update(observable: IObservable<T>): void;
}

export interface IObservable<T extends object> {
  // Attach an observer to the subject.
  attach(observer: IObserver<T>): void;

  // Detach an observer from the subject.
  detach(observer: IObserver<T>): void;

  // Notify all observers about an event.
  notify(): void;

  getState() : T;
}


export abstract class Observer<T extends {}>  extends WithDisposables  implements IObserver<T> {
  protected state: T;

  constructor(private observable: IObservable<T>) {
    super();

    // attach itslef to the observer
    observable.attach(this);

    // save the current state of the observer
    this.state = observable.getState();
  }

  update(): void {
    this.onStateChange(this.observable.getState());
  }

  protected onStateChange(newState: T) {
    this.state = newState;
  }
}


export abstract class Observable<T extends object> implements IObservable<T>{

  private observers: Array<Observer<T>> = [];

  attach(observer: Observer<T>) {
      if (!this.observers.includes(observer)) {
          this.observers.push(observer);
      }
  }

  detach(observer: Observer<T>){
      const observerIndex = this.observers.indexOf(observer);
      if (observerIndex !== -1) {
          this.observers.splice(observerIndex, 1);
      }
  }

  notify() {
      this.observers.forEach(o => o.update());
  }

  abstract getState(): T;
}