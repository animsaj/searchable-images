var express = require("express");
var request = require("request");
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASSWORD + '@ds157539.mlab.com:57539/images_searchable');
var app = express();
app.use("/", express.static(__dirname + '/public'));

//mongoose setup
var querySchema = new mongoose.Schema({
    name: String,
    created: Date
});
var Query = mongoose.model("Query", querySchema);

//ROUTES
//imagesearch route
app.get("/imagesearch/:query(*)", function (req, res) {
    var q = req.params.query;
    var start = req.query.offset;
    var url = "";
    if(start) {
        url = 'https://www.googleapis.com/customsearch/v1?key=' + process.env.CSE_API_KEY + '&cx=' + process.env.CSE_ID + '&searchType=image&q=' + q + '&start=' + start;
    } else {
        url = 'https://www.googleapis.com/customsearch/v1?key=' + process.env.CSE_API_KEY + '&cx=' + process.env.CSE_ID + '&searchType=image&q=' + q;
    }
    var requestObject = {
        uri: url,
        method: 'GET',
        timeout: 10000
    };
    request(requestObject, function (error, response, body) {
        if(error) {
            throw (error); 
        } else {
            Query.create({ name: q, created: new Date(Date.now()) }, function (err, queryCreated) {
                if(err) {
                    console.log(err);
                }else {
                    console.log(queryCreated);
                }
            });
            var itemsArr = JSON.parse(body).items;
            var resArr = [];
            itemsArr.forEach(function (item) {
                var img = {
                    title: item.title,
                    url: item.link
                }
                resArr.push(img);
            });
            res.send(resArr);
        }
    });
});
//recent route
app.get("/recent", function (req, res) {
    Query.find({}, { _id: 0, __v: 0 }).sort({ created: -1 }).limit(10).exec().catch(function (err) {
            console.log(err);}).then(function (queries) {
                res.send(queries);
        });  
});

app.listen(process.env.PORT || 3000, function () {
    console.log("App is running...");
});

