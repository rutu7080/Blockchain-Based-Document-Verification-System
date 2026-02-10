# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Node.js Comapatible Version :
# v22.19.0

Command to install compatible Hardhat Version :
# 2.26.3
```shell
npm install --save-dev hardhat@2.26.3 @nomicfoundation/hardhat-toolbox@6.1.0 @openzeppelin/contracts@5.4.0
```

Try running some of the following tasks:
(Optional)
```shell
npx hardhat help
npx hardhat test
```
Start hardhat node(Keep Terminal On)
```shell
npx hardhat node
```
Start Daemon node(Keep Terminal On)
```shell
ipfs daemon
```
In another Terminal Deploy Contract(Keep Terminal On)
```shell
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```
In another Terminal start server(Keep Terminal On)
```shell
cd server
node server.js
```
In another Terminal Start frontend App
```shell
cd frontend
cd src
npm start
```


