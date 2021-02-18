import { IObservable } from './IObservable';
import { IObserver } from './IObserver';
import { WithDisposables } from '../utils/disposables';

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
