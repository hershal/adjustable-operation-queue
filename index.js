'use strict';

const assert = require('assert');

class OperationQueue {

  get pendingOperations() { return this._pendingOperations; }

  constructor(parallelism, verbose) {
    this._started = false;
    this._parallelism = parallelism;
    this._operationsInFlight = new Array();
    this._pendingOperations = new Array();

    this._verbose = verbose ? verbose : false;

    this._resolveCallback = undefined;
    this._rejectCallback = undefined;
  }

  log(message) {
    if (this._verbose) {
      console.log(message);
    }
  }

  addOperation(operation) {
    this._pendingOperations.push(operation);
  }

  start() {
    return new Promise((res, rej) => {
      this._resolveCallback = res;
      this._start();
    });
  }

  _taskFinished(task) {
    let idx = this._operationsInFlight.indexOf(task);
    assert(idx >= 0);
    this._operationsInFlight.splice(idx, 1);

    this.log('OQ: +++ Finished ' + task.toString());

    if (this._operationsInFlight.length == 0 && this._pendingOperations == 0) {
      this.log('OQ: *** All Done');
      this._resolveCallback();
    }

    this._start();
  }

  _start() {
    while (this._operationsInFlight.length < this._parallelism) {
      let op = this._pendingOperations.pop();
      if (!op) {
        break;
      }

      op.start().then(() => {
        this._taskFinished(op);
      });
      this.log('OQ: --- Started ' + op.toString());
      this._operationsInFlight.push(op);
    }
  }
}
module.exports.OperationQueue = OperationQueue;

class Operation {
  constructor(task) {
    this._task = task;
    this.started = false;
    this.cancelled = false;
  }

  /* make sure your task resolves or rejects the promise! */
  start() {
    this.started = true;
    return new Promise((res, rej) => this._task(res, rej));
  }

  toString() {
    return `Operation: (started: ${this.started}, cancelled: ${this.cancelled})`;
  }
}
module.exports.Operation = Operation;