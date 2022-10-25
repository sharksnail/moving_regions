import { initMongo, ReadRecord, WriteMongo } from "./dbscripts/MongoFunctions/mongoConnect.js";
import express from 'express';
import path, { dirname } from 'path';
initMongo();

global
const app = express()

app.use(express.json({limit: '50mb', extended: true}));
app.use(express.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.static('public'));
app.get('/', (req, res) => {
  var options = {
    root: path.join(dirname('index.html'))
  };
  Console.log("GET Request Called, path: " + req.path);
  res.sendFile('index.html', options);
});

app.post('*', async (req, res) => {

  var query, projection, sort;

  switch (req.body.msg) {

    case "WriteMongo":
      
      WriteMongo(req.body.moving_region);
      
      break;

    case "RecordsForCombobox":

      query = {};
      projection = { projection: { _id: 0, Number: 1, objectname: 1} };
      sort = { Number: 1 };
      res.json(await ReadRecord(query, projection, sort));
      break;

    case "RecordsForTimefilter":
      projection = { projection: { _id: 0, Number: 1, objectname: 1, objecttype: 1 } };

      if(req.body.date_max.length == 0)
      {
        query = { "time_lapses.starttime" : { $gte: req.body.date_min}}
      } 
      else if (req.body.date_min.length == 0)
      {
        query = {"time_lapses.endtime" : {$lt: req.body.date_max}} 
      }
      else {
        query = { "time_lapses.starttime" : { $gte: req.body.date_min}, "time_lapses.endtime" : {$lt: req.body.date_max}}
      }
      console.log(query);
      res.json(await ReadRecord(query, projection));
      break;

    case "LoadRecord":
      query = { Number: req.body.NumberToLoad };
      projection = { projection: { _id: 0, Number: 0} };
      res.json(await ReadRecord(query, projection));

      break;

      // "latitude" : x_coordinate, "longitude" : y_coordinate}
    case "RecordsFilterLocation":
      projection = { projection: { _id: 0, Number: 1, objectname: 1} };

      var x_coordinate = req.body.latitude;
      var y_coordinate = req.body.longitude;
      var x = req.body.x_;
      console.log(x, x_coordinate, y_coordinate);
      console.log(typeof x_coordinate)
      if(x_coordinate.length == 0)
      {
        query = { "boundingbox.y_min" : { $lt: y_coordinate }, "boundingbox.y_max" : { $gte: y_coordinate } }
      }
      else if(y_coordinate.length == 0)
      {
        query = { "boundingbox.x_min" : { $lt: x_coordinate }, "boundingbox.x_max" : { $gte: x_coordinate } }
      }
      else
      {
        query = { "boundingbox.y_min" : { $lt: y_coordinate }, "boundingbox.y_max" : { $gte: y_coordinate }, "boundingbox.x_min" : { $lt: x_coordinate }, "boundingbox.x_max" : { $gte: x_coordinate }}
      }
      console.log(query);
      res.json(await ReadRecord(query, projection));
      break;

    default:
      console.console.warn("Message not defined!\nPOST Request Called, path: " + req.path + "\nwith message: " + req.body.msg);
      break;
  }
  console.log("POST Request Called, path: " + req.path + "\nwith message: " + req.body.msg);
});

app.listen(3000, () => {
  console.log('Our express server is up on port 3000');
});