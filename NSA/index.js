var express = require('express');
var app = express();
var osu = require('node-os-utils');
var cpu = osu.cpu;
var drive = osu.drive;
var mem = osu.mem;
var proc = osu.proc;

let data = {
    cpuUsage: {},
    driveInfo: {},
    memInfo: {},
    procOpen: {}
};


function collectData() {
    cpu.usage().then(info => {
        data.cpuUsage[Date.now()] = info;
        console.log(info);
    })
    drive.info().then(info => {
        data.driveInfo[Date.now()] = info;
        console.log(info);
    })
    mem.info().then(info => {
        data.memInfo[Date.now()] = info;
        console.log(info);
    })
    proc.totalProcesses().then(info => {
        data.procOpen[Date.now()] = info;
        console.log(info);
    })
}
setInterval(collectData, 10*1000);

app.get('/data', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(data));
});

app.listen(12012);