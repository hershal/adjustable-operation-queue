# Adjustable Operation Queue
[![Build Status](https://travis-ci.org/hershal/adjustable-operation-queue.svg?branch=master)](https://travis-ci.org/hershal/adjustable-operation-queue)

Asynchronous adjustable-parallelism operation queue

Inspired by NSOperation and NSOperationQueue.

Is your app too slow because you have to serialize all your requests? Wouldn't
it be great if you could parallelize your requests but still retain control
flow? Wouldn't it be awesome if you had the speed of parallelism without DOSing
your server?

OperationQueue is here to help.

OperationQueue allows you to run multiple operations in parallel while making
sure that only a subset are running at any given time. Additionally,
OperationQueue hands you an ES2015 Promise that resolves when all the operations
complete. Now you can have your parallelism *and* avoid callback hell. Awesome.

# Example
```javascript
'use strict';

const {Operation, OperationQueue} = require('adjustable-operation-queue');

/* Construct an OperationQueue which runs three tasks in parallel. The first
 * parameter is the maximum parallelism allowed. The second parameter is
 * optional and is for verbose prints. The operations run silently otherwise. */
let queue = new OperationQueue(3, {verbose: true});

/* Construct the operations graph. */
let operations = [...Array(7).keys()].map((i) => {
  /* Construct a new Operation. Operations take in a function with a callback
   * which you should call when the operation is complete. */
  return new Operation((done, fail) => {
    /* Set our operations to finish at a random interval. */
    setTimeout(() => done(), Math.random()*1000);
  });
});

/* Add the operations to the queue and start! The OperationQueue returns an
 * native Promise when all the operations are complete. You can check if the
 * queue is running by accessing the 'running' property. */
queue
  .addOperations(operations)
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

# Cancellation
The OperationQueue is cancellable. You cancel the OperationQueue by calling
`queue.cancel()`. Note that the queue is not actually stopped at that point
because there may be running operations. Rather, the queue does not allow new
operations to run after queue cancellation. When the last in-progress operation
completes, the queue will reject the Promise it returned to you when you called
`queue.start()`. It is up to you at that point to handle the Promise rejection.

# Operation Failure
Operation failure is handled similar to cancellation: If an Operation fails,
then the OperationQueue drains and rejects its Promise once all running
Operations finish. If you do not want to stop the queue, call `done()` instead
of `fail()`.

Here's an example which demonstrates Operation failure:

```javascript
'use strict';

const {Operation, OperationQueue} = require('adjustable-operation-queue');

let queue = new OperationQueue(3, {verbose: true});

let operations = [...Array(7).keys()].map((i) => {
  return new Operation((done, fail) => {
    /* Decide if this operation fails */
    const callback = Math.random() > 0.5 ? done : fail;
    setTimeout(() => callback(), Math.random()*1000);
  });
});

queue
  .addOperations(operations)
  .start()
  .then(() => console.log('You should not see this message; the queue should reject'))
  .catch(() => console.log('Queue cancelled; some operation(s) failed'))
  .then(() => console.log('Queue is running: ' + queue.running));
console.log('Queue is running: ' + queue.running);
```

Which will output something like this:

```
$ node ./example-fail.js
OQ: === Added (uid: bd38091d)
OQ: === Added (uid: af58061f)
OQ: === Added (uid: 63f5ed5b)
OQ: === Added (uid: 9a2f0e01)
OQ: === Added (uid: 21af5986)
OQ: === Added (uid: c32e3dab)
OQ: === Added (uid: fc36351e)
OQ: *** Starting
OQ: +++ Started  (uid: bd38091d)
OQ: +++ Started  (uid: af58061f)
OQ: +++ Started  (uid: 63f5ed5b)
Queue is running: true
OQ: ### Failed   (uid: af58061f)
OQ: ### Draining Pending Operations
OQ: --- Finished (uid: af58061f)
OQ: --- Finished (uid: 63f5ed5b)
OQ: --- Finished (uid: bd38091d)
OQ: *** All Done
Queue cancelled; some operation(s) failed
Queue is running: false
```

Notice that three tasks finished between a the failure and the queue completion,
as per the OperationQueue cancellation logic above.
