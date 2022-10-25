var moving_region = {};
var timeinseconds = new Array();
var downloadObject = {};
var text = '';
async function loadFile(file) {
  text = await file.text();
}
function startScript() {
  moving_region = {};
  timeinseconds = [];
  if(text.length==0) {
    console.log(text);
    text = document.querySelector("#object").value.toString();
    var textarea = document.getElementById('object');
    textarea.value = '';
  }
  console.log(text);
  moving_region = parsing(text);
  clearInputFile();
  console.log(moving_region);
  timeinseconds = checkEndings(JSON.parse(moving_region));

  if (moving_region == undefined) {
    document.querySelector("#object").value = '';
    return;
  }
  setPropertiesSlider(JSON.parse(moving_region));
  console.log(moving_region);
  const data = { moving_region };
  data['msg'] = "WriteMongo";
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },//
    body: JSON.stringify(data)
  };
  fetch('/', options)
  startObject(moving_region);
  getRecordNames('cb3');
}

$("#slider-range").slider({
    min: 0,
    max: 0,
    step: 1,
    value: 0, 
    slide: function (e, ui) {
      var canvas = $("canvas");
      var ctx = canvas[0].getContext('2d');
        var difference;
        for(var index = 0; index < timeinseconds.length; index++) 
        {
            if(ui.value <= timeinseconds[index][1]) 
            {
                if(ui.value >= timeinseconds[index][0])
                {
                    difference = timeinseconds[index][1] - timeinseconds[index][0];   // maximum - minimum         
                    var dt_cur_from = new Date(ui.value*1000); //format("yyyy-mm-dd hh:ii:ss");
                    
                    $('.slider-time').html(formatDT(dt_cur_from));
                    var tss = ui.value-timeinseconds[index][0]; // seconds since start
                    
                    drawObject(moving_region, difference, tss, index)
                    break;
                }
            }
            ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
        }
    }
});

function getRecordNames(combobx) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msg: "RecordsForCombobox" })
  };
  fetch('/', options)
    .then(raw => raw.json())
    .then(data => {
      console.log("Empfangene Daten nach POST request:");
      console.log(data);
      var combobox = document.getElementById(combobx);
      //Ablöschen Einträge
      while (combobox.options.length > 0) {
        combobox.remove(0);
      }
      if (data.length == 0) {
        var toAdd = document.createElement('option');
        toAdd.text = "Kein Datensatz vorhanden!";
        toAdd.value = 0;
        combobox.add(toAdd);
      }
      else {
        for (let index = 0; index < data.length; index++) {
          var toAdd = document.createElement('option');
          var tl = "time_lapses.starttime";
          console.log(data);
          toAdd.text = data[index].Number + " " + data[index].objectname;
          toAdd.value = data[index].Number;
          combobox.add(toAdd);
        }
      }
    });
}
function ShowObject(string) {
  console.log("show");
  var combobox = document.getElementById(string);
  var json = { "msg": "LoadRecord", "NumberToLoad": parseInt(combobox.value) }
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json)
  };
  fetch('/', options)
    .then(raw => raw.json())
    .then(data => {
      console.log("Empfangene Daten nach POST request:");
      console.log(data);
      moving_region = JSON.stringify(data[0]);
      timeinseconds = checkEndings(JSON.parse(moving_region));
      clearCanvas();
      setPropertiesSlider(JSON.parse(moving_region));
      startObject(moving_region);
    });
}
function LoadRecord(object) {
  var combobox = document.getElementById('cb1');
  var json = { "msg": "LoadRecord", "NumberToLoad": parseInt(combobox.value) }
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json)
  };
  fetch('/', options)
    .then(raw => raw.json())
    .then(data => {
      console.log("Empfangene Daten nach POST request:");
      console.log(data);
      moving_region = JSON.stringify(data[0]);
      timeinseconds = checkEndings(JSON.parse(moving_region));
      clearCanvas();
      setPropertiesSlider(JSON.parse(moving_region));
      startObject(moving_region);
    });
}
function LoadRecordforDownload(el) 
{
  console.log(el);
  var combobox = document.getElementById('cb3');
  var json = { "msg": "LoadRecord", "NumberToLoad": parseInt(combobox.value) }
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json)
  };
  fetch('/', options)
    .then(raw => raw.json())
    .then(data => {
      console.log("Empfangene Daten nach POST request:");
      console.log(data);
      
    console.log(data[0]);
    downloadObject = JSON.stringify(data[0]);
    const radioButtons = document.querySelectorAll('input[name="format"]');
  
  let selectedFormat;
  for(const radioButton of radioButtons)
  {
    if(radioButton.checked)
    {
      selectedFormat = radioButton.value;
      break;
    }
  }
  var object = JSON.parse(downloadObject); // Objekt in JSON
  console.log(selectedFormat);
  if(selectedFormat == 'NestedList')
  {
    downloadString(object.NestedList, "text/txt", object.objectname+'.txt');
  }
  else if(selectedFormat == 'JSON')
  {  
    delete object.NestedList;
    downloadJSON(JSON.stringify(object), object.objectname+'.json', 'text/plain');
  }
  else
  {
    alert("No format selected! Select one. ")
  }
    });
}
function loading(string)
{
  console.log(string);
  var object = JSON.parse(string);
  downloadString(object.NestedList, "text/txt", "object.txt");
}
function LoadObjectsbyTime() {
  var dt_min = document.getElementById('timemin');
  var dt_max = document.getElementById('timemax');
  var combobox = document.getElementById('cb2');
  // to get right format: YYYY-MM-DD HH:MM:SS
  var dtmin = dt_min.value.replace('T', ' ');
  var dtmax = dt_max.value.replace('T', ' ');
  
  var json = { "msg" : "RecordsForTimefilter", "date_min" : dtmin, "date_max" : dtmax}
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json)
  };
  fetch('/', options)
  .then(raw => raw.json())
  .then(data => {
    console.log("Empfangene Daten nach POST Request:");
    console.log(data);
    while (combobox.options.length > 0) {
      combobox.remove(0);
    }
    if (data.length == 0) {
      var toAdd = document.createElement('option');
      toAdd.text = "Kein Datensatz vorhanden!";
      toAdd.value = 0;
      combobox.add(toAdd);
    }
    else {
      for (let index = 0; index < data.length; index++) {
        var toAdd = document.createElement('option');
        toAdd.text = data[index].Number + " " + data[index].objectname;
        toAdd.value = data[index].Number;
        combobox.add(toAdd);
      }
    }
  })
}

