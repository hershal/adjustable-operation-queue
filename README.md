# Operation Queue
Is your app too slow because you have to serialize all your requests? Wouldn't
it be great if there was a way to serialize your requests, but still have the
speed of parallelism? Wouldn't it be awesome if you had parallism without having
*so much* parallelism that your app grinds to a halt?

OperationQueue is here to help.

OperationQueue allows you to run multiple operations in parallel while making
sure that only a subset are running in parallel at any given time.

# Example
```javascript
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
```

Which will output something like:
```
$ node ./example.js
OQ: === Added Operation: (guid: d140e7c3)
OQ: === Added Operation: (guid: fd4e6176)
OQ: === Added Operation: (guid: 811e088a)
OQ: === Added Operation: (guid: 316ada0c)
OQ: === Added Operation: (guid: c73f6340)
OQ: === Added Operation: (guid: b0132cd7)
OQ: === Added Operation: (guid: 8850e6bb)
OQ: *** Starting
OQ: +++ Started  Operation: (guid: d140e7c3)
OQ: +++ Started  Operation: (guid: fd4e6176)
OQ: +++ Started  Operation: (guid: 811e088a)
Queue is running: true
OQ: --- Finished Operation: (guid: d140e7c3)
OQ: +++ Started  Operation: (guid: 316ada0c)
OQ: --- Finished Operation: (guid: fd4e6176)
OQ: +++ Started  Operation: (guid: c73f6340)
OQ: --- Finished Operation: (guid: c73f6340)
OQ: +++ Started  Operation: (guid: b0132cd7)
OQ: --- Finished Operation: (guid: 811e088a)
OQ: +++ Started  Operation: (guid: 8850e6bb)
OQ: --- Finished Operation: (guid: 8850e6bb)
OQ: --- Finished Operation: (guid: 316ada0c)
OQ: --- Finished Operation: (guid: b0132cd7)
OQ: *** All Done
Queue is running: false
```

Notice that the last few operations finished out of their original order, but
the Promise still resolved properly. OperationQueue handles this with ease,
allowing requests to complete in any order.

# TODO
- [ ] Arrange for cancellable Operations
- [ ] Reject the overall Promise when an individual callback is rejected or fails
