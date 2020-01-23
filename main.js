const express = require("express");
const path = require('path');
const bookingRouter = require("./router.js")
const app = express();
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";

app.use("/free_tables/:date", function(request, response){
	var date = request.params.date;
	const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

	mongoClient.connect(function(err, client){
		if(err)
			return console.log(err);

		const db = client.db("booking");
		const collection = db.collection("booking");

		var freeTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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

		const db = client.db("booking");
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

app.listen(3000);