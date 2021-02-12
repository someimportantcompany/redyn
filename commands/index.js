const hashes = require('./hashes');
const lists = require('./lists');
const sets = require('./sets');
const strings = require('./strings');

module.exports = {
  methods: {
    ...strings.methods,
    ...lists.methods,
    ...hashes.methods,
    ...sets.methods,
  },
  transactables: {
    ...strings.transactables,
    ...lists.transactables,
    ...hashes.transactables,
    ...sets.transactables,
  },
};
