'use strict';

const assert = require('assert');
const {Operation, OperationQueue} = require('../index');


function linearOperations(numOperations, queue) {
  return Array.from(new Array(numOperations), (x, i) => {
    return new Operation((done) => {
      assert(queue.running);
      assert(queue._operationsInFlight.length <= queue._parallelism);
      setTimeout(() => done(), Math.random()*20);
    });
  });
}


describe('OperationQueue tests', function () {
  let queue, operations;
  const parallelism = 5;
  const numOperations = 10;

  beforeEach(function () {
    /* construct the queue */
    queue = new OperationQueue(parallelism);

    /* construct the operations graph */
    operations = linearOperations(numOperations, queue);
  });

  it(`should run ${parallelism} tasks`, function (done) {
    assert(!queue.running);
    operations
      .slice(0, parallelism);
    queue
      .addOperations(operations)
      .start()
      .then(() => { assert(!queue.running); done(); });
    assert(queue.running);
  });

  it(`should limit ${numOperations} tasks to ${parallelism} tasks at once`, function (done) {
    queue
      .start(operations)
      .then(() => done());
  });
});


describe('Randomized OperationQueue tests', function () {
  const numTimes = 10;
  for (let i=0; i<numTimes; ++i) {
    const parallelism = Math.ceil(Math.random()*100);
    const numOperations = Math.ceil(Math.random()*100);

    it(`should run ${numOperations} tasks limited to ${parallelism} in parallel`, function (done) {
      let queue = new OperationQueue(parallelism, {randomize: true});
      assert(!queue.running);
      /* Build the operation graph; each operation here checks that the number
       * of in-flight operations does not exceed the requested parallelism */
      let operations = linearOperations(numOperations, queue);

      /* add the operations to the queue and run! */
      queue
        .addOperations(operations)
        .start()
        .then(() => { assert(!queue.running); done(); });
    });
  }
});
