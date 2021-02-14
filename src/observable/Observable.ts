import { IObservable } from './IObservable';
import { Observer } from './Observer';

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