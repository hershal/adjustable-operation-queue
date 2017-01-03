'use strict';

const assert = require('assert');
const {Operation, OperationQueue} = require('../index');


describe('OperationQueue tests', function () {
  let queue, operations;
  const parallelism = 5;
  const numOperations = 10;

  beforeEach(function () {
    /* construct the queue */
    queue = new OperationQueue(parallelism);

    /* construct the operations graph */
    operations = Array.from(new Array(numOperations), (x, i) => {
      return new Operation((done)  => {
        setTimeout(() => done(), Math.random()*50);
      });
    });
  });

  it('task should be valid', function (done) {
    operations[0].start().then(() => done());
  });

  it(`should run ${parallelism} tasks`, function (done) {
    operations
      .slice(0, parallelism)
      .forEach((t) => queue.addOperation(t));
    queue
      .start()
      .then(() => done());
  });

  it(`should limit ${numOperations} tasks to ${parallelism} tasks at once`, function (done) {
    /* have to re-construct the oeprations because I want to insert some middleware */
    operations = Array.from(new Array(numOperations), (x, i) => {
      return new Operation((done)  => {
        setTimeout(() => {
          assert(queue._operationsInFlight.length <= queue._parallelism);
          done();
        }, Math.random()*10);
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
    const parallelism = Math.ceil(Math.random()*100);
    const numTasks = Math.ceil(Math.random()*100);

    it(`should run ${numTasks} tasks limited to ${parallelism} in parallel`, function (done) {
      let queue = new OperationQueue(parallelism);
      let operations = Array.from(new Array(numTasks), (x, i) => {
        return new Operation((done)  => {
          setTimeout(() => {
            assert(queue._operationsInFlight.length <= queue._parallelism);
            done();
          }, Math.random()*10);
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
