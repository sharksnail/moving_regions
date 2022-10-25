var max_date, min_date;
var mov_region;
var x_factor = 0;
var y_factor = 0;
//---------------------------------------------------------------------------
// Parsing Code

// main function to convert data
function parsing(string) 
{
    var canvas = $('#canvas');
    var ctx = canvas[0].getContext('2d');

    let str = string.trim();
    let obj_split= strToObject(str, [], 0, str.lastIndexOf('(', str.length));
    if(obj_split)
    {
        if(checkComponents(str))
        {
            obj_split[0] = obj_split[0].replace(',', '\" \: \"');
            obj_split = converting(obj_split);

            var obj_string = obj_split.toString();
            obj_string = replaceCharacters(obj_string);
            console.log(obj_string);
            if(obj_string.includes('}}{{')) {
                obj_string = getMovingHole(obj_string);
            }
            obj_string = regexSearch(obj_string);
            console.log(obj_string);
            try {
                a = JSON.parse(obj_string);
            } catch(e) {
                printAlert();
                return undefined;
            }
            mov_region = JSON.parse(obj_string.toString());

            setStartEndpoint(mov_region);
            
            mov_region = addBoundingBox(mov_region);
            mov_region["NestedList"] =  str ;
            
            obj_string = JSON.stringify(mov_region);
            ctx.clearRect(0,0, canvas[0].width, canvas[0].height);
            console.log(obj_string);
            return obj_string;
        }
        else {
            return undefined;
        }
    }
    else 
        return undefined;
}
function printAlert()
{
    alert("Incorrect Input. Submit valid data."); 
}
function setStartEndpoint(mov_region)
{
    min_date = Date.parse(mov_region.time_lapses[0].starttime)/1000;
    max_date = Date.parse(mov_region.time_lapses[mov_region.time_lapses.length-1].endtime)/1000;
}

function addBoundingBox(moving_region) 
{
    var minmax = rescale(moving_region);
        
    moving_region["boundingbox"] = {};
    moving_region.boundingbox["x_min"] = minmax[0]; 
    moving_region.boundingbox["x_max"] = minmax[1];
    moving_region.boundingbox["y_min"] = minmax[2];
    moving_region.boundingbox["y_max"] = minmax[3];

    return moving_region;
}


function getMovingHole(moving_object)
{
    var reg = /}{2}{{2}/g;
    var match;    
    var hole = [];
    while ((match = reg.exec(moving_object)) != null) {
        hole.push(match.index);
        match = null;
    }
    var regExpr = /\"[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])-(2[0-3]|[01][0-9]):[0-5][0-9]?:?[0-5]?[0-9]?"|TRUE|FALSE/g;
    var timelapse = [];
    while ((match = regExpr.exec(moving_object)) != null) {
        timelapse.push(match.index);
    }
    var timeObject = [];
    for(var index = 0; index < hole.length; index++)
    {
        for(var ind = 0; ind<timelapse.length; ind++)
        {
            if((timelapse[ind] < hole[index] && timelapse[ind+1] > hole[index]) || (timelapse[ind]<hole[index] && timelapse[ind] == timelapse[timelapse.length-1]))
            {
                timeObject.push([hole[index], timelapse[ind]]);
            }
            else continue;
        }
    }
    for(var index = timeObject.length-1; index >=0; index--)
    {
        if(index == 0)
        {
            moving_object = moving_object.replaceAt(timeObject[index][0], '},{"moving_hole":[{');
        }
        else
        {
            if(timeObject[index][1] == timeObject[index-1][1]) 
            {
                moving_object = moving_object.replaceAt(timeObject[index][0], '}]},{"moving_hole":[{');
            }
            else
            {
                moving_object = moving_object.replaceAt(timeObject[index][0], '},{"moving_hole":[{');
            }
        }
    }
    moving_object = moving_object.replaceAll('}]}]},{\"starttime\"', '}]}]}]},{\"starttime\"');

    moving_object = moving_object + ']}';
    return moving_object;
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index+3 + this.substring.length-1);
}

