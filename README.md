# Operation Queue
Adjustable asynchronous operation queue

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
let queue = new OperationQueue(3, {verbose: true});

/* Construct the operations graph. */
let operations = Array.from(new Array(7), (_, i) => {
  /* Construct a new Operation. Operations take in a function with a callback
   * which you should call when the operation is complete. */
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
OQ: === Added (uid: d140e7c3)
OQ: === Added (uid: fd4e6176)
OQ: === Added (uid: 811e088a)
OQ: === Added (uid: 316ada0c)
OQ: === Added (uid: c73f6340)
OQ: === Added (uid: b0132cd7)
OQ: === Added (uid: 8850e6bb)
OQ: *** Starting
OQ: +++ Started  (uid: d140e7c3)
OQ: +++ Started  (uid: fd4e6176)
OQ: +++ Started  (uid: 811e088a)
Queue is running: true
OQ: --- Finished (uid: d140e7c3)
OQ: +++ Started  (uid: 316ada0c)
OQ: --- Finished (uid: fd4e6176)
OQ: +++ Started  (uid: c73f6340)
OQ: --- Finished (uid: c73f6340)
OQ: +++ Started  (uid: b0132cd7)
OQ: --- Finished (uid: 811e088a)
OQ: +++ Started  (uid: 8850e6bb)
OQ: --- Finished (uid: 8850e6bb)
OQ: --- Finished (uid: 316ada0c)
OQ: --- Finished (uid: b0132cd7)
OQ: *** All Done
Queue is running: false
```

Notice that the last few operations finished out of their original order, but
the Promise still resolved properly. OperationQueue handles this with ease,
allowing requests to complete in any order.

# TODO
- [ ] Arrange for cancellable Operations
- [ ] Reject the overall Promise when an individual callback is rejected or fails
