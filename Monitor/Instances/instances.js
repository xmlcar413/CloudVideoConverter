const reThonkDbconfig = {
    os: 'debian',
    machineType: 'f1-micro',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
        networkIP: '10.164.0.8'
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
                        sudo apt-get --assume-yes install wget
                        
                        echo "deb https://download.rethinkdb.com/apt \`lsb_release -cs\` main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
                        wget -qO- https://download.rethinkdb.com/apt/pubkey.gpg | sudo apt-key add -
                        sudo apt-get update
                        sudo apt-get --assume-yes install rethinkdb
                                                
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 8080
                        
                        rethinkdb --bind all
                `
            },
        ],
    },
};

const webServerConfig = {
    os: 'debian',
    machineType: 'f1-micro',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
                        sudo apt-get --assume-yes install subversion
                        sudo apt-get --assume-yes install curl
                        curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
                        sudo apt-get --assume-yes install nodejs
                        
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/WebServer
                        cd WebServer
                        
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 8008
                        
                        npm install
                        node index.js --redisIP=10.164.0.7  --seaweedIP=10.164.0.2  --thonkIP=10.164.0.8
                `
            },
        ],
    },
};

const workerConfig = {
    os: 'debian',
    machineType: 'g1-small',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
                        
                        sudo apt-get --assume-yes install subversion
                        sudo apt-get --assume-yes install curl
                        curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
                        sudo apt-get --assume-yes install nodejs
                        
                        sudo apt-get --assume-yes install handbrake-cli
                        
                        
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/Worker
                        cd Worker
                        
                        npm install
                        node index.js --redisIP=10.164.0.7  --seaweedIP=10.164.0.2  --thonkIP=10.164.0.8
                `
            },
        ],
    },
};

const weedMasterConfig = {
    os: 'debian',
    machineType: 'f1-micro',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
        networkIP: '10.164.0.2'
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
                        sudo apt-get --assume-yes install wget
                        wget https://github.com/chrislusf/seaweedfs/releases/download/1.48/linux_amd64.tar.gz
                        tar -zxvf linux_amd64.tar.gz
                        
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 9333
                        
                        ./weed master -mdir="." -ip=10.164.0.2
                `
            },
        ],
    },
};

const weedVolumeConfig = {
    os: 'debian',
    machineType: 'f1-micro',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
        networkIP: '10.164.0.4'
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
                        sudo apt-get --assume-yes install wget
                        sudo wget https://github.com/chrislusf/seaweedfs/releases/download/1.48/linux_amd64.tar.gz
                        sudo tar -zxvf linux_amd64.tar.gz
                        sudo mkdir data
                        internetalIP="hostname -I"
                        sudo ./weed volume -mserver="10.164.0.2:9333" -ip=10.164.0.4 -port=9090 -dir="./data"
                `
            },
        ],
    },
};



const redisConfig = {
    os: 'debian',
    machineType: 'f1-micro',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
        networkIP: '10.164.0.7'
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
                        sudo apt update
                        sudo apt install --yes apt-transport-https ca-certificates curl gnupg2 software-properties-common
                        curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
                        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
                        sudo apt update
                        sudo apt install --yes docker-ce
                        
                        sudo docker run -d -p 6379:6379 --name redis1 redis
                `
            },
        ],
    },
};

const monitorConfig = {
    os: 'debian',
    machineType: 'g1-small',
    http: true,
    networkInterfaces: [{
        network: 'projects/timstestigatest/global/networks/video-converter-network',
    }],
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash

                        sudo apt-get --assume-yes install subversion
                        sudo apt-get --assume-yes install curl
                        curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
                        sudo apt-get --assume-yes install nodejs
                        
                       
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/Monitor
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        
                        cd NSA
                        npm install
                        start node index.js
                        
                        cd ..
                        cd Monitor
                        

                `
            },
        ],
    },
};



const testConfig = {
    os: 'debian',
    machineType: 'f1-micro'
};

module.exports = {
    rethink: reThonkDbconfig,
    webServer: webServerConfig,
    test: testConfig,
    weedMaster: weedMasterConfig,
    weedVolume: weedVolumeConfig,
    redis: redisConfig,
    worker: workerConfig,
    monitor: monitorConfig
};
