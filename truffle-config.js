module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      network_id: '*',
    }
  },
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
      //version: "0.4.24"  // ex:  "0.4.20". (Default: Truffle's installed solc)
    }
  }
}
