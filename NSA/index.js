var express = require('express');
var app = express();
var osu = require('node-os-utils');
var cpu = osu.cpu;
var drive = osu.drive;
var mem = osu.mem;
var proc = osu.proc;

let data = {
    cpuUsage: [],
    driveInfo: [],
    memInfo: [],
    procOpen: []
};

const arrayLength = 360;
function collectData() {
    cpu.usage().then(info => {
        data.cpuUsage[data.cpuUsage.length] = {info:info,date:Date.now()};
        if(data.cpuUsage.length > arrayLength){
            data.cpuUsage = data.cpuUsage.slice(1);
        }
    })
    drive.info().then(info => {
        data.driveInfo[data.driveInfo.length] = {info:info,date:Date.now()};
        if(data.driveInfo.length > arrayLength){
            data.driveInfo = data.driveInfo.slice(1);
        }
    })
    mem.info().then(info => {
        data.memInfo[data.memInfo.length] = {info:info,date:Date.now()};
        if(data.memInfo.length > arrayLength){
            data.memInfo = data.memInfo.slice(1);
        }
    })
    proc.totalProcesses().then(info => {
        data.procOpen[data.procOpen.length] = {info:info,date:Date.now()};
        if(data.procOpen.length > arrayLength){
            data.procOpen = data.procOpen.slice(1);
        }
    })
}
setInterval(collectData, 10*1000);

app.get('/data', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(data));
});

app.listen(12012);