function replaceCharacters(string)
{
    console.log(string);
    string = string.replaceAll(',(', '(');
    string = string.replaceAll(' ', '');
    string = string.replaceAll('" "', '","');
    
    string = string.replaceAll('(', '{');
    string = string.replaceAll(')', '}');
    string = string.replace('{{{"start', ',"time_lapses":[{"start');
     
    string = string.replaceAll('{{{{"x1', '"regions":[{"region":[{"x1'); // start der Gruppen
    string = string.replaceAll('}}{{{"x1',']},{"region":[{"x1'); //neue Gruppe innerhalb Zeitraum
    string = string.replaceAll('}}}}{{"start',']}]},{"start'); //neuer Zeitraum
    string = string.replace('}}}}}}}','}]}]}]}');
    console.log(string);
    return string;
}
function rescale(mov_region) {
    var min_max = [];
    var fs = 0;
    for(var index = 0; index < mov_region.time_lapses.length; index++)
    {
        for(var ind = 0; ind < mov_region.time_lapses[index].regions.length; ind++)
        {
            for(var i  = 0; i<mov_region.time_lapses[index].regions[ind].region.length; i++)
            {   
                if(fs == 0)
                {
                    min_max[0] = (mov_region.time_lapses[index].regions[ind].region[i].x1 < mov_region.time_lapses[index].regions[ind].region[i].x2) ? mov_region.time_lapses[index].regions[ind].region[i].x1 : mov_region.time_lapses[index].regions[ind].region[i].x2;
                    min_max[1] = (mov_region.time_lapses[index].regions[ind].region[i].x1 > mov_region.time_lapses[index].regions[ind].region[i].x2) ? mov_region.time_lapses[index].regions[ind].region[i].x1 : mov_region.time_lapses[index].regions[ind].region[i].x2;
                    min_max[2] = (mov_region.time_lapses[index].regions[ind].region[i].y1 < mov_region.time_lapses[index].regions[ind].region[i].y2) ? mov_region.time_lapses[index].regions[ind].region[i].y1 : mov_region.time_lapses[index].regions[ind].region[i].y2;
                    min_max[3] = (mov_region.time_lapses[index].regions[ind].region[i].y1 > mov_region.time_lapses[index].regions[ind].region[i].y2) ? mov_region.time_lapses[index].regions[ind].region[i].y1 : mov_region.time_lapses[index].regions[ind].region[i].y2;
                    fs = 1;
                    continue;
                }            
                if(min_max[0] > mov_region.time_lapses[index].regions[ind].region[i].x1)
                min_max[0] = mov_region.time_lapses[index].regions[ind].region[i].x1;
                if(min_max[1] < mov_region.time_lapses[index].regions[ind].region[i].x1)
                min_max[1] = mov_region.time_lapses[index].regions[ind].region[i].x1;

                if(min_max[0] > mov_region.time_lapses[index].regions[ind].region[i].x2)
                min_max[0] = mov_region.time_lapses[index].regions[ind].region[i].x2;
                if(min_max[1] < mov_region.time_lapses[index].regions[ind].region[i].x2)
                min_max[1] = mov_region.time_lapses[index].regions[ind].region[i].x2;

                if(min_max[2] > mov_region.time_lapses[index].regions[ind].region[i].y1)
                min_max[2] = mov_region.time_lapses[index].regions[ind].region[i].y1;
                if(min_max[3] < mov_region.time_lapses[index].regions[ind].region[i].y1)
                min_max[3] = mov_region.time_lapses[index].regions[ind].region[i].y1;

                if(min_max[2]  > mov_region.time_lapses[index].regions[ind].region[i].y2)
                min_max[2]  = mov_region.time_lapses[index].regions[ind].region[i].y2;
                if(min_max[3]  < mov_region.time_lapses[index].regions[ind].region[i].y2)
                min_max[3] = mov_region.time_lapses[index].regions[ind].region[i].y2;
            }
        }
    }
    return(min_max);
}

function regexSearch(string) 
{
    console.log(string);
    var regex = /"[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])-/g;
    var times;
    var tr;
    var str;
    if(string.match(regex))
    {
        times = string.match(regex);
        tr = string.match(regex);
    }
    for(index = 0; index < tr.length; index++)
    {
        tr[index] = tr[index].slice(0,-1);
        tr[index] = tr[index]+' ';
    }
     
      for(var index = 0; index < times.length; index++)
      {
          string = string.replace(times[index], tr[index]);
      }
      console.log(string);
    return string;
}

function checkComponents(object) //check whether object contains all required components
{    
    if(/object/i.test(object))
    {
        if(/\(\)/.test(object))
        {
            if(/"[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])-?(2[0-3]?|[01]?[0-9]?):?[0-5]?[0-9]?:?[0-5]?[0-9]?"/.test(object)) //zeitraum
            {
                if(/-?\d+\.?\d*/.test(object)) // all required are present
                {
                    return true;
                }
                else
                {return(exitProgram(1)); }
            }
            else
            { return(exitProgram(1)); }
        }
        else
        {return(exitProgram(1));}
    }
    else
    { return(exitProgram(1)); }
}

