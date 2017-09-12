'use strict';
const Quandl = require('quandl');
const Dataset = require('../models/datasetSchema.js');


const stockCtrl = function(){
  const that = this;

  this.retrieveStockData = function(symbol) {
    return new Promise(function(resolve, reject) {
      const clientKey = 'aeMGV4yy2j-SQ43GPK8i';
      process.env.QUANDL_KEY = 'aeMGV4yy2j-SQ43GPK8i';
      const url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + symbol + '/data.json?api_key=' + clientKey;

      const quandl = new Quandl({
        auth_token: process.env.QUANDL_KEY,
        api_version: 3
      });

      quandl.dataset({
        source: "WIKI",
        table: symbol.toUpperCase(),
      },{
        order: 'asc',
        exclude_column_names: true,
        start_date: '2000-09-01',
        end_date: '2099-09-14',
        column_index: 4
      },function(err, response) {
        if (err) {
          reject(Error(err));
        }
        const parsed = JSON.parse(response);
        that.transformAndSave(parsed);
        resolve(parsed);
      });
    });
  };

  this.transformAndSave = function(quandlData) {
    return new Promise(function(resolve, reject) {

      const company = quandlData.dataset.name;
      const symbol = quandlData.dataset.dataset_code;
      const data = quandlData.dataset.data;

      Dataset.findOne({symbol: symbol}).remove(function(err, results) {
        if (err) { throw err };
        const doc = {company: company, symbol: symbol, data: data};
        const newSet = new Dataset(doc);
        newSet.save(function(result) {
          resolve(result);
        });
      });
    });
  };

  this.removeStock = function(symbol) {
    Dataset.findOneAndRemove({ symbol: symbol }, function(err, result) {
      if (err) { throw err; }
      console.log("Removed stock successfully");
    });
  };

  this.loadAll = function() {
    return new Promise(function(resolve, reject) {
      Dataset.find().exec(function (err, result) {
        if (err) {
          reject(Error(err))
        } else if (result) {
          resolve(result);
        }
      });
    });
  };
};

module.exports = stockCtrl;
