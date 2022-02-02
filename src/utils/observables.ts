import { IDisposable, WithDisposables } from './disposables';

export interface IObserver<T extends object> {
	// Receive update from observable.
	update(...args: any[]): void;
}

export interface IObservable<T extends object> {

  // Attach an observer to the subject.
  attach(observer: IObserver<T>): void;

  // Detach an observer from the subject.
  detach(observer: IObserver<T>): void;

  // Notify all observers about an event.
  notify(...args: any[]): void;

  getState() : T;
}


export abstract class Observer<T extends {}>  extends WithDisposables  implements IObserver<T> {
  protected state: T;

  constructor(protected observable: IObservable<T>) {
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


export abstract class Observable<T extends object> implements IObservable<T>, IDisposable{
  private _observers: Array<IObserver<T>> = [];
  
  abstract getState(): T;
  
  attach(observer: IObserver<T>) {
      if (!this._observers.includes(observer)) {
          this._observers.push(observer);
      }
  }

  detach(observer: IObserver<T>){
      const observerIndex = this._observers.indexOf(observer);
      if (observerIndex !== -1) {
          this._observers.splice(observerIndex, 1);
      }
  }

  notify(...args: any[]) {
      this._observers.forEach(o => o.update(...args));
  }


  dispose() {
    this._observers = [];
  }
}