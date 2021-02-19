---
title: Transactions
nav_order: 7
---

# Transactions

```js
await redyn.transaction([
  client.transaction.set('users:1', JSON.stringify({ id: 1, name: 'Barry Allen' })),
  client.transaction.set('users:2', JSON.stringify({ id: 2, name: 'Iris West' })),
  client.transaction.set('users:3', JSON.stringify({ id: 3, name: 'Cisco Ramon' })),
  client.transaction.set('users:4', JSON.stringify({ id: 4, name: 'Caitlin Snow' })),
  client.transaction.set('users:5', JSON.stringify({ id: 5, name: 'Harrison Wells' })),
]);
```

DynamoDB supports transactions but with a few important limitations, which `redyn` passes onto the developer:

- You can only execute up to & including 25 items at a time.
- This doesn't support clients that are created with explicit `dynamodb` clients passed to it.
- You cannot mix reads & writes - you can read 25 items or write 25 items, but not a mix of both.

And importantly, not all methods support transactions. You'll notice in the methods documentation above a line stating whether the method supports `READ` or `WRITE` transactions - this means you can group a maximum of 25 `READ` methods together or a maximum of 25 `WRITE` methods together. Not all methods support transactions, this is usually because they already use transactions underneath. The most notable example of this is [`HSET`](./Using-Hashmaps#clienthsetkey-field-value-field-value--).