function exitProgram(err) {
    window.alert("Incorrect Input. Enter valid data.");
    return false;
}

function getAllIndexes(arr) {
    var indexes =[], i = 0;
    for(i = 0;i<arr.length; i++)
    {
        if(arr[i].length < 2)
            indexes.unshift(i);
    }
    return indexes;
}

function getIndexesRegEx(arr, regex) {
    var regEx = new RegExp(regex, 'gi');
    var index = [];
    var match;
    while((match = regEx.exec(arr)) != null)
    {
        index.push(match[0]);
    }
    return index;
}

function replaceDigits(array)
{
    var arr = array;
    var ind = getIndexesRegEx(arr, / -?\d+\.?\d*/);
    var count = 1; 
    for(var i = 0; i<ind.length; i++)
    {
        if(i%2 === 0) 
        { 
            arr[i] = arr[i].replace(arr[i], '\"x'+ count+'\" : ' + arr[i]);
        }
        else
        {
            arr[i] = arr[i].replace(arr[i], '\"y'+ count+'\" : ' + arr[i]);
            count++;
        }
    }
    return arr;
}


function replaceTimelapse(elem)
{
    var element = elem;
    var array = getIndexesRegEx(element, /"[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])?-?(2[0-3]|[01][0-9])?:?[0-5][0-9]?:?[0-5]?[0-9]?"|TRUE|FALSE/);
    var regex = /"[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])-(2[0-3]|[01][0-9])?:?[0-5][0-9]?:?[0-5]?[0-9]?"/;

    if(!regex.test(array[0])) 
    {
        var new_time = array[0].slice(0,-1); 
        new_time = new_time + '-00:00"';
        array[0] = new_time;
    }

    if(!regex.test(array[1]))
    {
        var new_time = array[1].slice(0,-1); 
        new_time = new_time + '-23:59"';
        array[1] = new_time;
    }
    array[0] = array[0].replace(array[0], '\"starttime\":'  + (array[0]));
    array[1] = array[1].replace(array[1], '\"endtime\":' + (array[1]));
    array[2] = array[2].replace(array[2], '\"start_incl\":' + array[2].toLowerCase());
    array[3] = array[3].replace(array[3], '\"end_incl\":' + array[3].toLowerCase());
    element = '('+array+')';

    return element;
}

function replDigit(str)
{
    var string = str;
    var arr = getIndexesRegEx(string, /-?\d+\.?\d*/);

    var l = 1;
    for(var i = 0; i<arr.length;i++)
    {
        if(i%2 === 0)
        {
            arr[i] = arr[i].replace(arr[i], '\"x'+l+'\" : ' + arr[i]);
        }
        else
        {
            arr[i] = arr[i].replace(arr[i], '\"y'+l+'\" : ' + arr[i]);
            l++;
        }
    }
    var count = str.split(')').length-1;
    var bracket = ')';
    for(var i = 1; i<count;i++)
    {
        bracket = bracket + ')';
    }
    if(count === 1) 
    {
        bracket += ',';
    }
    string = '(' + arr + bracket;
    return string;
}
function strToObject(str, object_div, alpha, last)
{
    for(let i = 0; i<=str.length; i++) // load string into object
    {
        if(str[i] === '(' )
        {
            let a = str.substr(alpha, i-alpha);
            
            if(a.length > 0) 
            {
                object_div.push(a);
                alpha = i;
            }
        }
        if(i === last)// last opening bracket
        {
            object_div.push(str.substr(alpha, str.length-1));   
        }
    }
    console.log(object_div);
    var string = removeBlanks(object_div);
    if(string.length === 0)
    {
        return(exitProgram(1));
    }
    console.log(string);
    return string;
}

function removeBlanks(object_div)
{
    for(var index = 0; index <object_div.length; index++)
    {
        object_div[index] = object_div[index].trim();
        object_div[index] = object_div[index].replaceAll('( ', '(');
        object_div[index] = object_div[index].replaceAll(' )', ')');
        object_div[index] = object_div[index].replaceAll(/[ ]+/g, '\,');
    }
    return object_div;
}

