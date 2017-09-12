'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataset = new Schema({
  company: String,
  symbol: String,
  data: Array
});

module.exports = mongoose.model('Dataset', dataset);
