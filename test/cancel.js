'use strict';

const assert = require('power-assert');
const {Operation, OperationQueue} = require('../index');


function linearOperations(numOperations, queue) {
  return [...Array(numOperations).keys()].map((i) => {
    return new Operation((done) => {
      assert(queue.running);
      assert(queue._operationsInFlight.length <= queue._parallelism);
      setTimeout(() => done(), 20);
    });
  });
}


function randomFailOperations(numOperations, queue, failureRate) {
  return [...Array(numOperations).keys()].map((i) => {
    return new Operation((done, fail) => {
      assert(queue.running);
      assert(queue._operationsInFlight.length <= queue._parallelism);
      const shouldFail = Math.random() >= failureRate;
      const callback = shouldFail ? fail : done;
      setTimeout(() => callback(), Math.random()*20);
    });
  });
}


describe('OperationQueue Cancel', function () {
  let queue;
  const parallelism = 5;
  const numOperations = 20;


  beforeEach(function () {
    /* construct the queue */
    queue = new OperationQueue(parallelism, {verbose: true});
  });


  it('cancels a task from the outside', function (done) {
    /* construct the operations graph */
    const operations = linearOperations(numOperations, queue);

    let caught = false;
    setTimeout(() => {
      assert(queue.running);
      assert(queue.pendingOperations.length > 0);
      assert(queue._operationsInFlight.length == parallelism);
      queue.cancel();
      assert(queue.pendingOperations.length == 0);
      assert(queue._operationsInFlight.length == parallelism);
      /* The queue should drain */
      assert(queue.running);
    }, 20);

    assert(!queue.running);
    queue
      .addOperations(operations)
      .start()
      .catch(() => {caught = true; assert(!queue.running);})
      .then(() => { assert(caught); done(); });
    assert(queue.running);
  });


  it('cancels a task from an Operation', function (done) {
    const failureRate = 0.2;
    const operations = randomFailOperations(numOperations, queue, failureRate);

    let caught = false;

    assert(!queue.running);
    queue
      .addOperations(operations)
      .start()
      .catch(() => {caught = true; assert(!queue.running);})
      .then(() => { assert(caught); done(); });
    assert(queue.running);
  });
});