function converting(object_div)
{
    for(var index = 0; index < object_div.length; index++)
    {
        if(object_div[index].match(/object/i))
        {
            object_div[index] = object_div[index].replace(/object/i, '\"objectname');
            object_div[index] = object_div[index] + '\"';
            
        }
        else if(object_div[index].match(/\(\)/))
        {
            object_div[index] = object_div[index].replace(/\(\)/, '\"objecttype\" \: \"');
            object_div[index] = object_div[index].replace(',', '');
            object_div[index] = object_div[index] + '\"';
        }
        else if(object_div[index].match(/"[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])?-?(2[0-3]|[01][0-9])?:?[0-5][0-9]?:?[0-5]?[0-9]?"/)) //zeitraum
        {
            object_div[index] = replaceTimelapse(object_div[index]);
            object_div[index] = object_div[index].replace(')', ',');
        }
        else if(object_div[index].match(/-?\d+\.?\d*/ ))
        {
            object_div[index] = replDigit(object_div[index]); 
        }
    }
    console.log(object_div);
    return object_div;
}

function checkEndings(moving_region)
{
    timetosec = new Array();
    for(var pos = 0; pos < moving_region.time_lapses.length;pos++)
    {
        timetosec.push([Date.parse(moving_region.time_lapses[pos].starttime)/1000, Date.parse(moving_region.time_lapses[pos].endtime)/1000]);
        
        if(!moving_region.time_lapses[pos].start_incl)
        {
            timetosec[timetosec.length-1][0] += 1;
        }
        if(!moving_region.time_lapses[pos].end_incl)
        {
            timetosec[timetosec.length-1][1] -= 1;
        }
    }
    return timetosec;
}

function setPropertiesSlider(moving_region)
{
    min = Date.parse(moving_region.time_lapses[0].starttime)/1000;
    max = Date.parse(moving_region.time_lapses[moving_region.time_lapses.length-1].endtime)/1000;
    
    $('.slider-time').html(moving_region.time_lapses[0].starttime);
    $("#slider-range").slider("option", "min", min);
    $("#slider-range").slider("option", "max", max);
    $("#slider-range").slider("option", "value", min);
    $('.slider-time').show();
}

// -------------------------------------------------------

var dt_from = 0;
var dt_to = 0;


var min_val = Date.parse(0)/1000;
var max_val = Date.parse(0)/1000;
var diff = max_val-min_val;


function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function formatDT(__dt) 
{
    var year = __dt.getFullYear();
    var month = zeroPad(__dt.getMonth()+1, 2);
    var date = zeroPad(__dt.getDate(), 2);
    var hours = zeroPad(__dt.getHours(), 2);
    var minutes = zeroPad(__dt.getMinutes(), 2);
    var seconds = zeroPad(__dt.getSeconds(), 2);
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
};

