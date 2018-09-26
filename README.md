# CEDAR
CEDAR is the CASS Ethereum Distributed Application Registry, and is composed of website code hosted on GitHub and a Smart Contract hosted on the Ethereum Blockchain.

The purpose of CEDAR is to provide a means of registering records at URLs (learner, learning, and non-learner), creating a validatable chain of ownership to a domain name, and enabling specific queries including getting all registered records for a learner, getting all registered records made by one party, and getting the registered record for a URL

## Ubuntu 16.04 installation guide

### Prerequisite Software
Install updates

    sudo apt update
    sudo apt upgrade

Install git and curl

    sudo apt install git
    sudo apt install curl

Use curl to install the nodejs suite

    curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
    sudo apt install nodejs

With node, install truffle globally

    sudo npm install -g truffle

### Starting an Etherium Client
Go to https://www.truffleframework.com/ganache and download the .appImage

Enable the installed file to execute, and run the install

    cd Downloads
    chmod u+x ganache-1.2.2-x86_64.AppImage
    sudo ./ganache-1.2.2-x86_64.AppImage

### Installing and running the CEDAR code
In the terminal `cd` to the target install location for project

    git clone https://github.com/cassproject/cass-ethereum-registry.git
    cd cass-ethereum-registry
    npm install
    sudo rm -r ./build/contracts
    truffle compile
    truffle migrate --network development
    npm run dev

You should automatically see your browser pop up and display the CEDAR Home Page.

### Registering to use Etherium
In your chosen browser, install the MetaMask plugin. To sign in, choose to use a mnemonic, and then copy the mnemonic at the top of your Ganache accounts tab into the plugin.

Once you have your MetaMask wallet linked to your blockchain instance, you will need to return to http://localhost:3000 and hit `Disclose My URL`.

From this page, click the Download binding file link, and post it to your chosen URL, paste the URL in the text box. Then click `Register My Website URL`.