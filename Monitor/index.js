var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const Compute = require('@google-cloud/compute');
const gcpMetadata = require('gcp-metadata');
const compute = new Compute();

let masterPassword = 'pass321';
let masterUser = 'pass321';

var app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')))

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
                const zone = await compute.zone('us-central1-a');
                const data = await zone.createVM(
                    'ubuntu-instance',
                    { os: 'ubuntu' }
                );
                const operation = data[1];
                await operation.promise();
                // Virtual machine created.
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