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
  $('#fileName').html($('#file').val());
}

function processData() {
  var file = files[0];
  var reader = new FileReader();
  reader.onload = function() {
    var _data = this.result;

    // Rata-rata
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

    // Varians
    var _arrDataDiagram2 = CSVToArray(_data);
    // Remove header
    _arrDataDiagram2.splice(0, 1);
	  _arrDataDiagram2.splice(_arrDataDiagram2.length - 1, 1);

    var brixData = [];
    for (var i = 0; i < _arrDataDiagram2.length; i++) {
      brixData.push(_arrDataDiagram2[i][1]);
    }
    var sortedData = brixData.sort((a, b) => {
      return a - b;
    });
    var Q1 = sortedData[Math.ceil((25 / 100) * _arrDataDiagram2.length) - 1];
    var Q3 = sortedData[Math.ceil((75 / 100) * _arrDataDiagram2.length) - 1];
    for (var i = 0; i < _arrDataDiagram2.length; i++) {
      if (_arrDataDiagram2[i][1] < Q1 || _arrDataDiagram2[i][1] > Q3) {
        _arrDataDiagram2[i][1] = 1;
      } else if (_arrDataDiagram2[i][1] === Q1 || _arrDataDiagram2[i][1] === Q3) {
        _arrDataDiagram2[i][1] = 0;
      } else {
        _arrDataDiagram2[i][1] = -1;
      }
    }

    // Get Sigma U
    var _ct = 0;
    for (var i = 1; i <= _arrDataDiagram2.length; i++) {
      var uij = _arrDataDiagram2[i - 1][1];

      _ct += uij;

      _arrDataDiagram2[i - 1][2] = 'x';

      if (i % _interval == 0) {
        _arrDataDiagram2[i - 1][2] = _ct;
        _ct = 0;
      }
    };

    // Filtering for Sigma U = null
    _arrDataDiagram2 = _arrDataDiagram2.filter((x) => {
      return x[2] !== 'x';
    });

    $('#modChart').on('show.bs.modal', function(event) {

      /**
       * Diagram 2
       * Rata-rata
       */
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
      var ctx = canvas[1].getContext("2d");
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
          strokeColor: "black",
          pointColor: "black",
          pointStrokeColor: "black",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "black",
          data: target1
        }, {
          fillColor: "rgba(220, 220, 220, 0.2)",
          strokeColor: "black",
          pointColor: "black",
          pointStrokeColor: "black",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "black",
          data: target2
        }]
      }, {
        pointHitDetectionRadius: 1
      });
      var out_points_top = [],
          out_points_bottom = [];
      for (var i = 0; i < chart.datasets[0].points.length; i++) {
        if (chart.datasets[0].points[i].value > _arrNewData[i][10] || chart.datasets[0].points[i].value < _arrNewData[i][12]) {
          if (chart.datasets[0].points[i].value > _arrNewData[i][10]) out_points_top.push(i + 1);
          else if (chart.datasets[0].points[i].value < _arrNewData[i][12]) out_points_bottom.push(i + 1);
          chart.datasets[0].points[i].fillColor = "#ff5a5e";
        }
      }
      chart.update();
      var txt = "";
      if (out_points_top.length || out_points_bottom.length) {
        txt = "Pada subgrup ke ";

        var all_points = [];
        for (var i = 0; i < out_points_top.length; i++) all_points.push(out_points_top[i]);
        for (var i = 0; i < out_points_bottom.length; i++) all_points.push(out_points_bottom[i]);
        all_points = all_points.sort((a, b) => {
          return a - b;
        });

        for (var i = 0; i < all_points.length; i++) {
          txt += all_points[i];
          if (i !== all_points.length - 1) txt += ", ";
        }
        txt += " menunjukkan bahwa proses pengendalian rata-rata pada subgrup tersebut berada di luar batas kontrol. Oleh karena itu, dapat disimpulkan bahwa proses belum terkendali secara statistik.";
      } else {
        txt = "Proses pengendalian rata-rata pada seluruh subgrup berada di dalam kontrol atau <i>in control</i>. Oleh karena itu, dapat disimpulkan bahwa proses telah terkendali secara statistik.";
      }
      $('#diagram2_desc').html(txt);

      /**
       * Diagram 1
       * Rata-rata
       */
      var source2 = [];
      var out_points_positive = [],
          out_points_negative = [];
      for (var i = 0; i < _arrDataDiagram2.length; i++) {
        if (_arrDataDiagram2[i][2] === _interval) out_points_positive.push(i + 1)
        else if (_arrDataDiagram2[i][2] === (-1 * _interval)) out_points_negative.push(i + 1);
        source2.push(Math.abs(_arrDataDiagram2[i][2]));
      }
      var labels2 = Array.from({length: _arrDataDiagram2.length}, (v, k) => k + 1);
      var target2_1 = [];
      for (var i = 0; i < _arrDataDiagram2.length; i++) {
        target2_1.push(_interval);
      }
      var canvas = modal.find('.modal-body canvas');
      var ctx2 = canvas[0].getContext("2d");
      var chart2 = new Chart(ctx2).Line({
        responsive: true,
        labels: labels2,
        datasets: [{
          fillColor: "rgba(151, 187, 205, 0.2)",
          strokeColor: "rgba(151, 187, 205, 1)",
          pointColor: "rgba(151, 187, 205, 1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(151, 187, 205, 1)",
          data: source2
        }, {
          fillColor: "rgba(35, 216, 24, 0.2)",
          strokeColor: "black",
          pointColor: "black",
          pointStrokeColor: "black",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "black",
          data: target2_1
        }]
      }, {
        pointHitDetectionRadius: 1
      });
      for (var i = 0; i < chart2.datasets[0].points.length; i++) {
        if (chart2.datasets[0].points[i].value >= _interval) {
          chart2.datasets[1].points[i].fillColor = "#ff5a5e";
        }
      }
      chart2.update();
      var txt3 = "";
      if (out_points_positive.length || out_points_negative.length) {
        txt3 = "Pada subgrup ke ";
        
        var all_points = [];
        for (var i = 0; i < out_points_positive.length; i++) all_points.push(out_points_positive[i]);
        for (var i = 0; i < out_points_negative.length; i++) all_points.push(out_points_negative[i]);
        all_points = all_points.sort((a, b) => {
          return a - b;
        });

        for (var i = 0; i < all_points.length; i++) {
          txt3 += all_points[i];
          if (i !== all_points.length - 1) txt3 += ", ";
        }
        txt3 += " menunjukkan bahwa proses pengendalian variabilitas pada subgrup tersebut berada di luar batas kontrol. Oleh karena itu, dapat disimpulkan bahwa proses belum terkendali secara statistik.";
      } else {
        txt3 = "Proses pengendalian variabilitas pada seluruh subgrup berada di dalam kontrol atau <i>in control</i>. Oleh karena itu, dapat disimpulkan bahwa proses telah terkendali secara statistik.";
      }
      $('#diagram1_desc').html(txt3);

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