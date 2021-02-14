import { IObservable } from './IObservable';


export interface IObserver<T extends object> {

	// Receive update from observable.
	update(observable: IObservable<T>): void;
}
