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
	res.sendFile(__dirname + '/data/'+ req.params.place +'/' + req.params.city + '.json');
});

app.get('/csv/:place/:city', function(req,res) {
	res.sendFile(__dirname + '/data/'+ req.params.place +'/' + req.params.city + '_'+req.params.place +'.csv');
});

app.get('/pull/daycares/:city', function(req,res) {
	var city = req.params.city.replace("+", "");

	pullDaycares(req.params.city, function(data) {
		// res.send(data);
		jsonfile.writeFile('./data/daycares/'+ city +'.json', data, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});

		var fields = ['name', 'address', 'lat', 'lng'];
		var opts = {fields};

		try {
			var parser = new json2csv(opts);
			var csv = parser.parse(data);
			
			fs.writeFile("./data/daycares/" + city + "_daycares.csv", csv, function(err) {
				if(err) console.log(err);
				console.log('$$csv file wrote$$');
			});
		} catch(err) {
			console.log(err);
		}	
	});

	res.sendFile(__dirname + '/data/daycares/' + city + '.json');
});

app.get('/pull/playgrounds/:city', function(req,res) {
	var city = req.params.city.replace("+", "");

	pullPlaygrounds(req.params.city, function(data) {
		jsonfile.writeFile('./data/playgrounds/'+ city +'.json', data, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});

		var fields = ['name', 'address', 'lat', 'lng'];
		var opts = {fields};

		try {
			var parser = new json2csv(opts);
			var csv = parser.parse(data);
			
			fs.writeFile("./data/playgrounds/" + city + "_playgrounds.csv", csv, function(err) {
				if(err) console.log(err);
				console.log('$$csv file wrote$$');
			});
		} catch(err) {
			console.log(err);
		}
	});

	res.sendFile(__dirname + '/data/playgrounds/' + city + '.json');
});

app.get('/pull/schools/:city', function(req,res) {
	var city = req.params.city.replace("+", "");

	// axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=schools+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {
	// 	console.log(res.data);
	// }).catch(function(err) {
	// 	console.log(err);
	// });

	pullSchools(req.params.city, function(data) {
		jsonfile.writeFile('./data/schools/'+ city +'.json', data, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});

		var fields = ['name', 'address', 'lat', 'lng'];
		var opts = {fields};

		try {
			var parser = new json2csv(opts);
			var csv = parser.parse(data);
			
			fs.writeFile("./data/schools/" + city + "_schools.csv", csv, function(err) {
				if(err) console.log(err);
				console.log('$$csv file wrote$$');
			});
		} catch(err) {
			console.log(err);
		}
	});

	res.sendFile(__dirname + '/data/schools/' + city + '.json');
});

app.get('/pull/churches/:city', function(req,res) {
	var city = req.params.city.replace("+", "");

	pullChurches(req.params.city, function(data) {
		jsonfile.writeFile('./data/churches/'+ city +'.json', data, {spaces: 1}, function(err) {
			if(err) console.log(err);
			console.log('$$json file wrote$$');
		});

		var fields = ['name', 'address', 'lat', 'lng'];
		var opts = {fields};

		try {
			var parser = new json2csv(opts);
			var csv = parser.parse(data);
			
			fs.writeFile("./data/churches/" + city + "_churches.csv", csv, function(err) {
				if(err) console.log(err);
				console.log('$$csv file wrote$$');
			});
		} catch(err) {
			console.log(err);
		}
	});

	res.sendFile(__dirname + '/data/churches/' + city + '.json');
});

app.get('/pull/youth/:city', function(req,res) {
	var city = req.params.city.replace("+", "");
	var c = req.params.city;
	pullYouthCenters(c, function(data) {
		console.log('youth',data.length);
		pull('ymca', c, function(y_data) {
			data = data.concat(y_data);
			console.log(data.length);

			pull('dance', c, function(d_data) {
				data = data.concat(d_data);
				console.log(data.length);

				pull('music', c, function(m_data) {
					data = data.concat(m_data);
					console.log(data.length);

					pull('martial+arts', c, function(ma_data) {
						data = data.concat(ma_data);
						console.log('Final:',data.length);

						jsonfile.writeFile('./data/youth/'+ city +'.json', data, {spaces: 1}, function(err) {
							if(err) console.log(err);
							console.log('$$json file wrote$$');
						});

						var fields = ['name', 'address', 'lat', 'lng'];
						var opts = {fields};

						try {
							var parser = new json2csv(opts);
							var csv = parser.parse(data);
							
							fs.writeFile("./data/youth/" + city + "_youth.csv", csv, function(err) {
								if(err) console.log(err);
								console.log('$$csv file wrote$$');
							});
						} catch(err) {
							console.log(err);
						}						
					});
				});
			});

		});

	});
	res.sendFile(__dirname + '/data/youth/' + city + '.json');
});

