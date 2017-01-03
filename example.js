'use strict';

const {Operation, OperationQueue} = require('./index');

/* construct an OperationQueue which runs five tasks in parallel */
let queue = new OperationQueue(2, true);

/* construct the operations graph */
let operations = Array.from(new Array(6), (x, i) => {
  return new Operation((done)  => {
    setTimeout(() => done(), Math.random()*50);
  });
});

/* add the operations to the queue */
operations.forEach((t) => queue.addOperation(t));

/* start! */
queue
  .start()
  .then(() => console.log('Finished.'));