function startObject(mov_region)
{ 
    mov_region = JSON.parse(mov_region);
    var canvas = $('#canvas');
    var ctx = canvas[0].getContext('2d');
    ctx.fillStyle = '#000000';

    var x_factor = canvas[0].width/(mov_region.boundingbox.x_max-mov_region.boundingbox.x_min);
    var y_factor = canvas[0].height/(mov_region.boundingbox.y_max- mov_region.boundingbox.y_min);
    
    for(var ind = 0; ind < mov_region.time_lapses[0].regions.length; ind++) 
    {
        ctx.beginPath();
        var x_initial = mov_region.time_lapses[0].regions[ind].region[0].x1;
        var y_initial = mov_region.time_lapses[0].regions[ind].region[0].y1;
        
        var x = shiftX(x_initial, mov_region.boundingbox.x_min)*x_factor;
        var y = shiftY(y_initial, mov_region.boundingbox.y_max)*y_factor;
        ctx.moveTo(x, y);

        for(var index = 1; index < mov_region.time_lapses[0].regions[ind].region.length; index++)
        {
            if(mov_region.time_lapses[0].regions[ind].region[index].x1 != undefined) 
            {
                var newX = shiftX(mov_region.time_lapses[0].regions[ind].region[index].x1, mov_region.boundingbox.x_min)*x_factor;
                var newY = shiftY(mov_region.time_lapses[0].regions[ind].region[index].y1, mov_region.boundingbox.y_max)*y_factor;
                
                ctx.lineTo(newX,newY);
            }
            else 
            {
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle='white';
                var x_initial = mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].x1;
                var y_initial = mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].y1;
                var x = shiftX(x_initial, mov_region.boundingbox.x_min)*x_factor;
                var y = shiftY(y_initial, mov_region.boundingbox.y_max)*y_factor;
                ctx.moveTo(x,y);
                for(var ind_hole = 1; ind_hole < mov_region.time_lapses[0].regions[ind].region[index].moving_hole.length; ind_hole++)
                {
                    var newX = shiftX(mov_region.time_lapses[0].regions[ind].region[index].moving_hole[ind_hole].x1, mov_region.boundingbox.x_min)*x_factor;
                    var newY = shiftY(mov_region.time_lapses[0].regions[ind].region[index].moving_hole[ind_hole].y1, mov_region.boundingbox.y_max)*y_factor;
                    
                    ctx.lineTo(newX,newY);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

function shiftX(coordinate, minimum)
{
    return (coordinate - minimum);
}

function shiftY(coordinate, maximum)
{
    return (maximum-coordinate);
}

function moveObject(mov_region, diff, val, tl) 
{
    var canvas = $('#canvas');
    var ctx = canvas[0].getContext('2d');

    mov_region = JSON.parse(mov_region);

    var x_factor = canvas[0].width/(mov_region.boundingbox.x_max-mov_region.boundingbox.x_min);
    var y_factor = canvas[0].height/(mov_region.boundingbox.y_max- mov_region.boundingbox.y_min);

    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
    ctx.fillStyle = '#000000';
    
    for(var ind = 0; ind < mov_region.time_lapses[tl].regions.length; ind++) 
    {
        ctx.beginPath();
        var difference = mov_region.time_lapses[tl].regions[ind].region[0].x2-mov_region.time_lapses[tl].regions[ind].region[0].x1;
        var x_initial = mov_region.time_lapses[tl].regions[ind].region[0].x1;
        var newx = shiftX(difference/diff*val + x_initial, mov_region.boundingbox.x_min)*x_factor;
        var newy = shiftY((mov_region.time_lapses[tl].regions[ind].region[0].y2-mov_region.time_lapses[tl].regions[ind].region[0].y1)/diff*val + mov_region.time_lapses[tl].regions[ind].region[0].y1, mov_region.boundingbox.y_max)*y_factor;
        ctx.moveTo(newx, newy);

        for(var index = 1; index < mov_region.time_lapses[tl].regions[ind].region.length; index++)
        {
            if(mov_region.time_lapses[tl].regions[ind].region[index].x1 != undefined) 
            {
                var newx = shiftX((mov_region.time_lapses[tl].regions[ind].region[index].x2-mov_region.time_lapses[tl].regions[ind].region[index].x1)/diff*val + mov_region.time_lapses[tl].regions[ind].region[index].x1, mov_region.boundingbox.x_min)*x_factor;
                var newy = shiftY((mov_region.time_lapses[tl].regions[ind].region[index].y2-mov_region.time_lapses[tl].regions[ind].region[index].y1)/diff*val + mov_region.time_lapses[tl].regions[ind].region[index].y1, mov_region.boundingbox.y_max)*y_factor;
                ctx.lineTo(newx, newy);
            }
            else //inner region exists
            {
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle='white';

                var differenceX = mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].x2 - mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].x1;
                var differenceY = mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].y2 - mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].y1;

                var x_initial = mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].x1;
                var y_initial = mov_region.time_lapses[0].regions[ind].region[index].moving_hole[0].y1;

                var newX = shiftX(differenceX/diff*val + x_initial, mov_region.boundingbox.x_min)*x_factor;
                var newY = shiftY(differenceY/diff*val + y_initial, mov_region.boundingbox.y_max)*y_factor;
                ctx.moveTo(newX, newY);

                for(var ind_hole = 1; ind_hole < mov_region.time_lapses[0].regions[ind].region[index].moving_hole.length; ind_hole++)
                {
                    var newx = shiftX((mov_region.time_lapses[tl].regions[ind].region[index].moving_hole[ind_hole].x2-mov_region.time_lapses[tl].regions[ind].region[index].moving_hole[ind_hole].x1)/diff*val + mov_region.time_lapses[tl].regions[ind].region[index].moving_hole[ind_hole].x1, mov_region.boundingbox.x_min)*x_factor;
                    var newy = shiftY((mov_region.time_lapses[tl].regions[ind].region[index].moving_hole[ind_hole].y2-mov_region.time_lapses[tl].regions[ind].region[index].moving_hole[ind_hole].y1)/diff*val + mov_region.time_lapses[tl].regions[ind].region[index].moving_hole[ind_hole].y1, mov_region.boundingbox.y_max)*y_factor;
                   
                    ctx.lineTo(newx,newy);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

function clearCanvas()
{
    var canvas = $('#canvas');
    var ctx = canvas[0].getContext('2d');

    ctx.clearRect(0,0, canvas[0].width, canvas[0].height);

    $('.slider-time').hide();

    
    //document.getElementById("object").value="";
    
}


function drawObject(mov_object, difference, value, timelapse)
{
    if(value == 0)
    {
        startObject(mov_object);
    }
    else
    {
        moveObject(mov_object, difference, value, timelapse);
    }

}