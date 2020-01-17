function reThonkDbconfig(ip, ip2, ip3, http) {
    return {
        os: 'debian',
        machineType: 'g1-small',
        http: http,
        networkInterfaces: [{
            network: 'projects/timstestigatest/global/networks/video-converter-network',
            networkIP: ip
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
                            svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                            cd NSA
                            npm install
                            node index.js &
                            cd ..
                    
                    
                            sudo apt-get --assume-yes install wget
                            
                            echo "deb https://download.rethinkdb.com/apt \`lsb_release -cs\` main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
                            wget -qO- https://download.rethinkdb.com/apt/pubkey.gpg | sudo apt-key add -
                            sudo apt-get update
                            sudo apt-get --assume-yes install rethinkdb
                                                    
                            sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 8080
                            
                            rethinkdb --bind all --join `+ip2+`:29015 --join `+ip3+`:29015
                    `
                },
            ],
        }
    };
}

function weedMasterConfig(ip, ip2, ip3, http) {
    return {
        os: 'debian',
        machineType: 'f1-micro',
        http: http,
        networkInterfaces: [{
            network: 'projects/timstestigatest/global/networks/video-converter-network',
            networkIP: ip
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
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
                        sudo apt-get --assume-yes install wget
                        wget https://github.com/chrislusf/seaweedfs/releases/download/1.48/linux_amd64.tar.gz
                        tar -zxvf linux_amd64.tar.gz
                        
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 9333
                        
                        ./weed master -mdir="." -defaultReplication=001 -ip=`+ip+` -peers=` + ip + `:9333,` + ip2 + `:9333,` + ip3 + `:9333
                `
                },
            ],
        },
    };
}

function weedVolumeConfig(ip,ip2,ip3) {
    return {
        os: 'debian',
        machineType: 'g1-small',
        http: false,
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
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                    
                        sudo apt-get --assume-yes install wget
                        sudo wget https://github.com/chrislusf/seaweedfs/releases/download/1.48/linux_amd64.tar.gz
                        sudo tar -zxvf linux_amd64.tar.gz
                        sudo mkdir data
                        internalIP=$(hostname -I)
                        sudo ./weed volume -max=200 -mserver=` + ip + `:9333,` + ip2 + `:9333,` + ip3 + `:9333 -ip=$internalIP -port=9090 -dir="./data"
                `
                },
            ],
        },
    };
}

function haproxyConfig(ip) {
    return {
        os: 'debian',
        machineType: 'g1-small',
        http: true,
        networkInterfaces: [{
            network: 'projects/timstestigatest/global/networks/video-converter-network',
            networkIP: ip
        }],
        metadata: {
            items: [
                {
                    key: 'startup-script',
                    value: `#! /bin/bash
                        sudo apt-get --assume-yes install subversion
                        sudo apt-get --assume-yes install curl
                        sudo apt-get --assume-yes install wget
                        
                        curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
                        sudo apt-get --assume-yes install nodejs
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 3500
                                             
                        sudo apt-get --assume-yes install haproxy 
                        export PATH="/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/root/bin"
                        sudo sed -i 's/# treat it as a shell script fragment./ENABLED=1/' /etc/default/haproxy 
                        sudo svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/haproxy
                        cd haproxy
                        sudo mv -f haproxy.cfg /etc/haproxy/haproxy.cfg
                        externalIP=$(curl https://ipinfo.io/ip)
                        sudo sed -i "s/bytebyte/bind 0.0.0.0:3500/" /etc/haproxy/haproxy.cfg 
                        sudo systemctl restart haproxy
                        
                        sudo wget https://github.com/haproxytech/dataplaneapi/releases/download/v1.2.4/dataplaneapi
                        sudo chmod +x dataplaneapi
                        sudo cp dataplaneapi /usr/local/bin/
                        cd /usr/local/bin/
                        sudo dataplaneapi --host 0.0.0.0 --port 5555 --haproxy-bin $(which haproxy) --config-file /etc/haproxy/haproxy.cfg --reload-cmd "sudo service haproxy restart"  --reload-delay 5 --userlist dataplane-api
                `
                },
            ],
        },
    };
}


function webServerConfig(thonkIP1, thonkIP2, thonkIP3, redisIP, weedMasterIP1, weedMasterIP2, weedMasterIP3) {
    return {
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
                        
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/WebServer
                        cd WebServer
                        
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 8008
                        
                        npm install
                        node index.js --redisIP=` + redisIP + ` --seaweedIP=` + weedMasterIP1 + ` --seaweedIP2=` + weedMasterIP2 + ` --seaweedIP3=` + weedMasterIP3 + ` --thonkIP1=` + thonkIP1 + ` --thonkIP2=` + thonkIP2 + ` --thonkIP3=` + thonkIP3 + `
                `
                },
            ],
        },
    };
}

