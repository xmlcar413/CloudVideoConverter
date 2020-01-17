const argv = require('yargs').argv;
const uuidv4 = require('uuid/v4');
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = new express();
const multer  = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieMiddleware = require('./middleware/userCookie');
const weedClient = require("@wabg/node-seaweedfs");

var hostPort = argv.hostPort || 8008;
var hostIP =  argv.hostIP || '0.0.0.0';

var redisIP = argv.redisIP || "localhost";
var redisPort = argv.redisPort || 6379;

var seaweedIP = argv.seaweedIP || "localhost";
var seaweedIP2 = argv.seaweedIP2 || "localhost";
var seaweedIP3 = argv.seaweedIP3 || "localhost";
var seaweedPort = argv.seaweedPort || 9333;

var thonkIP1 = argv.thonkIP1 || "localhost";
var thonkIP2 = argv.thonkIP2 || "localhost";
var thonkIP3 = argv.thonkIP3 || "localhost";
var thonkPort = argv.thonkPort || 28015;


var thonkCluster = [{host: thonkIP1, port: thonkPort}, {host: thonkIP2, port: thonkPort}, {host: thonkIP3, port: thonkPort}];
var thonkTableOptions =  {shards: 1, replicas: 3};

var Queue = require('bull');

var workQueue = new Queue('work', {redis: {port: redisPort, host: redisIP}, prefix:'{myprefix}'});


app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

let seaweedfs = new weedClient({
    server:    seaweedIP,
    port:    seaweedPort,
});
let seaweedfs2 = new weedClient({
    server:    seaweedIP2,
    port:    seaweedPort,
});
let seaweedfs3 = new weedClient({
    server:    seaweedIP3,
    port:    seaweedPort,
});
let switchedMaster = false;


var thonk = require('rethinkdbdash')({
    servers: thonkCluster
});

thonk.dbCreate('test').run().then(function(result) {
    createTable();
}).catch((err)=> {
    if (err.msg === 'Database `test` already exists.'){
        createTable();
    }else{

    }
    console.log(err.msg)
});

function createTable(){
    thonk.db('test').tableCreate('userFiles', thonkTableOptions).run().then(function(result) {
        console.log(JSON.stringify(result, null, 2));
    }).catch((err)=> {
        if(err.msg === "Table `test.userFiles` already exists."){

        }
        else{
            console.log(err);
            throw err;
        }
    });
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname , 'uploads/'))
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname)
    }
});
 
const upload = multer({storage : storage});
    
app.use(cookieParser());
app.use(cookieMiddleware());        
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/private/html/index.html'));
});

app.post('/file-upload', upload.single('file'), (req, res) => {
    console.log(`File-uploaded`);
    var jobId = uuidv4();

    async function extracted() {
        console.log("inne");
        seaweedfs.write(req.file.path).then((fileInfo) => {
            console.log(fileInfo.fid);
            console.log(`File uploaded`);
            console.log(req.file.path);

            thonk.table('userFiles').insert({
                jobID: jobId,
                userID: req.cookies._uid,
                jobCreated: Date.now(),
                jobFinished: -1,
                state: "created",
                fileInfo: {}
            }).run().then(function(result) {
                console.log(JSON.stringify(result, null, 2));
            }).catch((err)=> {
                console.log(err)
            });
            workQueue.add({
                fsID: fileInfo.fid,
                jobID: jobId,
                videoPath: req.file.path,
                filename: req.file.filename,
                user: req.cookies._uid,
                //filename: path.parse(req.file.filename).name,
                convertTo: req.body.convertTo
            }).then(() => {
                console.log("Added job")
            });
            fs.unlink(req.file.path, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }).then(()=>{
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve({data: '123'});
                }, 250);
            });
        }).catch((err) => {
            console.log(err);
            console.log("asd");

            if (switchedMaster === false) {
                let tempSeaweed = seaweedfs;
                seaweedfs = seaweedfs2;
                seaweedfs2 = tempSeaweed;
            } else if (switchedMaster === true) {
                let tempSeaweed = seaweedfs;
                seaweedfs = seaweedfs3;
                seaweedfs3 = tempSeaweed;
            }
            switchedMaster = !switchedMaster;
            extracted();
            // error handling
        });
    }

    extracted().then(()=>{
        if(req.file){
            res.redirect('downloads?jobId='+jobId);

        }else{
            res.json({
                uploaded : false
            })
        }
    });

});

app.get('/downloads', function(request, response) {
    response.sendFile(path.join(__dirname + '/private/html/downloads.html'));
});

app.get('/downloadList', function(req, res) {
    thonk.db('test').table('userFiles').filter(thonk.row("userID").eq(req.cookies._uid)).run().then(function(result) {
        console.log(JSON.stringify(result, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result, null, 2));
    }).catch((err)=> {
        console.log(err)
    });
});

app.post('/downloadFile', function(req, res) {
    console.log(req.body);
    var fileLocation = "./temp/"+req.body.filename;
    seaweedfs.read(req.body.fileID).then(function(videoFile) {
        fs.writeFile(fileLocation, videoFile, function(err) {
            if (err) {
                console.log(err);
                return;
            }
            res.download(fileLocation, req.body.filename, function(err){
                //CHECK FOR ERROR
                console.log(err);
                fs.unlink(fileLocation,function(err){
                    console.log(err);
                });
            });

        });
    }).catch(function(err) {
        console.log(err);
        thonk.table("userFiles").get(req.body.id).delete().run().then(function(result) {
            console.log(JSON.stringify(result, null, 2));
        }).catch((err)=> {
            console.log(err)
        });
    });
});

app.get('/test', function(request, response) {

    thonk.db('test').table('userFiles').run().then(function(result) {
        console.log(JSON.stringify(result, null, 2));
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(result, null, 2));
    }).catch((err)=> {
        console.log(err)
    });
});

app.listen(hostPort, hostIP);
console.log(`Running on http://${hostIP}:${hostPort}`);
