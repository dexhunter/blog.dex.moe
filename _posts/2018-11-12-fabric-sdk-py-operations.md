---
layout: post
title: "使用fabric-sdk-py对网络操作"
date: 2018-11-12 03:54:18
categories: fabric
tags: fabric tutorial
---

*本文基于[fabric-sdk-py官方文档](https://github.com/hyperledger/fabric-sdk-py/blob/master/docs/tutorial.md)翻译，如有更多疑问，请移步至Rocketchat #fabric-sdk-py，谢谢！*

## 0.操作前准备

### 0.1　安装 Fabric SDK

```bash
pip install fabric-sdk-py
```

安装后可以检测sdk版本

```bash
$ python
>>> import hfc
>>> print(hfc.VERSION)
0.8.1
```

### 0.2.开启一个 Fabric Network

使用以下命令开启一个Fabric Network

```bash
# OPTIONAL
export HLF_VERSION=1.4.0
docker pull hyperledger/fabric-peer:${HLF_VERSION}
docker pull hyperledger/fabric-orderer:${HLF_VERSION}
docker pull hyperledger/fabric-ca:${HLF_VERSION}
docker pull hyperledger/fabric-ccenv:${HLF_VERSION}
git clone https://github.com/hyperledger/fabric-sdk-py.git
cd fabric-sdk-py 
docker-compose -f test/fixtures/docker-compose-2orgs-4peers-tls.yaml up
```

然后你将有一个有3个组织的Fabric网络，4个普通节点和1个排序节点，网络拓扑结构如下：
 * org1.example.com
   * peer0.org1.example.com
   * peer1.org1.example.com
 * org2.example.com
   * peer0.org2.example.com
   * peer1.org2.example.com
 * orderer.example.com
   * orderer.example.com

*注意： `configtxgen`需要在`PATH`路径下


### 0.3. 建立连接配置文件

一个网络连接配置文件通过提供跟网络交互所需要的所有信息帮助SDK连接到Fabric网络中，其中包括：
*  peer, orderer, ca的服务端点
*  客户端身份的认证证书
一个例子是 [network.json](https://github.com/hyperledger/fabric-sdk-py/blob/master/test/fixtures/network.json)

## 1. 加载连接描述(Connection Profile)

```python
from hfc.fabric import Client

cli = Client(net_profile="test/fixtures/network.json")

print(cli.organizations)  # orgs in the network
print(cli.peers)  # peers in the network
print(cli.orderers)  # orderers in the network
print(cli.CAs)  # ca nodes in the network, TODO
```

## 2. 在Fabric网络中Channel的操作

### 2.1 建立并加入新通道

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user(org_name='org1.example.com', name='Admin')

# Create a New Channel, the response should be true if succeed
response = loop.run_until_complete(cli.channel_create(
            orderer='orderer.example.com',
            channel_name='businesschannel',
            requestor=org1_admin,
            config_yaml='test/fixtures/e2e_cli/',
            channel_profile='TwoOrgsChannel'
            ))
print(response == True)

# Join Peers into Channel, the response should be true if succeed
orderer_admin = cli.get_user(org_name='orderer.example.com', name='Admin')
responses = loop.run_until_complete(cli.channel_join(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com',
                      'peer1.org1.example.com'],

               orderer='orderer.example.com',
               orderer_admin=orderer_admin
               ))
print(len(responses) == 2)


# Join Peers from a different MSP into Channel
org2_admin = cli.get_user(org_name='org2.example.com', name='Admin')

# For operations on peers from org2.example.com, org2_admin is required as requestor
responses = loop.run_until_complete(cli.channel_join(
               requestor=org2_admin,
               channel_name='businesschannel',
               peers=['peer0.org2.example.com',
                      'peer1.org2.example.com'],
               orderer='orderer.example.com',
               orderer_admin=orderer_admin
               ))
print(len(responses) == 2)
```

### 2.2 更新通道信息

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user(org_name='org1.example.com', name='Admin')

config_tx_file = './configtx.yaml'

orderer_admin = cli.get_user(org_name='orderer.example.com', name='Admin')
loop.run_until_complete(cli.channel_update(
        orderer='orderer.example.com',
        channel_name='businesschannel',
        requestor=orderer_admin,
        config_tx=config_tx_file))
```

## 3. 在Fabric网络中进行Chaincode相关操作

* 使用sdk进行install, instantiate和invoke chaincode的操作

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Make the client know there is a channel in the network
cli.new_channel('businesschannel')

# Install Example Chaincode to Peers
# GOPATH setting is only needed to use the example chaincode inside sdk
import os
gopath_bak = os.environ.get('GOPATH', '')
gopath = os.path.normpath(os.path.join(
                      os.path.dirname(os.path.realpath('__file__')),
                      'test/fixtures/chaincode'
                     ))
os.environ['GOPATH'] = os.path.abspath(gopath)

# The response should be true if succeed
responses = loop.run_until_complete(cli.chaincode_install(
               requestor=org1_admin,
               peers=['peer0.org1.example.com',
                      'peer1.org1.example.com'],
               cc_path='github.com/example_cc',
               cc_name='example_cc',
               cc_version='v1.0'
               ))

# Instantiate Chaincode in Channel, the response should be true if succeed
args = ['a', '200', 'b', '300']

# policy, see https://hyperledger-fabric.readthedocs.io/en/release-1.4/endorsement-policies.html
policy = {
    'identities': [
        {'role': {'name': 'member', 'mspId': 'Org1MSP'}},
    ],
    'policy': {
        '1-of': [
            {'signed-by': 0},
        ]
    }
}
response = loop.run_until_complete(cli.chaincode_instantiate(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               args=args,
               cc_name='example_cc',
               cc_version='v1.0',
               cc_endorsement_policy=policy, # optional, but recommended
               collections_config=None, # optional, for private data policy
               transient_map=None, # optional, for private data
               wait_for_event=True # optional, for being sure chaincode is instantiated
               ))

# Invoke a chaincode
args = ['a', 'b', '100']
# The response should be true if succeed
response = loop.run_until_complete(cli.chaincode_invoke(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               args=args,
               cc_name='example_cc',
               transient_map=None, # optional, for private data
               wait_for_event=True, # for being sure chaincode invocation has been commited in the ledger, default is on tx event
               #cc_pattern='^invoked*' # if you want to wait for chaincode event and you have a `stub.SetEvent("invoked", value)` in your chaincode
               ))

# Query a chaincode
args = ['b']
# The response should be true if succeed
response = loop.run_until_complete(cli.chaincode_query(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               args=args,
               cc_name='example_cc'
               ))

# Upgrade a chaincode
# policy, see https://hyperledger-fabric.readthedocs.io/en/release-1.4/endorsement-policies.html
policy = {
    'identities': [
        {'role': {'name': 'member', 'mspId': 'Org1MSP'}},
        {'role': {'name': 'admin', 'mspId': 'Org1MSP'}},
    ],
    'policy': {
        '1-of': [
            {'signed-by': 0}, {'signed-by': 1},
        ]
    }
}
response = loop.run_until_complete(cli.chaincode_upgrade(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               args=args,
               cc_name='example_cc',
               cc_version='v1.0',
               cc_endorsement_policy=policy, # optional, but recommended
               collections_config=None, # optional, for private data policy
               transient_map=None, # optional, for private data
               wait_for_event=True # optional, for being sure chaincode is upgraded
               ))    
```

## 4. 查询信息

### 4.1 基本操作

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()
cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Query Peer installed chaincodes, make sure the chaincode is installed
response = loop.run_until_complete(cli.query_installed_chaincodes(
               requestor=org1_admin,
               peers=['peer0.org1.example.com'],
               decode=True
               ))

"""
# An example response:

chaincodes {
  name: "example_cc"
  version: "1.0"
  path: "github.com/example_cc"
}
"""

# Query Peer Joined channel
response = loop.run_until_complete(cli.query_channels(
               requestor=org1_admin,
               peers=['peer0.org1.example.com'],
               decode=True
               ))

"""
# An example response:

channels {
  channel_id: "businesschannel"
}
"""

# Query Channel Info
response = loop.run_until_complete(cli.query_info(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               decode=True
               ))

# Query Block by tx id
# example txid of instantiated chaincode transaction
response = loop.run_until_complete(cli.query_block_by_txid(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               tx_id=cli.txid_for_test,
               decode=True
               ))
```               

### 4.2 通过哈希值查询区块

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()
cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# first get the hash by calling 'query_info'
response = loop.run_until_complete(cli.query_info(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               decode=True
               ))

test_hash = response.currentBlockHash

response = loop.run_until_complete(cli.query_block_by_hash(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               block_hash=test_hash,
               decode=True
               ))
```

### 4.3 查询区块，交易和启动的链码

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()
cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Query Block by block number
response = loop.run_until_complete(cli.query_block(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               block_number='1',
               decode=True
               ))

# Query Transaction by tx id
# example txid of instantiated chaincode transaction
response = loop.run_until_complete(cli.query_transaction(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               tx_id=cli.txid_for_test,
               decode=True
               ))

# Query Instantiated Chaincodes
response = loop.run_until_complete(cli.query_instantiated_chaincodes(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               decode=True
               ))
```

### 4.4 获得通道信息

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()
cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Get channel config
response = loop.run_until_complete(cli.get_channel_config(
               requestor=org1_admin,
               channel_name='businesschannel',
               peers=['peer0.org1.example.com'],
               decode=True
               ))
```

### 4.5 使用通道发现 (channel discovery)

```python
import asyncio
from hfc.fabric import Client

loop = asyncio.get_event_loop()
cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Get config from local channel discovery
response = loop.run_until_complete(cli.query_peers(
               requestor=org1_admin,
               peer='peer0.org1.example.com',
               channel='businesschannel',
               local=True,
               decode=True
               ))

# Get config from channel discovery over the network
response = loop.run_until_complete(cli.query_peers(
               requestor=org1_admin,
               peer='peer0.org1.example.com',
               channel='businesschannel',
               local=False,
               decode=True
               ))
```