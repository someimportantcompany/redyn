const lists = require('./lists');
const sets = require('./sets');
const strings = require('./strings');

module.exports = {
  methods: {
    ...strings.methods,
    ...lists.methods,
    ...sets.methods,
  },
  transactables: {
    ...strings.transactables,
    ...lists.transactables,
    ...sets.transactables,
  },
};
