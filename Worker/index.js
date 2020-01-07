const argv = require('yargs').argv;
var hbjs = require('handbrake-js');
var path = require('path');
var Queue = require('bull');
var fs = require('fs');
var thonk = require('rethinkdb');
const weedClient = require("@wabg/node-seaweedfs");

var redisIP = argv.redisIP || "localhost";
var redisPort = argv.redisPort || 6379;

var seaweedIP = argv.seaweedIP || "localhost";
var seaweedPort = argv.seaweedPort || 9333;

var thonkIP = argv.thonkIP || "localhost";
var thonkPort = argv.thonkPort || 28015;

var workQueue = new Queue('work', {redis: {port: redisPort, host: redisIP}, prefix:'{myprefix}'});

const seaweedfs = new weedClient({
    server: seaweedIP,
    port: seaweedPort,
});



var connection = null;
thonk.connect( {host: thonkIP, port: thonkPort}, function(err, conn) {
    if (err){
        console.log(err);
        throw err;
    }
    connection = conn;
});



workQueue.process(function(job, done){
    console.log('Got job');
	console.log(job.data.filename);
	console.log(job.data.convertTo);
    seaweedfs.read(job.data.fsID).then(function(videoFile) {
        console.log("GOT THE FILE")
        var fileLocation = "./preEncoded/"+job.data.filename;
        fs.writeFile(fileLocation, videoFile, function(err) {
            if(err) {
                console.log(err);
                done(err);
                return;
            }
            console.log("The file was saved!");
            var newFilename = path.parse(job.data.filename).name +"."+job.data.convertTo;
            var encodedFileLocation = "./encoded/"+ newFilename;

            hbjs.spawn({ input: fileLocation, output: encodedFileLocation})
                .on('error', err => {
                    console.log(err);
                    done(err);
                })
                .on('progress', progress => {
                    job.progress(progress.percentComplete);
                    console.log(
                        'Percent complete: %s, ETA: %s',
                        progress.percentComplete,
                        progress.eta
                    );
                })
                .on('complete', () => {
                    seaweedfs.write(encodedFileLocation).then((fileInfo) => {
                        thonk.table('userFiles').filter(thonk.row("userID").eq(job.data.user).and(thonk.row("jobID").eq(job.data.jobID))).
                        update({
                            state: "Done",
                            jobFinished: Date.now(),
                            fileInfo: {
                                id: fileInfo,
                                filename: newFilename
                                }
                        }).run(connection, function(err, result) {
                            if (err){
                                console.log(err);
                                throw err;
                            }
                            console.log(JSON.stringify(result, null, 2));
                            done();
                            fs.unlink(fileLocation,function(err){
                                if (err){
                                    console.log(err);
                                }
                            });
                            fs.unlink(encodedFileLocation,function(err){
                                if (err){
                                    console.log(err);
                                }
                            });
                            seaweedfs.remove(job.data.fsID).then(function() {
                                console.log("removed file");
                            }).catch(function(err) {
                                console.log("could not remove: " + job.data.fsID + " error: " + err);
                            });
                            console.log('Work complete');
                        });
                    }).catch((err) => {
                        console.log(err)
                        // error handling
                    });
                })
        });
    }).catch(function(err) {
        console.log(err)
        //error handling
    });

});

