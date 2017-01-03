# Operation Queue
Have you approached the requests per second limit on your favorite API? Wouldn't
it be great if there was a way to serialize your requests? Async/Await is almost
here but isn't supported everywhere yet (*cough* Safari *cough*) and still
doesn't let you easily set the parallelism of your asyncronous calls.

OperationQueue is here to help.

OperationQueue allows you to run multiple operations in parallel while making
sure that only a subset are running in parallel at any given time.

# Examples
```javascript
'use strict';

const {Operation, OperationQueue} = require('../index');

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
```

Which will output
```
OQ: === Added Operation: (guid: 92f0bf66, started: false)
OQ: === Added Operation: (guid: 434aae00, started: false)
OQ: === Added Operation: (guid: 15366c9d, started: false)
OQ: === Added Operation: (guid: cd6aee2c, started: false)
OQ: === Added Operation: (guid: 0990468d, started: false)
OQ: === Added Operation: (guid: eb67bd07, started: false)
OQ: *** Starting
OQ: --- Started Operation: (guid: eb67bd07, started: true)
OQ: --- Started Operation: (guid: 0990468d, started: true)
OQ: +++ Finished Operation: (guid: eb67bd07, started: true)
OQ: --- Started Operation: (guid: cd6aee2c, started: true)
OQ: +++ Finished Operation: (guid: cd6aee2c, started: true)
OQ: --- Started Operation: (guid: 15366c9d, started: true)
OQ: +++ Finished Operation: (guid: 0990468d, started: true)
OQ: --- Started Operation: (guid: 434aae00, started: true)
OQ: +++ Finished Operation: (guid: 434aae00, started: true)
OQ: --- Started Operation: (guid: 92f0bf66, started: true)
OQ: +++ Finished Operation: (guid: 92f0bf66, started: true)
OQ: +++ Finished Operation: (guid: 15366c9d, started: true)
OQ: *** All Done
Finished.
```
