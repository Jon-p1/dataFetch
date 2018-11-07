// server 1.1

var axios = require('axios');
var jsonfile = require('jsonfile');
var json2csv = require('json2csv').Parser;
var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log('On port:', PORT);
});
app.use(express.static(path.join(__dirname, '/data')));


app.get('/json/:place/:city', function(req,res) {
	res.sendFile(__dirname + '/data/'+ req.params.city +'_' + req.params.place + '.json');
});

app.get('/csv/:place/:city', function(req,res) {
	res.sendFile(__dirname + '/data/'+ req.params.city +'_' + req.params.place +'.csv');
});

// Uses axios to create get request from google places api to request data
// After 5 seconds of initiating scrape will display the resulted data unless an error occurs
// TODO: pagination, display file structure
app.get('/pull/:place/:city', function(req,res) {
	console.log(req.params);
	pull(req.params.place, req.params.city, (data, use, city) => {
		
		var file_name = './data/'+ city +'_'+ use;

		jsonfile.writeFile(file_name + '.json', data, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});

		var fields = ['name', 'address', 'lat', 'lng', 'type', 'id'];
		var opts = {fields};

		try {
			var parser = new json2csv(opts);
			var csv = parser.parse(data);
			
			fs.writeFile(file_name + '.csv', csv, function(err) {
				if(err) console.log(err);
				console.log('$$csv file wrote$$');
			});
		} catch(err) {
			console.log(err);
		}		
	});	

	setTimeout(function() {
		res.sendFile(__dirname + '/data/'+ req.params.city +'_' + req.params.place + '.json');
	}, 5000);
});

// Can pull any type of use
// example: pull(schools, 'sandiego', callback())
function pull(place ,city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query='+place+'+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results, array.length, place);
		console.log(place ,array.length);
		setTimeout(nextPull, 1500, res.data.next_page_token, function(data) {
			// console.log(data.next_page_token);
			array = array.concat(trimData(data.results, array.length, place));
			console.log(place,2, array.length);			

			if(data.next_page_token) {
				setTimeout(nextPull, 1500, data.next_page_token, function(data) {
					array = array.concat(trimData(data.results, array.length, place));
					console.log(place,3,array.length);
					callback(array, place, city);
				});
			} else callback(array, place, city);
		});
	}).catch(function(err) {
		console.log(err);
	});
}

function nextPull(token, callback) {
	
	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=' + token +'&key=AIzaSyBQqJMkzek_Y3ixvQ18QIy-Yv8BlGj1sGQ').then( function(res) {
		callback(res.data)
	}).catch(function(err) {
		console.log(err);
	}); 
}

function trimData(array, arrayLength, place) {
	var newArray = [];
	if(arrayLength === 0) arrayLength = 1;
	var i = arrayLength;
	array.map(obj => {
		var location = {
			"name": obj.name,
			"address": obj.formatted_address,
			"lat": obj.geometry.location.lat,
			"lng": obj.geometry.location.lng,
			"type": place,
			"id": i
		}
		i++;
		newArray.push(location);
	});
	return newArray;
}