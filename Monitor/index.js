const argv = require('yargs').argv;
var express = require('express');
var session = require('express-session');
const http = require('http');
var bodyParser = require('body-parser');
var path = require('path');
var instancesConfig = require('./Instances/instances');
const Compute = require('@google-cloud/compute');
const gcpMetadata = require('gcp-metadata');
const compute = new Compute();

let masterPassword = argv.masterPassword ||'admin';
let masterUser = argv.masterUser ||'admin';
let vmsStats = {};

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



app.post('/start-2',function(request, response) {
    if (request.session.loggedin) {
        (async () => {
            try {
                var zone = compute.zone('europe-west4-b');

                var vm = zone.vm('web-server');
                await vm.create(instancesConfig.webServer);

                vm = zone.vm('worker-1');
                await vm.create(instancesConfig.worker);


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
                var zone = compute.zone('europe-west4-b');


                var vm = zone.vm('weed-master');
                await vm.create(instancesConfig.weedMaster);

                vm = zone.vm('weed-volume');
                await vm.create(instancesConfig.weedVolume);

                vm = zone.vm('redis-1');
                await vm.create(instancesConfig.redis);

                vm = zone.vm('thonk-1');
                await vm.create(instancesConfig.rethink);

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
                request.body
                const zone = compute.zone('us-central1-a');
                // TODO(developer): choose a name for the VM to delete
                const name = 'ubuntu-instance';
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

async function collectData() {
    (async () => {
        try {
            const vms = await compute.getVMs();
            for (const vm of vms[0]) {
                console.log(vm.id);
                console.log(vm.metadata.networkInterfaces[0].networkIP);
                http.get(vm.metadata.networkInterfaces[0].networkIP+ ':12000/data', (resp) => {
                    let resData = '';

                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        resData += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        vmsStats[vm.id] = {data: JSON.parse(resData), date: Date.now()};
                        console.log(JSON.parse(resData));
                    });

                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            }
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

app.listen(3000);