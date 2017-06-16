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


function checkQueueCancellation(queue, operations, done) {
  let caught = false;
  assert(!queue.running);
  assert(!queue.cancelled);
  queue
    .addOperations(operations)
    .start()
    .catch(() => { caught = true; assert(!queue.running); assert(queue.cancelled); })
    .then(() => { assert(caught); done(); });
  assert(queue.running);
  assert(!queue.cancelled);
}


describe('OperationQueue Cancel', function () {
  let queue;
  const parallelism = 5;
  const numOperations = 20;


  beforeEach(function () {
    /* construct the queue */
    queue = new OperationQueue(parallelism);
  });


  it('cancels the queue by OperationQueue call', function (done) {
    /* construct the operations graph */
    const operations = linearOperations(numOperations, queue);

    setTimeout(() => {
      assert(queue.running);
      assert(!queue.cancelled);
      assert(queue.pendingOperations.length > 0);
      assert(queue._operationsInFlight.length == parallelism);
      queue.cancel();
      assert(queue.pendingOperations.length == 0);
      assert(queue._operationsInFlight.length == parallelism);
      /* The queue should drain */
      assert(queue.running);
      assert(queue.cancelled);
    }, 20);

    checkQueueCancellation(queue, operations, done);
  });


  it('cancels the queue by Operation failure', function (done) {
    const failureRate = 0.2;
    const operations = randomFailOperations(numOperations, queue, failureRate);
    checkQueueCancellation(queue, operations, done);
  });


  it('resets the OperationQueue cancelled flag when reusing a queue', function (done) {
    queue.cancel();
    assert(!queue.running);
    assert(queue.cancelled);
    queue
      .start()
      .then(() => { assert(!queue.running); assert(!queue.cancelled); done(); });
    /* There are no operations in the queue, assert(queue.running) would fail. */
    assert(!queue.cancelled);
  });
});
