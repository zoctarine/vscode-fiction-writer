import { IObserver } from './IObserver';

export interface IObservable<T extends object> {
    // Attach an observer to the subject.
    attach(observer: IObserver<T>): void;

    // Detach an observer from the subject.
    detach(observer: IObserver<T>): void;

    // Notify all observers about an event.
    notify(): void;

    getState() : T;
}

