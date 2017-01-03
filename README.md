# Operation Queue
Have you approached the requests per second limit on your favorite API? Wouldn't
it be great if there was a way to serialize your requests? Async/Await is almost
here but isn't supported everywhere yet (*cough* Safari *cough*) and still
doesn't let you easily set the parallelism of your asyncronous calls.

OperationQueue is here to help.

OperationQueue allows you to run multiple operations in parallel while making
sure that only a subset are running in parallel at any given time.

# Example
```javascript
'use strict';

const {Operation, OperationQueue} = require('./index');

/* Construct an OperationQueue which runs two tasks in parallel. The first
 * parameter is the maximum parallelism allowed. The second parameter is
 * optional and is for verbose prints. The operations run silently otherwise. */
let queue = new OperationQueue(2, true);

/* Construct the operations graph. Use OperationQueue.addOperation on an
 * operation to add it to the queue. */
let operations = Array.from(new Array(6), (x, i) => {
  /* Construct a new Operation. Operations take in a function which call done()
   * or failed() depending on the outcome of the operation. Please remember to
   * call done() when your task finishes otherwise the queue can't keep track of
   * your operation. */
  return new Operation((done, failed)  => {
    /* Set our operations to finish at a random interval. */
    setTimeout(() => done(), Math.random()*1000);
  });
});

/* Add the operations to the queue */
operations.forEach((t) => queue.addOperation(t));

/* Start! The OperationQueue returns an EC2015 Promise when all the operations
 * are complete. Promise rejection is not yet supported :( */
queue
  .start()
  .then(() => console.log('Finished.'));
```

Which will output something like
```
OQ: === Added Operation: (guid: 1f9f36b4, started: false)
OQ: === Added Operation: (guid: 69e24f63, started: false)
OQ: === Added Operation: (guid: b514f414, started: false)
OQ: === Added Operation: (guid: be29480c, started: false)
OQ: === Added Operation: (guid: 0d0c377d, started: false)
OQ: === Added Operation: (guid: f6a82261, started: false)
OQ: *** Starting
OQ: --- Started Operation: (guid: 1f9f36b4, started: true)
OQ: --- Started Operation: (guid: 69e24f63, started: true)
OQ: +++ Finished Operation: (guid: 69e24f63, started: true)
OQ: --- Started Operation: (guid: b514f414, started: true)
OQ: +++ Finished Operation: (guid: 1f9f36b4, started: true)
OQ: --- Started Operation: (guid: be29480c, started: true)
OQ: +++ Finished Operation: (guid: b514f414, started: true)
OQ: --- Started Operation: (guid: 0d0c377d, started: true)
OQ: +++ Finished Operation: (guid: be29480c, started: true)
OQ: --- Started Operation: (guid: f6a82261, started: true)
OQ: +++ Finished Operation: (guid: f6a82261, started: true)
OQ: +++ Finished Operation: (guid: 0d0c377d, started: true)
OQ: *** All Done
Finished.
```

Notice that the last two operations finished out of their original order, but
the Promise still resolved properly.

# TODO
- [ ] Arrange for cancellable Operations
- [ ] Reject the overall Promise when an individual callback is rejected
