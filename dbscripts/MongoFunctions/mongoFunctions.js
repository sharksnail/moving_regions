import { ObjectID } from "bson";
import { MongoClient } from 'mongodb';
/**
  * Write all Databases from a Mongoclient to debug log.
  * 
  * @param {MongoClient}client The conneted Mongoclient.
  */
export async function listDatabase(client) {
  const databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

/**
  * Write all Collections of a Databases from a Mongoclient to debug log.
  * 
  * @param {MongoClient}client The connected Mongoclient.
  * @param {string}sDatabaseName Name of Database, which collections should be print to debug
  */
export async function listCollections(client, sDatabaseName) {
  const collList = await client.db(sDatabaseName).collections();

  console.log("Datacollections of " + sDatabaseName + " :");
  collList.forEach(coll => console.log(` - ${coll.collectionName}`));
};

/**
  * Check if a by name selected Collection exist in selected Databases from a Mongoclient.
  * If i don't exist, it will be created.
  * 
  * @param {MongoClient}client The conneted Mongoclient.
  * @param {string}sDatabaseName Name of Database, which collection should be searched
  * @param {string}sCollectionName Name of collections, which should be created / checked
  */
export async function checkInitCollection(client, sCollectionName, sDatabaseName) {
  const collList = await client.db(sDatabaseName).collections();

  var datacollectionExist = Boolean(false)

  collList.forEach(Collection => {
    if (Collection.collectionName === sCollectionName) {
      console.log("Datacollection " + sCollectionName + " in " + sDatabaseName + " already exist!");
      datacollectionExist = Boolean(true);
    }
  });
  if (datacollectionExist === Boolean(false)) {
    await client.db().createCollection(sCollectionName);
    await client.db(sDatabaseName).collection(sCollectionName).createIndex( {"objectname" : 1, "time_lapses.starttime" : 1, "time_lapses.endtime" : 1} ,{ unique: true });
    console.log("Datacollection " + sCollectionName + " in " + sDatabaseName + " created!")
  }

};
/**
  * Insert object in selected Collection and selected Databases from a Mongoclient.
  * 
  * @param {MongoClient}client The conneted Mongoclient.
  * @param {string}sDatabaseName Name of Database
  * @param {string}sCollectionName Name of collections
  * @param {int}Number Number of record
  */
export async function insertIntoCollection(client, sCollectionName, sDatabaseName,Number, data1) {
  var object = JSON.parse(data1);
  object['Number'] = Number;
  console.log(object, "json sample  ");
  await client.db(sDatabaseName).collection(sCollectionName).insertOne(object, {upsert: true})
};