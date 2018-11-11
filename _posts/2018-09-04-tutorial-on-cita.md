---
layout: post
title: "A Hands-on Tutorial on Building Your First DAPP with CITA (Nervos)"
date: 2018-09-04 00:14:39
categories: tutorial
tags: blockchain tutorial
---

Although the documentation of cita is already in details, there are some tricks that I would like to share.

## Prerequisites

* docker (You can use [this convinient script](https://get.docker.com/))
* rust/cargo (You can install Rust by `rustup`)

## Getting CITA (OPTIONAL, skip if you are using an existing chain such as test chain)

So, first we need to download cita. There are two options: 

1. download the latest source file and compile 

```
git clone https://github.com/cryptape/cita.git && \
cd cita && \
git submodule init && \
git submodule update && \
./env.sh make release 
```

or you can compile the `debug` version by `./env.sh make debug`


2. download the release version

You can find release version [there](https://github.com/cryptape/cita/releases)


## Create/Run nodes && Setup an app chain (OPTIONAL, skip if you are using an existing chain such as test chain)

Take a look at [`tests/integration_test/`](https://github.com/cryptape/cita/tree/develop/tests/integrate_test), it contains the all the methods that cita provides. We can use `cita_start.sh` to generate and run 4 local nodes. You will find the generated files at `target/install/test-chain`.

For multiple chains, you can run
```
./env.sh ./scripts/create_cita_config.py create --chain_name test2-chain --jsonrpc_port 2337 --ws_port 5337 --grpc_port 6000 --nodes "127.0.0.1:8000,127.0.0.1:8001,127.0.0.1:8002,127.0.0.1:8003"

```
to generate a test2-chain but notice multiple chains are runned in one docker container because of the limitation of `rabbitmq`.

### Create side chain with a main chain

```
./env.sh ./scripts/create_cita_config.py create \
--chain_name test2-chain \
--jsonrpc_port 2337 \
--ws_port 5337 \
--grpc_port 6000 \
--nodes "127.0.0.1:8000,127.0.0.1:8001,127.0.0.1:8002,127.0.0.1:8003" \
--contract_arguments "SysConfig.chainId=3" "SysConfig.economicalModel=1" \
"ChainManager.parentChainId=2" "ChainManager.parentChainAuthorities=0x17f3487df9f9331969602bf203165abf886a0ed1"
```

You can check the `parentChainAuthorities` at `test-chain/template/authorities.list`. The example only uses the auth of node0 created by default.

## Check the status (OPTIONAL, skip if you are using an existing chain such as test chain)

An elegant way to do this is install [cita-cli](https://github.com/cryptape/cita-cli)

```
git clone https://github.com/cryptape/cita-cli.git
cd cita-cli/cita-cli
cargo install
```

Then you can run it (interactive mode) at `~/.cargo/bin/cita-cli` or `cargo run` under `cita-cli/cita-cli` 

```
# default is http://127.0.0.1:1337
# the following is a test chain provided by nervos
cita> switch --host http://121.196.200.225:1337
cita> rpc blockNumber
...
cita> exit
```


The full list of `json-rpc` list is [here](https://docs.nervos.org/cita/#/rpc_guide/rpc)

## Deploy contracts

#### The default config super_admin account for local test-chain

* private key: `5f0258a4778057a8a7d97809bd209055b2fbafa654ce7d31ec7191066b9225e6`
* address: `0x4b5ae4567ad5d9fb92bc9afd6a657e6fa13a2523`


#### The test chain provided by nervos

* `http://121.196.200.225:1337`
* private key: `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`

The deployment of this tutorial follows the example of [dapp-demos/first-forever](https://github.com/cryptape/dapp-demos).

1. Compile the contract by `solc`

```
solcjs --optimized --abi --bin <your contract>
```

2. Copy the abi & bin to `compiled.js` (actually we can automate this process with node, take a look at [this example](https://gist.github.com/tomconte/4edb83cf505f1e7faf172b9252fff9bf#file-web3-solc-contract-compile-deploy-js-L9-L12), but I was not able to do this due to some unknow reason)
3. `npm run deploy` and you will get a contract address (You probably want to note it down for later use)


## Integrate contracts to dapp

You can use the [`nervos.js`](https://github.com/cryptape/nervos.js/tree/develop/packages/nervos-chain) which is a sdk for cita.

```
const abi = JSON.parse(
  '[{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]',
)
const contract = new nervos.appchain.Contract(abi, contractAddress)

// call method
// get method is specified by contract through abi
// contract.methods.myMethod(paramters).call(transaction)
contract.methods.get().call()

// send method
// set method is specified by contract through abi
// contract.methods.myMethod(parameters).send(transaction)
contract.methods.set(5).send(transaction)
```

## Final thoughts

I just learned about CITA (nervos) two days ago at a hacakthon. It really is a developer-friendly blockchain system. I got prompt response from the maintainers on Wechat group and on site at hackathon. There are some improvements needed, but overall it is a pleasure experience.

For the hackathon, our team did an decentralized random number generator - Thanos based on Nervos ([link](https://github.com/PRIEWIENV/NurTib)). Although we did not win a prize, we think this could be an important infrastructure for Nervos system because random number generator could power up many applications in games, cryptographs, ...
