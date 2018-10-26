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

// daycares in json
app.get('/json/daycares/:id', function(req,res) {
	res.sendFile(__dirname + '/data/' + req.params.id+ '.json');
});

//schools in json
app.get('/json/schools/:id', function(req,res) {
	res.sendFile(__dirname + '/data/schools/' + req.params.id+ '.json');
});

//daycares in csv for arcgis weblayers
app.get('/csv/daycares/:id', function(req,res) {
	res.sendFile(__dirname + '/data/' + req.params.id+ '.csv');
});

//schools in csv for weblayers
app.get('/csv/schools/:id', function(req,res) {
	res.sendFile(__dirname + '/data/schools/' + req.params.id+ '.csv');
});

// querys google places api
app.get('/pull/daycares/:city', function(req,res) {
	var city = req.params.city.replace("+", "");

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=daycares+in+'+ req.params.city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {
		pullData(res.data.results, city, 'daycare');
	}).catch(function(err) {
		console.log(err);
	});

	res.sendFile(__dirname + '/data/' + city + '.json');
});

app.get('/pull/schools/:city', function(req,res) {
	var city =req.params.city.replace("+", "");

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=elementary+in+'+ req.params.city +'&key=AIzaSyBQqJMkzek_Y3ixvQ18QIy-Yv8BlGj1sGQ').then( function(res) {
		pullData(res.data.results, city, 'school');
	}).catch(function(err) {
		console.log(err);
	});	
	res.sendFile(__dirname + '/data/schools/' + city + '.json');
});

function pullData(data, city, place) {
	var array = [];

	// maps over incoming data
	// creates object with neccessary data and pushes to array
	data.map(local => {
		var obj = {
			"name" : local.name,
			"address" : local.formatted_address,
			"lat": local.geometry.location.lat,
			"lng": local.geometry.location.lng
		}
		array.push(obj);
	});
	
	// writes json file
	if(place === 'school') {
		jsonfile.writeFile('./data/schools/'+ city +'.json', array, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});
	} else if (place === 'daycare') {
		jsonfile.writeFile('./data/'+ city +'.json', array, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});
	}

	// jsonfile.writeFile('./data/'+ city +'.json', array, {spaces: 1}, function(err) {
	// 	if(err) console.log(err);
	// 	console.log('$$json file wrote$$');
	// });

	var fields = ['name', 'address', 'lat', 'lng'];
	var opts = {fields};

	try {
		var parser = new json2csv(opts);
		var csv = parser.parse(array);
		
		// fs.writeFile("./data/" + city + ".csv", csv, function(err) {
		// 	if(err) console.log(err);
		// 	console.log('file wrote');
		// });

		// writes csv
		if(place === 'school') {
			fs.writeFile("./data/schools/" + city + ".csv", csv, function(err) {
				if(err) console.log(err);
				console.log('file wrote');
			});
		} else if (place === 'daycare') {
			fs.writeFile("./data/" + city + ".csv", csv, function(err) {
				if(err) console.log(err);
				console.log('file wrote');
			});
		}
	} catch(err) {
		console.log(err);
	}
}

/* convert json file to csv with json2csv npm via commandline
$ json2csv -i input.json -f carModel,price,color -o out.csv
json2csv -i sd_data.json -f name,address,lat,lng -o sd_data.csv

SAMPLE QUERY
axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=daycares+in+San+Diego&key=AIzaSyBQqJMkzek_Y3ixvQ18QIy-Yv8BlGj1sGQ').then( function(res) {
	pullData(res.data.results);
}).catch(function(err) {
	console.log(err);
});

INVALID
axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=' + res.data.next_page_token +'&key=AIzaSyBQqJMkzek_Y3ixvQ18QIy-Yv8BlGj1sGQ').then( function(res) {
	// pullData(data, res.data.results, req.params.city);
	console.log(res.data);
}).catch(function(err) {
	console.log(err);
}); 

1. data
2. server
3. json/csv
4. routes
*/

// 