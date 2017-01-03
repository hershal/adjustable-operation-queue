'use strict';

const {Operation, OperationQueue} = require('./index');

/* Construct an OperationQueue which runs three tasks in parallel. The first
 * parameter is the maximum parallelism allowed. The second parameter is
 * optional and is for verbose prints. The operations run silently otherwise. */
let queue = new OperationQueue(3, true);

/* Construct the operations graph. */
let operations = Array.from(new Array(7), (_, i) => {
  /* Construct a new Operation. Operations take in a function which call done()
   * when the operation is complete. Please remember to call done() when your
   * task finishes otherwise the queue can't keep track of your operation. */
  return new Operation((done) => {
    /* Set our operations to finish at a random interval. */
    setTimeout(() => done(), Math.random()*1000);
  });
});

/* Add the operations to the queue. */
operations.forEach((t) => queue.addOperation(t));

/* Start! The OperationQueue returns an native Promise when all the operations
 * are complete. You can check if the queue is running by accessing the
 * 'running' property. Promise rejection is not yet supported :( */
queue
  .start()
  .then(() => console.log('Queue is running: ' + queue.running));

/* Control flow returns back to you immediately after starting the first batch
 * of operations. */
console.log('Queue is running: ' + queue.running);
