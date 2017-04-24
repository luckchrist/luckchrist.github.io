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

    var _miu0 = parseInt(document.getElementById('miu0').value);
    var _interval = parseInt(document.getElementById('interval').value);

    var _ct = 0;
    for (var i = 1; i <= _arrData.length; i++) {
      _arrData[i - 1][0] = parseInt(_arrData[i - 1][0]);
      _arrData[i - 1][1] = parseInt(_arrData[i - 1][1]);
      _arrData[i - 1][2] = _miu0;

      var _brix = parseInt(_arrData[i - 1][1]);
      if (_brix < _arrData[i - 1][2]) _arrData[i - 1][3] = 0;
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

    alert("Data sesuai Excel:\n\n" + _arrData.join("\n"));
  };
  reader.readAsText(file);
}

document.getElementById('file').addEventListener('change', getFile, false);
document.getElementById('btnSubmit').addEventListener('click', processData);