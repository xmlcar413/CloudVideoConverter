export const config = {
    os: 'ubuntu',
    http: true,
    metadata: {
        items: [
            {
                key: 'startup-script',
                value: `#! /bin/bash
        # Get Node version manager and install Node 8.
        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
        nvm install 8
        # Install git
        apt-get --assume-yes install git
        # Clone sample application and start it.
        git clone https://github.com/fhinkel/nodejs-hello-world.git
        cd nodejs-hello-world
        npm start &`
            },
        ],
    },
};