function LoadObjectsbyLoc()
{
  var x_coordinate = document.getElementById('x');
  var y_coordinate = document.getElementById('y');
  var combobox = document.getElementById('cb3');
  var json = { "msg" : "RecordsFilterLocation", "latitude" : parseInt(x_coordinate.value), "longitude" : parseInt(y_coordinate.value)}
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json)
  };
  fetch('/', options)
  .then(raw => raw.json())
  .then(data => {
    console.log("Empfangene Daten nach POST Request:");
    console.log(data);
    while (combobox.options.length > 0) {
      combobox.remove(0);
    }
    if (data.length == 0) {
      var toAdd = document.createElement('option');
      toAdd.text = "Kein Datensatz vorhanden!";
      toAdd.value = 0;
      combobox.add(toAdd);
    }
    else {
      for (let index = 0; index < data.length; index++) {
        var toAdd = document.createElement('option');
        toAdd.text = data[index].Number + " " + data[index].objectname;
        toAdd.value = data[index].Number;
        combobox.add(toAdd);
      }
    }
  })
}

function openClass(event, listType)
{
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for(i = 0; i<tabcontent.length; i++)
  {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) 
  {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(listType).style.display ="block";
  if(listType == 'List')
  {
    getRecordNames('cb1');
  }
  else if(listType == 'Load') {
    getRecordNames('cb3');
  }
  event.currentTarget.className += " active";
}

function download(el)
{
  console.log("Hakko");
  const radioButtons = document.querySelectorAll('input[name="format"]');
  
  let selectedFormat;
  for(const radioButton of radioButtons)
  {
    if(radioButton.checked)
    {
      selectedFormat = radioButton.value;
      break;
    }
  }
  var object = JSON.parse(downloadObject); // Objekt in JSON
  console.log(selectedFormat);
  if(selectedFormat == 'NestedList')
  {
    downloadString(object.NestedList, "text/txt", object.objectname+'.txt');
  }
  else if(selectedFormat == 'JSON')
  {  
    delete object.NestedList;
    downloadJSON(object, object.objectname+'.json', 'text/plain');
    
    console.log(object);
  }
}

function downloadString(text, fileType, fileName) {
    var blob = new Blob([text], { type: fileType });
    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
}

function downloadJSON(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function clearInputFile(){
  var f = document.querySelector('#file-selector');
  text='';
  if(f.value){
      try{
          f.value = '';
      }catch(err){
      }
      if(f.value){ 
          var form = document.createElement('form'), ref = f.nextSibling;
          form.appendChild(f);
          form.reset();
          ref.parentNode.insertBefore(f,ref);
      }
  }
}