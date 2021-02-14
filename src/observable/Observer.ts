import { IObservable } from './IObservable';
import { IObserver } from './IObserver';


export abstract class Observer<T extends {}> implements IObserver<T> {
	protected state: T;

	constructor(private observable: IObservable<T>) {
		// attach itslef to the observer
		observable.attach(this);

		// save the current state of the observer
		this.state = observable.getState();
	}

	update(): void {
    this.onStateChange(this.observable.getState())
	}

  protected onStateChange(newState: T){
		this.state = newState;
  }
}
