const express = require("express");
const path = require('path');
const process = require('process');
const bookingRouter = require("./router.js")
const app = express();
const MongoClient = require("mongodb").MongoClient;
const url = process.env.connectionString;

function getTablesCount(callback){
	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err)
			return log(err);

		const db = client.db("TableBooking");
		const collection = db.collection("config");

		collection.find().toArray(function(err, result){
			client.close();
			return callback(result[0].tables);
		});
	});
}

function log(info){
  	var currentDate = Date(Date.now()).toString() 
	console.log(`${currentDate}\n ${info}`);
}


app.use(express.static('public'));

var tablesCount = 0;

getTablesCount(function(count){
	log(`Tables count: ${count}`);
	tablesCount = count;
});


app.use("/free_tables/:date", function(request, response){
	log(`Request: ${request.params}`);
	var date = request.params.date;
	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err){
			log(`Error connecting in db: ${err}`);
		}

		const db = client.db("TableBooking");
		const collection = db.collection("booking");
		
		log(tablesCount);
		var freeTables = [];
		for(var i = 1; i <= tablesCount; i++){
			freeTables.push(Number(i));
		} 
		freeTables.sort(function(a,b){ 
  			return a - b
		});
		collection.find({bookDate: date}).toArray(function(err, results){
			if(err){ 
				log(`Error finding in db: ${err}`);
			}

			var bookedTables = results.map(x => Number(x.bookedTable));
			for(var i = 0; i < freeTables.length; i++){ 
				if (bookedTables.includes(freeTables[i])) {
					freeTables.splice(i, 1); 
				}
			}
			response.end(JSON.stringify(freeTables));
			client.close();
		});
	});
});

app.use("/book/:email/:date/:time/:table", function (request, response) {
	log(`Request: ${request.params}`);
	var email = request.params.email;
	var date = request.params.date;
	var time = request.params.time;
	var table = request.params.table;

	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err){
			log(`Error connecting in db: ${err}`);
		}

		const db = client.db("TableBooking");
		const collection = db.collection("booking");

		collection.find({bookDate: date, bookedTable: table}).toArray(function(err, results){
			if(err){ 
				log(`Error finding in db: ${err}`);
			}

			if (results.length == 0){
				let booking = {email: email, bookDate: date, bookTime: time, bookedTable: table};
				
				collection.insertOne(booking, function(err, result){
			        if(err){ 
			            log(`Error inserting into db: ${err}`);
			        }

			        log(`Inserted: ${result.ops}`);
			    });
				response.end("Ok");
				log("Responded Ok")
			}
			else {
				response.end("Responded No")
			}
			client.close();
		});
	});
});

app.use("/", bookingRouter);

app.listen(process.env.PORT || 5000);