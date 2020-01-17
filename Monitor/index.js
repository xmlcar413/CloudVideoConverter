const argv = require('yargs').argv;
const uuidv4 = require('uuid/v4');
var express = require('express');
var session = require('express-session');
const http = require('http');
var bodyParser = require('body-parser');
var path = require('path');
var instancesConfig = require('./Instances/instances');
const Compute = require('@google-cloud/compute');
const gcpMetadata = require('gcp-metadata');
var fs = require('fs')
const compute = new Compute();

let masterPassword = argv.masterPassword ||'admin';
let masterUser = argv.masterUser ||'admin';
let beRobust = argv.beRobust || "true";
let vmsStats = {};

var dataPlaneAPIHost = "http://192.168.1.27:5555";
var dataPlaneAPIHeaders = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/json',
    'Cookie':           '_uid=01cd5187-3b56-46ad-892e-a8a788d9feb7'
};
var dataPlaneAPiAuth = {
    'user': 'dataplaneapi',
    'pass': 'mypassword',
    'sendImmediately': false
};

var app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/private/html/login.html'));
});

app.post('/auth', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        if(username.localeCompare(masterUser) === 0){
            if(password.localeCompare(masterPassword) === 0){
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/home');
            }else{
                response.send('Incorrect Username and/or Password!');
            }
        }else{
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.post('/start-vm',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-b');
                const vm = zone.vm('monitor');
                const data = await vm.create(instancesConfig.monitor);
                const operation = data[1];
                await operation.promise();

                // External IP of the VM.
                const metadata = await vm.getMetadata();
                const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
                const ip2 = metadata[0].networkInterfaces[0].networkIP;
                console.log(`Booting new VM with IP http://${ip}...`);
                console.log(`Booting new VM with local IP http://${ip2}...`);
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.post('/start-monitor',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-b');
                const vm = zone.vm('monitor-2');
                var cred = fs.readFileSync('./cred.json', 'utf8');
                const data = await vm.create(instancesConfig.monitor("bobthebuilder","asdqwe123",cred));
                const operation = data[1];
                await operation.promise();

                // External IP of the VM.
                const metadata = await vm.getMetadata();
                const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
                const ip2 = metadata[0].networkInterfaces[0].networkIP;
                console.log(`Booting new VM with IP http://${ip}...`);
                console.log(`Booting new VM with local IP http://${ip2}...`);
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.post('/start-worker',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-b');
                vm = zone.vm('worker-'+uuidv4());
                await vm.create(instancesConfig.worker(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, instancesConfig.REDIS_IP_1, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));
                response.end();
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.post('/start-web-server',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-b');
                vm = zone.vm('web-server-'+uuidv4());
                await vm.create(instancesConfig.webServer(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, instancesConfig.REDIS_IP_1, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));
                response.end();
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.post('/start-2',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-a');

                vm = zone.vm('web-server-'+uuidv4());
                await vm.create(instancesConfig.webServer(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, instancesConfig.REDIS_IP_1, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));
                //TODO ADD TO HAPROXY

                //WORKER
                vm = zone.vm('worker-'+uuidv4());
                await vm.create(instancesConfig.worker(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, instancesConfig.REDIS_IP_1, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));

            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.post('/start-complete-set',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-a');

                //THONK SET UP
                vm = zone.vm('thonk-1');
                await vm.create(instancesConfig.rethink(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, true));

                vm = zone.vm('thonk-2');
                await vm.create(instancesConfig.rethink(instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_3));

                vm = zone.vm('thonk-3');
                await vm.create(instancesConfig.rethink(instancesConfig.THONK_IP_3, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_1));


                //WEED SET UP
                vm = zone.vm('weed-master-1');
                await vm.create(instancesConfig.weedMaster(instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3, true));

                vm = zone.vm('weed-master-2');
                await vm.create(instancesConfig.weedMaster(instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_3));

                vm = zone.vm('weed-master-3');
                await vm.create(instancesConfig.weedMaster(instancesConfig.WEED_MASTER_IP_3, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_1));


                vm = zone.vm('weed-volume-'+uuidv4());
                await vm.create(instancesConfig.weedVolume(instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));

                vm = zone.vm('weed-volume-'+uuidv4());
                await vm.create(instancesConfig.weedVolume(instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));

                vm = zone.vm('weed-volume-'+uuidv4());
                await vm.create(instancesConfig.weedVolume(instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));

                //REDIS
                vm = zone.vm('redis-1');
                await vm.create(instancesConfig.redis(instancesConfig.REDIS_IP_1));

                vm = zone.vm('haproxy.cfg-1');
                await vm.create(instancesConfig.haproxy());
                const metadata = await vm.getMetadata();
                const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
                dataPlaneAPIHost="https://"+ip+":5555";

                response.end();
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});





app.post('/delete-vm',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                const zone = compute.zone(request.body.zone);
                // TODO(developer): choose a name for the VM to delete
                const name = request.body.name;
                const vm = zone.vm(name);
                const [operation] = await vm.delete();
                await operation.promise();
                console.log(`VM deleted!`);
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.get('/list-vm', function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                const vms = await compute.getVMs();
                console.log(`Found ${vms.length} VMs!`);
                vms.forEach(vm => console.log(vm));
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(vms));
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.get('/vm-data', function(request, response) {
    if (request.session.loggedin) {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(vmsStats));
    }
    else {
        response.send('Please login to view this page!');
        response.end();
    }
});

var numberOfVmSet = [];
async function collectData() {
    (async () => {
        try {
            const vms = await compute.getVMs();
            for (const vm of vms[0]) {
                //console.log(vm.id);
                //console.log(vm.metadata.networkInterfaces[0].networkIP);
                http.get('http://'+vm.metadata.networkInterfaces[0].networkIP+ ':12012/data', (resp) => {
                //http.get('http://localhost:12012/data', (resp) => {
                    let resData = '';

                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        resData += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        vmsStats[vm.id] = {data: JSON.parse(resData), date: Date.now()};
                        //console.log(JSON.parse(resData));
                    });

                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            }
            console.log("HELLO")
            numberOfVmSet[numberOfVmSet.length] = {info: Object.keys(vms[0]).length,date:Date.now()};
            if(numberOfVmSet.length > 120){
                numberOfVmSet = numberOfVmSet.slice(1);
            }
            vmsStats["numberOfVM"] = {data: numberOfVmSet, date: Date.now()};

            Object.keys(vmsStats).forEach(function (key) {
               if(Date.now() - vmsStats[key].date > (3600 *1000)){
                   delete vmsStats[key]
               }
            });
        } catch (error) {
            console.error(error);
        }
    })();
}
setInterval(collectData, 30*1000);

app.get('/metadata', function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                const isAvailable = await gcpMetadata.isAvailable();
                console.log(isAvailable)
                const data = await gcpMetadata.instance();
                console.log(data); // ... All metadata properties
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(data));
            } catch (error) {
                console.error(error);
            }
        })();
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/private/html/home.html'));
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

let robustRunning = false
async function robust(){
    if(robustRunning || beRobust === "false"){
        return
    }
    robustRunning = true;
    (async () => {
        try {
            const vms = await compute.getVMs();
            var weedmaster1 = false;
            var weedmaster2 = false;
            var weedmaster3 = false;
            var thonk1 = false;
            var thonk2 = false;
            var thonk3 = false;
            var weedVolumeCount = 0;
            var workerCount = 0;
            var webServerCount = 0;

            Object.keys(vms[0]).forEach(function (key) {
                if(vms[0][key].id.includes("weed-master-1")){
                    weedmaster1 = true;
                }
                else if(vms[0][key].id.includes("weed-master-2")){
                    weedmaster2 = true;
                }
                else if(vms[0][key].id.includes("weed-master-3")){
                    weedmaster3 = true;
                }
                else if(vms[0][key].id.includes("thonk-1")){
                    thonk1 = true;
                }
                else if(vms[0][key].id.includes("thonk-2")){
                    thonk2 = true;
                }
                else if(vms[0][key].id.includes("thonk-3")){
                    thonk3 = true;
                }
                else if(vms[0][key].id.includes("worker")){
                    workerCount += 1;
                }
                else if(vms[0][key].id.includes("weed-volume")){
                    weedVolumeCount += 1;
                }
                else if(vms[0][key].id.includes("web-server")){
                    webServerCount += 1;
                }
            });

            var zone = compute.zone('europe-west4-a');

            if(!weedmaster1){
                console.log("Missing weed-master-1");
                vm = zone.vm('weed-master-1');
                await vm.create(instancesConfig.weedMaster(instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3, true));
            }
            if(!weedmaster2){
                console.log("Missing weed-master-2");
                vm = zone.vm('weed-master-2');
                await vm.create(instancesConfig.weedMaster(instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_3));
            }
            if(!weedmaster3){
                console.log("Missing weed-master-3");
                vm = zone.vm('weed-master-3');
                await vm.create(instancesConfig.weedMaster(instancesConfig.WEED_MASTER_IP_3, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_1,));
            }
            if(!thonk1){
                console.log("Missing thonk-1");
                vm = zone.vm('thonk-1');
                await vm.create(instancesConfig.rethink(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, true));
            }
            if(!thonk2){
                console.log("Missing thonk-2");
                vm = zone.vm('thonk-2');
                await vm.create(instancesConfig.rethink(instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_3));
            }
            if(!thonk3){
                console.log("Missing thonk-3");
                vm = zone.vm('thonk-3');
                await vm.create(instancesConfig.rethink(instancesConfig.THONK_IP_3, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_1));
            }
            if(workerCount < 3){
                console.log("Few workers");
                for (let i = workerCount; i < 3; i++) {
                    vm = zone.vm('worker-'+uuidv4());
                    await vm.create(instancesConfig.worker(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, instancesConfig.REDIS_IP_1, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));
                }
            }
            if(webServerCount < 3){
                console.log("Few web servers");
                for (let i = webServerCount; i < 3; i++) {
                    var name = 'web-server-'+uuidv4();
                    vm = zone.vm(name);
                    await vm.create(instancesConfig.webServer(instancesConfig.THONK_IP_1, instancesConfig.THONK_IP_2, instancesConfig.THONK_IP_3, instancesConfig.REDIS_IP_1, instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));
                    const data = await vm.create(instancesConfig.monitor);
                    const operation = data[1];
                    await operation.promise();

                    // External IP of the VM.
                    const metadata = await vm.getMetadata();
                    const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
                    postServer(name,ip,80)
                }
            }
            if(weedVolumeCount < 3){
                console.log("Few weed volumes");
                for (let i = weedVolumeCount; i < 3; i++) {
                    vm = zone.vm('weed-volume-'+uuidv4());
                    await vm.create(instancesConfig.weedVolume(instancesConfig.WEED_MASTER_IP_1, instancesConfig.WEED_MASTER_IP_2, instancesConfig.WEED_MASTER_IP_3));
                }
            }

            robustRunning = false;
        } catch (error) {
            console.error(error);
        }
    })();
}
setInterval(robust, 60*1000);



function postServer(name,address,port){
    request.get({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/configuration/frontends',
        auth: dataPlaneAPiAuth, headers: dataPlaneAPIHeaders}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('failed:', err);
        }
        var v = JSON.parse(httpResponse.body)._version;
        console.log('successful! \n'+v);
        request.post({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/transactions?version='+v,
            auth: dataPlaneAPiAuth, headers: dataPlaneAPIHeaders}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('failed:', err);
            }
            var tID = JSON.parse(httpResponse.body).id;
            console.log('successful! \n'+tID);
            request.post({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/configuration/servers?backend=My_Web_Servers&transaction_id='+tID,
                auth: dataPlaneAPiAuth, body:{"name": name, "address": address, "port": port}, headers: dataPlaneAPIHeaders, json: true}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    return console.error('failed:', err);
                }
                console.log('successful! \n'+httpResponse.body);
                commitTransaction(tID);
            });
        });
    });
}
function deleteServer(name){
    request.get({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/configuration/frontends',
        auth: dataPlaneAPiAuth, headers: dataPlaneAPIHeaders}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('failed:', err);
        }
        var v = JSON.parse(httpResponse.body)._version;
        console.log('successful! \n'+v);
        request.post({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/transactions?version='+v,
            auth: dataPlaneAPiAuth, headers: dataPlaneAPIHeaders}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('failed:', err);
            }
            var tID = JSON.parse(httpResponse.body).id;
            console.log('successful! \n'+tID);
            request.delete({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/configuration/servers/'+name+'?backend=My_Web_Servers&transaction_id='+tID,
                auth: dataPlaneAPiAuth, headers: dataPlaneAPIHeaders, json: true}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    return console.error('failed:', err);
                }
                commitTransaction(tID);
            });
        });
    });
}
function commitTransaction(tID) {
    request.put({url: dataPlaneAPIHost +'/v1/services/haproxy.cfg/transactions/'+tID,
        auth: dataPlaneAPiAuth, headers: dataPlaneAPIHeaders}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('failed:', err);
        }
        console.log('successful! \n'+httpResponse.body);
    });
}

app.listen(3000);