function pullSchools(city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=schools+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		if(res.data.next_page_token) {
			setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
				// console.log(data.next_page_token);
				array = array.concat(trimData(data.results));
				console.log(array.length);			

				if(data.next_page_token) {
					setTimeout(nextPull, 2000, data.next_page_token, function(data) {
						array = array.concat(trimData(data.results));
						console.log(array.length);
						callback(array);
					});;
				} else callback(array);
			});
		} else callback(array);		
	}).catch(function(err) {
		console.log(err);
	});
}

function pullYouthCenters(city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=youth+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		if(res.data.next_page_token) {
			setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
				// console.log(data.next_page_token);
				array = array.concat(trimData(data.results));
				console.log(array.length);			

				if(data.next_page_token) {
					setTimeout(nextPull, 2000, data.next_page_token, function(data) {
						array = array.concat(trimData(data.results));
						console.log(array.length);
						callback(array);
					});;
				} else callback(array);
			});
		} else callback(array);		
	}).catch(function(err) {
		console.log(err);
	});	
}

function pullRecreation(city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=recreation+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
			// console.log(data.next_page_token);
			array = array.concat(trimData(data.results));
			console.log(array.length);			

			if(data.next_page_token) {
				setTimeout(nextPull, 2000, data.next_page_token, function(data) {
					array = array.concat(trimData(data.results));
					console.log(array.length);
					callback(array);
				});;
			} else callback(array);
		});
		
	}).catch(function(err) {
		console.log(err);
	});
}

function pull(place ,city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query='+place+'+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
			// console.log(data.next_page_token);
			array = array.concat(trimData(data.results));
			console.log(place ,array.length);			

			if(data.next_page_token) {
				setTimeout(nextPull, 2000, data.next_page_token, function(data) {
					array = array.concat(trimData(data.results));
					console.log(array.length);
					callback(array);
				});;
			} else callback(array);
		});
		
	}).catch(function(err) {
		console.log(err);
	});
}

function pullDaycares(city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=daycares+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
			// console.log(data.next_page_token);
			array = array.concat(trimData(data.results));
			console.log(array.length);			

			if(data.next_page_token) {
				setTimeout(nextPull, 2000, data.next_page_token, function(data) {
					array = array.concat(trimData(data.results));
					console.log(array.length);
					callback(array);
				});;
			} else callback(array);
		});
		
	}).catch(function(err) {
		console.log(err);
	});
}

function pullPlaygrounds(city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=playgrounds+in+'+ city +'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		if(res.data.next_page_token) {
			setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
				// console.log(data.next_page_token);
				array = array.concat(trimData(data.results));
				console.log(array.length);			

				if(data.next_page_token) {
					setTimeout(nextPull, 2000, data.next_page_token, function(data) {
						array = array.concat(trimData(data.results));
						console.log(array.length);
						callback(array);
					});;
				} else callback(array);
			});
		} else callback(array);		
	}).catch(function(err) {
		console.log(err);
	});
}

function pullChurches(city, callback) {
	var array = [];
	var token;

	axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=churches+in+'+city+'&key=AIzaSyDXZvj1FluJA4hcQcLHflLgqcXi2eKEpAE').then( function(res) {

		array = trimData(res.data.results);
		if(res.data.next_page_token) {
			setTimeout(nextPull, 2000, res.data.next_page_token, function(data) {
				// console.log(data.next_page_token);
				array = array.concat(trimData(data.results));
				console.log(array.length);			

				if(data.next_page_token) {
					setTimeout(nextPull, 2000, data.next_page_token, function(data) {
						array = array.concat(trimData(data.results));
						console.log(array.length);
						callback(array);
					});;
				} else callback(array);
			});
		} else callback(array);		
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

function trimData(array) {
	var newArray = [];
	array.map(obj => {
		var location = {
			"name": obj.name,
			"address": obj.formatted_address,
			"lat": obj.geometry.location.lat,
			"lng": obj.geometry.location.lng
		}
		newArray.push(location);
	});
	return newArray;
}

setInterval(function() {
    axios.get('https://data-fetcher1.herokuapp.com/json/schools/encinitas').then( function(res) {
	}).catch(function(err) {
		console.log(err);
	}); 
}, 600000);