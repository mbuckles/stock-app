/*global $, io*/
const socket = io.connect();
const stockData = [];
const colors = ['#f72c25','#0c0a00','#79f725','#4286f4','#f7d025','#f936d2','#36e6f9','#997d7d'];
$(document).ready(function() {
  $.get('/stocks/all', function(result) {
    result.forEach(function(company) {
      const fullName = company.company;
      const nameArray = fullName.split(" ");
      nameArray.splice(-7,7);
      company.company = nameArray.join(" ");
      addToLocalData(company);
    });
    stockData.forEach(function(company) {
      $('.flex-container').append($('<div class="flex-item company ' + company.colorCode + '">').attr('id', company.name).html('<h2>' + company.name + '</h2><span class="company-name">' + company.company + '</span>'));
      $('#' + company.name).append('<a href="#" class="remove"><i class="glyphicon glyphicon-trash"></i></a>');
    });
    drawChart(stockData);
  });

  $(".alert-danger").fadeTo(2000, 500).slideUp(500, function(){
    $(".alert-danger").alert('close');
  });
});

$('body').on('click', '.remove', function(e) {
  const target = $(e.target).parent().parent();
  const symbol = target.attr('id');
  target.remove();
  socket.emit('remove stock', symbol);
});
$('form').submit(function(){
  $('#errors').text('');
  const symbol = $('#symbol').val().toUpperCase();
  const elementPos = stockData.map(function(x) { return x.name; }).indexOf(symbol);
  if (elementPos !== -1) {
    $('#errors').append('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close" id="' + symbol +'error"><span aria-hidden="true">&times;</span></button>' + symbol + ' is already displayed. Refresh the page first. Then try adding a different stock, or removing this one first.</div>');
    $('#' + symbol + 'error').fadeTo(2000, 500).slideUp(500, function(){
      $('#' + symbol + 'error').alert('close');
    });
    return false;
  } else if (elementPos === -1) {
    socket.emit('lookup stock', symbol);
    return false;
  }
});

socket.on('add stock', function(dataset){
  if (dataset.quandl_error) {
    $('#errors').append('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close" id="quandlerror"><span aria-hidden="true">&times;</span></button>The symbol entered is either not a valid stock symbol, or is not included in our data source. Refresh the page first. Then try adding a different stock, or removing this one first.</div>');
    $('#quandlerror').fadeTo(2000, 500).slideUp(500, function(){
      $('#quandlerror').alert('close');
    });
  } else {
    var company = dataset.dataset;
    company.company = company.name;
    company.symbol = company.dataset_code;
    //console.log(company.company);
    //console.log(company.symbol);
    addToLocalData(company);
    company = stockData[stockData.length-1];
    console.log(company.name);
    $('.flex-container').append($('<div class="flex-item company ' + company.colorCode + '">').attr('id', company.name).html('<h2>' + company.name + '</h2><span class="company-name">' + company.company + '</span>'));
    $('#' + company.name).append('<a href="#" class="remove"><i class="glyphicon glyphicon-trash"></i></a>');
    stockData.forEach(function(stock) {
      refreshColors(stock);
    });
    drawChart(stockData);
  }
});

socket.on('remove stock', function(symbol) {
  /* Remove from chart */
  const elementPos = stockData.map(function(x) { return x.name; }).indexOf(symbol);
  stockData.splice(elementPos, 1);
  stockData.forEach(function(stock) {
    refreshColors(stock);
  });
  drawChart(stockData);
  /* Remove from directory */
  $('#' + symbol).remove();
});

const addToLocalData = function(company) {
  const inserter = {};
  inserter.name = company.symbol;
  inserter.company = convertedName(company.company);
  inserter.data = convertedData(company.data);
  inserter.tooltip = {
    valueDecimals: 2
  };
  inserter.color = colors[(stockData.length % 8)];
  inserter.colorCode = "color" + (stockData.length % 8);
  stockData.push(inserter);
};

const convertedName = function(name) {
  const nameArray = name.split(" ");
  if (nameArray.indexOf('Prices,') !== -1) {
    nameArray.splice(-7,7);
  }
  return nameArray.join(" ");
};

const convertedData = function(data) {
  data.forEach(function(datum, idx) {
    datum[0] = new Date(datum[0]).getTime();
  });
  return data;
};

const refreshColors = function(stock) {
  const num = stockData.indexOf(stock);
  const position = num % 8;
  stock.color = colors[position];
  stock.colorCode = "color" + position;
  $('#' + stock.name).attr('class', 'flex-item company ' + stock.colorCode);
};

const drawChart = function (stockData) {
  $('#chart').highcharts('StockChart', {
    series: stockData
  });
};
