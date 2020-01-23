const express = require("express");
const path = require('path');
const bookingRouter = require("./router.js")
const app = express();
const MongoClient = require("mongodb").MongoClient;
const process = require('process');
const url = process.env.connectionString;
//const url = "mongodb://localhost:27017/";
app.use(express.static('public')); //express generator
var tablesCount = 0; 
getTablesCount(function(count){
	tablesCount = count;
});

function getTablesCount(callback){
	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err)
			return console.log(err);

		const db = client.db("TableBooking");
		const collection = db.collection("config");

		collection.find().toArray(function(err, result){
			client.close();
			return callback(result[0].tables);
		});
	});
}

app.use("/free_tables/:date", function(request, response){
	var date = request.params.date;
	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err)
			return console.log(err);

		const db = client.db("TableBooking");
		const collection = db.collection("booking");
		
		console.log(tablesCount);
		var freeTables = [];
		for(var i = 1; i <= tablesCount; i++){
			freeTables.push(Number(i));
		} 
		freeTables.sort(function(a,b){ 
  			return a - b
		});
		collection.find({bookDate: date}).toArray(function(err, results){
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
	console.log(request.params);
	var email = request.params.email;
	var date = request.params.date;
	var time = request.params.time;
	var table = request.params.table;

	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err)
			return console.log(err);

		const db = client.db("TableBooking");
		const collection = db.collection("booking");

		collection.find({bookDate: date, bookedTable: table}).toArray(function(err, results){
			if (results.length == 0){
				let booking = {email: email, bookDate: date, bookTime: time, bookedTable: table};
				
				collection.insertOne(booking, function(err, result){
			        if(err){ 
			            console.log(err);
			        }
			        console.log(result.ops);
			    });
				response.end("Ok");
			}
			else {
				response.end("No")
			}
			client.close();
		});
	});
});

app.use("/", bookingRouter);

app.listen(process.env.PORT || 5000);