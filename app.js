var express 	= require('express');
var http 		= require('http');
var path 		= require('path');
var util		= require('./util.js');
var fs			= require('fs');
var ocr 		= require('nodecr');
var sys 		= require('sys');
var exec 		= require('child_process').exec;

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('pipeline'));
app.use(express.session());
app.use(express.compress());
app.use(express.limit('2mb'));
app.use(app.router);
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res) {
	res.render('index');
});

app.post('/upload', function(req, res) {
	console.log('Getting image');
	fs.readFile(req.files.image.path, function(err, data) {

		var imageName = req.files.image.name;

		if(!imageName) {
			console.log('Error occured during upload.')
			res.render('index', {
				error: 'Error during upload.'
			});			
		} else {
			var uploadedImage = __dirname + '/uploads/' + imageName;
			console.log('Uploaded image: ' + uploadedImage);
			fs.writeFile(uploadedImage, data, function(err) {
				console.log('Redirecting user..');
				res.redirect('/open/' + imageName);
			});
		}
	});
});

app.get('/open/:image', function(req, res) {
	
    var image = req.params.image;
    var lang = 'eng';
	var originalImage = util.imagePath + image;
	var tempImage = util.tempPath + "input_" + new Date().getTime() + '.tif';
	
	exec('convert ' + originalImage + ' -resize 200% -type Grayscale ' + tempImage, function (err, stdout, stderr) { 
		sys.puts(stdout);
		ocr.process(tempImage, function(err, text) {
			if (err) {
				console.log(err);
				res.render('open', {
					error: 'Could not find the image.'
				});
			} else {
				var response = util.getUrl(text);
				if(response == null) {
					res.render('open', {
						error: 'Could not find URL from the image.'
					});
				} else {
					res.render('open', {
						success: response
					});	
				}
				util.removeImages();
			} 
		});
	});
});


http.createServer(app).listen(app.get('port'), function() {
	console.log('On port: ' + app.get('port'));
});
