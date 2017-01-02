'use strict';

const limit = require('../limit');

const _ = require('lodash');
const assert = require('assert');

class OperationQueue {
  constructor(concurrency) {
    this._started = false;
    this._concurrency = concurrency;
    this._operationsInFlight = new Array();
    this._pendingOperations = new Array();
    this._finishedOperations = new Array();

    this._resolveCallback = undefined;
    this._rejectCallback = undefined;
  }

  addOperation(operation) {
    this._pendingOperations.push(operation);
  }

  taskFinished(task) {
    let idx = this._operationsInFlight.indexOf(task);
    assert(idx >= 0);
    this._operationsInFlight.splice(idx, 1);

    console.log('OQ: Operation Finished +++ ' + task.toString());
    this._finishedOperations.push(task);

    if (this._operationsInFlight.length == 0 && this._pendingOperations == 0) {
      console.log('OQ: ALL DONE!');
      this._resolveCallback();
    }

    this._start();
  }

  _start() {
    while (this._operationsInFlight.length < this._concurrency) {
      let op = this._pendingOperations.pop();
      if (!op) {
        break;
      }

      op.start().then(() => {
        this.taskFinished(op);
      });
      console.log('OQ: Operation Started --- ' + op.toString());
      this._operationsInFlight.push(op);
    }
  }

  start() {
    return new Promise((res, rej) => {
      this._resolveCallback = res;
      this._start();
    });
  }
}

class Operation {
  constructor(task) {
    this._task = task;
    this.started = false;
    this.cancelled = false;
  }

  /* make sure your task return a promise! */
  start() {
    this.started = true;
    return new Promise((res, rej) => this._task(res));
  }

  toString() {
    return `Operation: (started: ${this.started}, cancelled: ${this.cancelled})`;
  }
}

describe('OperationQueue tests', function () {

  let queue, operations;
  const concurrency = 5;
  const numOperations = 10;

  beforeEach(function () {
    queue = new OperationQueue(concurrency);
    operations = Array.from(new Array(numOperations), (x, i) => {
      return new Operation((done)  => {
        setTimeout(() => done(), Math.random()*500);
      });
    });
  });

  it('task should be valid', function (done) {
    operations[0].start().then(() => done());
  });

  it(`should run ${concurrency} tasks`, function (done) {
    operations
      .slice(0, concurrency)
      .forEach((t) => queue.addOperation(t));
    queue
      .start()
      .then(() => done());
  });

  it('should run a task', function (done) {
    operations.forEach((t) => queue.addOperation(t));
    queue.start()
      .then(() => {
        console.log('done!!');
        done();
      });
  });
});
