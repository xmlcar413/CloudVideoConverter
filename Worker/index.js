const argv = require('yargs').argv;
var hbjs = require('handbrake-js');
var path = require('path');
var Queue = require('bull');
var fs = require('fs');
const weedClient = require("@wabg/node-seaweedfs");

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
var thonkCluster = [{host: thonkIP1, port: thonkPort} ,{host: thonkIP2, port: thonkPort},{host: thonkIP3, port: thonkPort}];

var workQueue = new Queue('work', {redis: {port: redisPort, host: redisIP}, prefix:'{myprefix}'});

let seaweedfs = new weedClient({
    server: seaweedIP,
    port: seaweedPort,
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


workQueue.process(function(job, done){
    console.log('Got job');
	console.log(job.data.filename);
	console.log(job.data.convertTo);
    async function extracted() {
        console.log("inne");
        seaweedfs.read(job.data.fsID).then(function (videoFile) {
            console.log("GOT THE FILE");
            var fileLocation = "./preEncoded/" + job.data.filename;
            fs.writeFile(fileLocation, videoFile, function (err) {
                if (err) {
                    console.log(err);
                    done(err);
                    return;
                }
                console.log("The file was saved!");
                var newFilename = path.parse(job.data.filename).name + "." + job.data.convertTo;
                var encodedFileLocation = "./encoded/" + newFilename;

                hbjs.spawn({input: fileLocation, output: encodedFileLocation})
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
                        seaweedfs.write(encodedFileLocation, {ttl: '10m'}).then((fileInfo) => {
                            thonk.table('userFiles').filter(thonk.row("userID").eq(job.data.user).and(thonk.row("jobID").eq(job.data.jobID))).update({
                                state: "Done",
                                jobFinished: Date.now(),
                                fileInfo: {
                                    id: fileInfo,
                                    filename: newFilename
                                }
                        }).run().then( function(result) {
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
                        }).catch((err) => {
                            console.log(err)
                            // error handling
                        });
                    }).catch((err) => {
                        console.log(err)
                        // error handling
                    });
                })
        });
    }).catch(function (err) {
            console.log(err)
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
            //error handling
        });
    }
    extracted().then(()=>{
    });


});