function workerConfig(thonkIP1, thonkIP2, thonkIP3, redisIP, weedMasterIP1, weedMasterIP2, weedMasterIP3 ) {
    return  {
        os: 'debian',
        machineType: 'n1-standard-1',
        http: false,
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
                        
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/Worker
                        cd Worker
                        
                        npm install
                        node index.js --redisIP=` + redisIP + ` --seaweedIP=` + weedMasterIP1 + ` --seaweedIP2=` + weedMasterIP2 + ` --seaweedIP3=` + weedMasterIP3 + ` --thonkIP1=` + thonkIP1 + ` --thonkIP2=` + thonkIP2 + ` --thonkIP3=` + thonkIP3 + `
                `
                },
            ],
        },
    };
}

function redisConfig(ip) {
    return  {
        os: 'debian',
        machineType: 'g1-small',
        http: false,
        networkInterfaces: [{
            network: 'projects/timstestigatest/global/networks/video-converter-network',
            networkIP: ip
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
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
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
}
function redis2Config(ip) {
    return  {
        os: 'debian',
        machineType: 'f1-micro',
        http: false,
        networkInterfaces: [{
            network: 'projects/timstestigatest/global/networks/video-converter-network',
            networkIP: ip
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
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
                        sudo apt update
                        sudo apt install --yes apt-transport-https ca-certificates curl gnupg2 software-properties-common
                        curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
                        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
                        sudo apt update
                        sudo apt install --yes docker-ce
                        
                        sudo docker run -d -p 6379:6379 --name redis1 redis
			sudo docker exec -it redis1 redis-cli SLAVEOF `+REDIS_IP_1+` 6379		
			sudo docker exec -it redis1 redis-cli -h`+REDIS_IP_1+` -p 6379 PING		
			
                `
                },
            ],
        },
    };
}

function redisRestartConfig(ip) {
    return  {
        os: 'debian',
        machineType: 'g1-small',
        http: false,
        networkInterfaces: [{
            network: 'projects/timstestigatest/global/networks/video-converter-network',
            networkIP: ip
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
                        svn checkout https://github.com/xmlcar413/CloudVideoConverter/trunk/NSA
                        cd NSA
                        npm install
                        node index.js &
                        cd ..
                        
                        sudo apt update
                        sudo apt install --yes apt-transport-https ca-certificates curl gnupg2 software-properties-common
                        curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
                        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
                        sudo apt update
                        sudo apt install --yes docker-ce
			sudo docker run -d -p 6380:6380 --name redisRestart redis 
			sudo docker exec -it redisRestart redis-cli -h`+REDIS_IP_2+` -p 6379 SLAVEOF NO ONE
			sudo docker stop redisRestart
			sudo docker rm redisRestart
                        sudo docker run -d -p 6379:6379 --name redis1 redis
			sudo docker exec -it redis1 redis-cli SLAVEOF `+REDIS_IP_1+` 6379
			sudo docker exec -it redis1 redis-cli SLAVEOF NO ONE
			sudo docker exec -it redis1 redis-cli -h`+REDIS_IP_2+` -p 6379 SLAVEOF `+REDIS_IP_1+` 6379
                `
                },
            ],
        },
    };
}
function monitorConfig(user, password, cred) {
    return  {
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
                        node index.js &
                        
                        cd ..
                        cd Monitor
                        
                        echo '`+cred+`' > cred.json
                        export GOOGLE_APPLICATION_CREDENTIALS="./cred.json"
                        
                        sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 3000
                        
                        npm install
                        node index.js --masterUser=`+user+` --masterPassword=`+password+` &
                `
                },
            ],
        },
    };
}

const WEED_MASTER_IP_1 = "10.164.0.2";
const WEED_MASTER_IP_2 = "10.164.0.3";
const WEED_MASTER_IP_3 = "10.164.0.4";

const REDIS_IP_1 = "10.164.0.7";
const REDIS_IP_2 = "10.164.0.31";

const HAPROXY_IP_1 = "10.164.15.245";

const THONK_IP_1 = "10.164.0.8";
const THONK_IP_2 = "10.164.0.51";
const THONK_IP_3 = "10.164.0.52";

module.exports = {
    rethink: reThonkDbconfig,
    weedMaster: weedMasterConfig,
    weedVolume: weedVolumeConfig,
    webServer: webServerConfig,
    redis: redisConfig,
    redis2: redis2Config,
    redisRestart: redisRestartConfig,	
    worker: workerConfig,
    monitor: monitorConfig,
    haproxy: haproxyConfig,

    WEED_MASTER_IP_1: WEED_MASTER_IP_1,
    WEED_MASTER_IP_2: WEED_MASTER_IP_2,
    WEED_MASTER_IP_3: WEED_MASTER_IP_3,
    THONK_IP_1: THONK_IP_1,
    THONK_IP_2: THONK_IP_2,
    THONK_IP_3: THONK_IP_3,
    REDIS_IP_1: REDIS_IP_1,
    REDIS_IP_2: REDIS_IP_2,
    HAPROXY_IP_1: HAPROXY_IP_1
};
