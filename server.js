//normal requirements
const express = require('express');
const socket = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('morgan');
const stockCtrl = require('./controllers/stock.js');
const StockCtrl = new stockCtrl();
const fs = require('fs');
const Highcharts = require('highcharts');
require('./models/datasetSchema.js');

const app = express();

const server = app.listen((process.env.PORT || 3000), function(){
  console.log('app is listening on localhost:3000');
});

//Connect to mongoose database
const db = 'mongodb://mbuckles:adjf1963@ds163681.mlab.com:63681/mb-stock-app'
mongoose.connect(db, function(err){
if(err){
   console.log('db connect error');
}
});
mongoose.connection.on('connected', function() {
  console.log('connected to ' + db);
});
mongoose.connection.on('disconnected', function() {
  console.log('disconnected from mongoose');
});
mongoose.connection.on('error', function() {
  console.log('error connecting to mongoose');
});
mongoose.Promise = global.Promise;

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res){
  res.sendFile('index');
});
app.get('/stocks/all', function(req, res) {
  StockCtrl.loadAll().then(function(dataset) {
    res.json(dataset);
  });
});
// socket setup
const io = socket(server);
io.on('connection', function(socket){
  console.log('a server connected', socket.id);
  socket.on('lookup stock', function(symbol){
    StockCtrl.retrieveStockData(symbol).then(function(dataset) {
      io.emit('add stock', dataset);
      StockCtrl.loadAll();
    });
      StockCtrl.loadAll()
    });
  socket.on('remove stock', function(symbol){
    StockCtrl.removeStock(symbol);
    io.emit('remove stock', symbol);
    StockCtrl.loadAll();
    StockCtrl.loadAll()

  });
  socket.on('disconnect', function(socket) {
      console.log('server got disconnected!');
});
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
      message: err.message,
      error: {}
    });
  });
}

// production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message,
    error: {}
  });
});

module.exports = app;
