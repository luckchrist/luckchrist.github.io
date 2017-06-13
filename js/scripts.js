var files = null;

function CSVToArray(strData, strDelimiter) {
  strDelimiter = (strDelimiter || ",");
  var objPattern = new RegExp(
    (
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );
  var arrData = [[]];
  var arrMatches = null;
  while (arrMatches = objPattern.exec(strData)) {
    var strMatchedDelimiter = arrMatches[1];
    if (
      strMatchedDelimiter.length &&
      (strMatchedDelimiter != strDelimiter)
    ) {
      arrData.push([]);
    }
    if (arrMatches[2]) {
      var strMatchedValue = arrMatches[2].replace(
        new RegExp("\"\"", "g"),
        "\""
      );
    } else {
      var strMatchedValue = arrMatches[3];
    }
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  return(arrData);
}

function getFile(evt) {
  files = evt.target.files;
}

function processData() {
  var file = files[0];
  var reader = new FileReader();
  reader.onload = function() {
    var _data = this.result;
    var _arrData = CSVToArray(_data);
	
    // Remove header
    _arrData.splice(0, 1);
	  _arrData.splice(_arrData.length - 1, 1);
	
    var _miu0 = document.getElementById('miu0').value;
    var _interval = parseInt(document.getElementById('interval').value);

    var _ct = 0;
    for (var i = 1; i <= _arrData.length; i++) {
      _arrData[i - 1][0] = parseInt(_arrData[i - 1][0]);
      _arrData[i - 1][1] = _arrData[i - 1][1];
      _arrData[i - 1][2] = _miu0;

      var _brix = _arrData[i - 1][1];
      if (_brix <= _arrData[i - 1][2]) _arrData[i - 1][3] = 0;
      else _arrData[i - 1][3] = 1;

      _ct += _arrData[i - 1][3];

      _arrData[i - 1][4] = -1;

      if (i % _interval == 0) {
        _arrData[i - 1][4] = _ct;
        _ct = 0;
      }
    };

    // Get P value
    var _sumOfYj = 0;
    for (var i = 1; i <= _arrData.length; i++) {
      _sumOfYj += _arrData[i - 1][3];
    }
    var _p = _sumOfYj * 1.0 / _arrData.length;
    for (var i = 1; i <= _arrData.length; i++) {
      _arrData[i - 1][5] = -1;
      if (i % _interval == 0) {
        _arrData[i - 1][5] = parseFloat(_p.toFixed(6));
      }
    }

    // Filtering for Si = null
    _arrData = _arrData.filter(function(x) {
      return x[4] !== -1;
    });

    // Start counting EWMA
    var _lambda = 0.9;
    var _arrNewData = [];
    for (var i = 0; i < _arrData.length; i++) {
      _arrNewData[i] = [];
      _arrNewData[i][0] = _lambda; // Lambda
      _arrNewData[i][1] = _arrData[i][4]; // Si Brix
      _arrNewData[i][2] = _lambda * _arrData[i][4]; // Lambda * Si
      _arrNewData[i][3] = (1 - _lambda).toFixed(1); // 1 - Lambda
      _arrNewData[i][4] = _arrNewData[i][1];
    }

    var temp = [];
    for (var i = 0; i < _arrNewData.length; i++) {
      temp.push(_arrNewData[i][1]);
    }

    for (var i = 0; i < _arrNewData.length; i++) {
      if (i > 0) _arrNewData[i][4] = temp[i - 1]; // Si - 1
      _arrNewData[i][5] = _arrNewData[i][3] * _arrNewData[i][4]; // (1 - lambda) * (Si - 1)
    }

    var _sumOfSiBrix = 0;
    for (var i = 0; i < _arrNewData.length; i++) {
      _sumOfSiBrix += _arrNewData[i][1];
    }
    _arrNewData[0][6] = (_sumOfSiBrix * 1.0 / _arrNewData.length).toFixed(6); // First EWMASi

    for (var i = 1; i < _arrNewData.length; i++) {
      _arrNewData[i][6] = _arrNewData[i][2] + _arrNewData[i][5]; // EWMASi
    }

    for (var i = 0; i < _arrNewData.length; i++) {
      _arrNewData[i][7] = _interval; // n
      _arrNewData[i][8] = _p.toFixed(6); // p
      _arrNewData[i][9] = 1.96; // k
      _arrNewData[i][10] = (_arrNewData[i][7] * _arrNewData[i][8]) + (_arrNewData[i][9] * Math.sqrt( ( _lambda / (2 - _lambda) ) * (_arrNewData[i][7] * _arrNewData[i][8]) * (1 - _arrNewData[i][8]) ));
      _arrNewData[i][10] = _arrNewData[i][10].toFixed(4); // UCL
      _arrNewData[i][11] = _arrNewData[i][7] * _arrNewData[i][8]; // CL
      _arrNewData[i][12] = (_arrNewData[i][7] * _arrNewData[i][8]) - (_arrNewData[i][9] * Math.sqrt( ( _lambda / (2 - _lambda) ) * (_arrNewData[i][7] * _arrNewData[i][8]) * (1 - _arrNewData[i][8]) ));
      _arrNewData[i][12] = _arrNewData[i][12].toFixed(5); // LCL
      _arrNewData[i][13] = (_arrNewData[i][6] > _arrNewData[i][10]) ? "Out" : (_arrNewData[i][6] < _arrNewData[i][12]) ? "Out" : "In";
    }

    // console.log(_arrNewData.join("\n"));
    // alert("Data sesuai Excel:\n\n" + _arrNewData.join("\n"));

    $('#modChart').on('show.bs.modal', function(event) {
      var source = [];
      for (var i = 0; i < _arrNewData.length; i++) {
        source.push(_arrNewData[i][6]);
      }
      var labels = Array.from({length: _arrNewData.length}, (v, k) => k + 1);
      var target1 = [];
      for (var i = 0; i < _arrNewData.length; i++) {
        target1.push(_arrNewData[i][10]);
      }
      var target2 = [];
      for (var i = 0; i < _arrNewData.length; i++) {
        _arrNewData[i][12] = (_arrNewData[i][12] < 0) ? 0 : _arrNewData[i][12];
        target2.push(_arrNewData[i][12]);
      }
      // Chart initialization
      var modal = $(this);
      var canvas = modal.find('.modal-body canvas');
      var ctx = canvas[0].getContext("2d");
      var chart = new Chart(ctx).Line({
        responsive: true,
        labels: labels,
        datasets: [{
          fillColor: "rgba(151, 187, 205, 0.2)",
          strokeColor: "rgba(151, 187, 205, 1)",
          pointColor: "rgba(151, 187, 205, 1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(151, 187, 205, 1)",
          data: source
        }, {
          fillColor: "rgba(35, 216, 24, 0.2)",
          strokeColor: "#1baf12",
          pointColor: "#1ec714",
          pointStrokeColor: "#1ec714",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "green",
          data: target1
        }, {
          fillColor: "rgba(220, 220, 220, 0.2)",
          strokeColor: "#f7464a",
          pointColor: "#ff5a5e",
          pointStrokeColor: "#ff5a5e",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "red",
          data: target2
        }]
      });
      for (var i = 0; i < chart.datasets[0].points.length; i++) {
        if (chart.datasets[0].points[i].value > _arrNewData[i][10] || chart.datasets[0].points[i].value < _arrNewData[i][12]) {
          chart.datasets[0].points[i].fillColor = "#ff5a5e";
        }
      }
      chart.update();
    }).on('hidden.bs.modal', function(event) {
      var modal = $(this);
      var canvas = modal.find('.modal-body canvas');
      canvas
        .attr('width', '568px')
        .attr('height', '300px');
      $(this).data('bs.modal', null);
    });

    $('#modChart').modal('show');
  };
  reader.readAsText(file);
}

document.getElementById('file').addEventListener('change', getFile, false);
document.getElementById('btnSubmit').addEventListener('click', processData);