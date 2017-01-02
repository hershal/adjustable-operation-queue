'use strict';

const assert = require('assert');
const {Operation, OperationQueue} = require('../index');


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

  it(`should limit ${numOperations} tasks to ${concurrency} tasks at once`, function (done) {
    operations = Array.from(new Array(numOperations), (x, i) => {
      return new Operation((done)  => {
        setTimeout(() => {
          assert(queue._operationsInFlight.length <= queue._concurrency);
          done();
        }, Math.random()*500);
      });
    });

    operations.forEach((t) => queue.addOperation(t));
    queue
      .start()
      .then(() => done());
  });
});


describe('Randomized OperationQueue tests', function () {
  const numTimes = 10;
  for (let i=0; i<numTimes; ++i) {
    const concurrency = Math.round(Math.random()*100);
    const numTasks = Math.round(Math.random()*1000);

    it(`should run ${numTasks} tasks limited to ${concurrency} in parallel`, function (done) {
      let queue = new OperationQueue(concurrency);
      let operations = Array.from(new Array(numTasks), (x, i) => {
        return new Operation((done)  => {
          setTimeout(() => {
            assert(queue._operationsInFlight.length <= queue._concurrency);
            done();
          }, Math.random()*50);
        });
      });

      operations.forEach((t) => queue.addOperation(t));
      assert(operations.length > 0);
      assert(queue.pendingOperations.length == operations.length);
      queue
        .start()
        .then(() => done());
    });
  }
});
