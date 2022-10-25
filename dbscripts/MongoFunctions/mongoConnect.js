import { MongoClient } from 'mongodb';
import { listDatabase, listCollections, checkInitCollection, insertIntoCollection } from '../MongoFunctions/mongoFunctions.js';

const connectionstring = "mongodb://127.0.0.1:27017/MOV_OBJ";
const sDatabaseName = "MOV_OBJ";
const sCollectionName = "MOV_REGIONS";
var iHighestNumber = 0;

export async function initMongo() {

    const client = new MongoClient(connectionstring);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        listDatabase(client);

        listCollections(client, sDatabaseName);

        //init MongoDB
        await checkInitCollection(client, sCollectionName, sDatabaseName);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

export async function WriteMongo(inJSON) {

    const client = new MongoClient(connectionstring);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        await SeekLowestNumber(sCollectionName, sDatabaseName);
        await insertIntoCollection(client, sCollectionName, sDatabaseName, iHighestNumber, inJSON);

    } catch (e) {
        console.error(e);
    } finally {
        console.log(inJSON + " write to MongoDb!");
        await client.close();
    }
}


/**
  * Returns highest number of records
  * Write global var 
  * 
  * Promise wird benötigt um auf die Antwort zu warten
  */
async function SeekLowestNumber() {

    let query = {};
    let projection = { projection: { _id: 0, Number: 1 } }
    let sort = { Number: 1 };

    await ReadRecord(query, projection, sort)
        .then(result => {
            iHighestNumber = 0;
            for (let index = 0; index < result.length; index++) {
                if (iHighestNumber == result[index].Number) {
                    iHighestNumber += 1;
                    continue;
                }
                else {
                    break;
                }
            }
        })
}

/** Search MongoDb with Parameters and returns records sorted
 * 
 * @param {property} query have to be in form of: "{Number: 2}"
 * @param {property} projection have to be in form of: "projection: { _id: 0, Number: 0 }"
 * @param {property} sort have to be in form of: { Number: 1 } 1 ascending -1 descending
 * @returns Record as Array sorted 
 */
export async function ReadRecord(query, projection, sort) {
    if (sort != null) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(connectionstring).then(
                (db) => {
                    var dbo = db.db(sDatabaseName);
                    dbo.collection(sCollectionName).find(query, projection).sort(sort).toArray(function (err, result) {
                        if (err) throw err;
                        console.log("Die Suche in " + sDatabaseName + "/" + sCollectionName + " hat ergeben:");
                        console.log(result);
                        db.close();
                        resolve(result);
                    });
                },
                (error) => {
                    console.log(error);
                    reject(error);
                }
            )
        })
    }
    else {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(connectionstring).then(
                (db) => {
                    var dbo = db.db(sDatabaseName);
                    dbo.collection(sCollectionName).find(query, projection).toArray(function (err, result) {
                        if (err) throw err;
                        console.log("Die Suche in " + sDatabaseName + "/" + sCollectionName + " hat ergeben:");
                        console.log(result);
                        db.close();
                        resolve(result);
                    });
                },
                (error) => {
                    console.log(error);
                    reject(error);
                }
            )
        })
    }
}
//#endregion