import { ObservableAdministration } from './Observable.administration.js';
import { getGlobal } from './global.this.js';
import { Subscriber } from './types.js';

export interface WorkStats {
  count: number;
  read: Map<ObservableAdministration, Set<string | symbol>>;
  dispose: () => void | undefined;
  exception: undefined | Error;
  result: any;
}

function workStats() {
  return {
    count: 0,
    read: new Map<ObservableAdministration, Set<string | symbol>>(),
    exception: undefined,
    result: undefined,
    dispose: undefined,
  };
}

export interface TransactionResult {
  stats: WorkStats;
  dispose: () => void;
  exception: undefined | Error;
  result: any;
}

class ObservableTransactionsImpl {
  static #track: Map<Function, WorkStats> = new Map();
  static #stack: Function[] = [];
  static report(administration: ObservableAdministration, property: string | symbol) {
    const current = this.#stack.at(-1);
    const stats = this.#track.get(current);
    if (stats) {
      let read = stats.read.get(administration);
      if (!read) {
        read = new Set();
        stats.read.set(administration, read);
      }
      read.add(property);
    }
  }

  public static transaction = (work: Function, cb: Subscriber) => {
    let stats = this.#track.get(work);
    if (!stats) {
      stats = workStats();
      this.#track.set(work, stats);
    }
    let result: any;
    try {
      this.#stack.push(work);
      result = work();
      this.#stack.pop();
      stats.count++;
      stats.result = result;
      queueMicrotask(() => {
        stats.read.forEach((keys, adm) => adm.subscribe(cb, keys));
      });

      if (!stats.dispose) {
        stats.dispose = () => this.#track.delete(work);
      }
    } catch (e) {
      stats.exception = e as Error;
    }
    return stats;
  };
}

// This is for Webpack Module Federation V1
// we should only use one instance of ObservableTransactionsImpl
const TransactionExecutor = Symbol.for('ObservableTransactions');
const _self = getGlobal();

if (!(TransactionExecutor in _self)) {
  Reflect.set(_self, TransactionExecutor, ObservableTransactionsImpl);
}

declare global {
  interface Window {
    [TransactionExecutor]: {
      transaction(work: Function, cb: Subscriber): WorkStats;
      notify(subscriber: Subscriber, changes?: Set<string | symbol>): void;
      report(administration: ObservableAdministration, property: string | symbol): void;
    };
  }
}

export const ObservableTransactions = _self[TransactionExecutor];

/** Accepts one function that should run every time anything it observes changes. <br />
 It also runs once when you create the autorun itself.
 Returns a dispose function.
 */
export function autorun(fn: () => void) {
  const { dispose } = ObservableTransactions.transaction(fn, fn);
  return dispose;
}
