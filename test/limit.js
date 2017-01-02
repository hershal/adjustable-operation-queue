'use strict';

const limit = require('../limit');

const _ = require('lodash');
const assert = require('assert');

class OperationQueue {
  constructor(concurrency) {
    this._started = false;
    this._concurrency = concurrency;
    this._operations = new Array();
  }

  addOperation(operation) {
    this._operations.push(operation);
  }

  taskFinished(i) {
    console.log('task finished ' + i + ' ' + this._operations[i].toString());
    this._operations[i].finished = true;

    /* scan for next unstarted task */
    const op = this._operations.filter((o) => !(o.started))[0];
    const j = this._operations.indexOf(op);
    op.start()
      .then(() => {
        this.taskFinished(j);
      });
  }

  start() {
    this._started = true;
    return new Promise((resolve, reject) => {
      const numTasks = Math.min(this._concurrency, this._operations.length);

      /* initial task start is a special case */
      for (let i=0; i<numTasks; ++i) {
        this._operations[i].start().then(() => {
          this.taskFinished(i);
        });
      }

      /*  */

    });
  }
}

class Operation {
  constructor(task) {
    this._task = task;
    this.started = false;
    this.finished = false;
    this.cancelled = false;
  }

  /* make sure your task return a promise! */
  start() {
    this.started = true;
    return this._task();
  }

  toString() {
    return `Operation: (s: ${this.started}, f: ${this.finished}, c: ${this.cancelled})`;
  }
}

describe('OperationQueue tests', function () {

  let queue, operations;
  const concurrency = 5;

  beforeEach(function () {
    queue = new OperationQueue(concurrency);
    operations = Array.from(new Array(concurrency), (x, i) =>
                            new Operation(() => {
                              return new Promise(
                                (resolve, reject) => {
                                  console.log('task started ' + i);
                                  const timeout = Math.random() * 1000;
                                  setTimeout(() => {
                                    console.log('task done: ' + i);
                                    resolve();
                                  }, timeout);
                                });
                            }));
  });

  it('should run a task', function (done) {
    operations.forEach((t) => queue.addOperation(t));
    queue.start().then(() => {
      console.log('done!!');
      done();
    });
  });
});
