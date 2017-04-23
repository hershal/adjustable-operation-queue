'use strict';

const assert = require('assert');


class OperationQueue {
  get pendingOperations() { return this._pendingOperations; }
  get running() { return this._running; }

  constructor(parallelism, options) {
    this._running = false;
    this._parallelism = parallelism;
    this._operationsInFlight = new Array();
    this._pendingOperations = new Array();

    this._options = options || {};

    this._resolveCallback = undefined;
    this._rejectCallback = undefined;
    this._callback = undefined;
  }

  _log(message) {
    if (this._options.verbose) {
      console.log(message);
    }
  }

  addOperation(operation) {
    this._pendingOperations.push(operation);
    this._log('OQ: === Added ' + operation.toString());
    return this;
  }

  addOperations(operations) {
    operations.filter((op) => op instanceof Operation)
      .forEach((op) => this.addOperation(op));
    return this;
  }

  start(operations) {
    if (operations) { this.addOperations(operations); }
    if (this._pendingOperations.length == 0) {
      return Promise.resolve();
    }
    this._log('OQ: *** Starting');
    this._running = true;
    return new Promise((resolve, reject) => {
      this._resolveCallback = resolve;
      this._rejectCallback = reject;
      this._callback = this._resolveCallback;
      this._start();
    });
  }

  /* Cancel simply drains the queue of pending operations. In-flight operations
   * continue to run. */
  cancel() {
    this._log('OQ: ### Cancel Requested');
    this._callback = this._rejectCallback;
    this._drain();
  }

  _drain() {
    this._log('OQ: ### Draining Pending Operations');
    /* This clears the array without destroying others' references to it. */
    /* http://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript/ */
    this._pendingOperations.length = 0;
  }

  _taskFailed(task) {
    this._log('OQ: ### Failed   ' + task.toString());
    this._callback = this._rejectCallback;
    this._drain();
  }

  _taskFinished(task) {
    let idx = this._operationsInFlight.indexOf(task);
    assert(idx >= 0);
    this._operationsInFlight.splice(idx, 1);

    this._log('OQ: --- Finished ' + task.toString());

    if (this._operationsInFlight.length == 0 && this._pendingOperations == 0) {
      this._log('OQ: *** All Done');
      this._running = false;
      this._callback();
    }

    this._start();
  }

  _start() {
    while (this._operationsInFlight.length < this._parallelism) {

      let op;

      if (this._options.randomize) {
        const index = Math.floor(Math.random() * this._pendingOperations.length);
        op = this._pendingOperations.splice(index, 1)[0];
      } else {
        op = this._pendingOperations.shift();
      }

      if (!op) {
        break;
      }

      op.start()
        .catch(() => this._taskFailed(op))
        .then(() => this._taskFinished(op));

      this._log('OQ: +++ Started  ' + op.toString());
      this._operationsInFlight.push(op);
    }
  }
}
module.exports.OperationQueue = OperationQueue;


class Operation {
  get uid() { return this._uid; }

  constructor(task) {
    this._task = task;
    this._uid = this._generateUID();
  }

  _s4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }

  _generateUID() {
    return (this._s4() + this._s4());
  }

  /* make sure your task resolves or rejects the promise! */
  start() {
    return new Promise((res, rej) => this._task(res, rej));
  }

  toString() {
    return `(uid: ${this.uid})`;
  }
}
module.exports.Operation = Operation;
