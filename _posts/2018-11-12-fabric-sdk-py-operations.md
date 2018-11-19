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
$ git clone https://github.com/hyperledger/fabric-sdk-py.git
$ cd fabric-sdk-py
$ make install
```

安装后可以检测sdk版本

```bash
$ python
>>> import hfc
>>> print(hfc.VERSION)
0.7.0
```

### 0.2.开启一个 Fabric Network

使用以下命令开启一个Fabric Network

```bash
$ docker pull hyperledger/fabric-peer:1.3.0
$ docker pull hyperledger/fabric-orderer:1.3.0
$ docker pull hyperledger/fabric-ca:1.3.0
$ docker pull hyperledger/fabric-ccenv:1.3.0
$ docker-compose -f test/fixtures/docker-compose-2orgs-4peers-tls.yaml up
```

然后你将有一个有3个组织的Fabric网络，网络拓扑结构如下：
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

## 1. 在Fabric网络中Channel的操作

* 使用sdk建立新的Channel并让peers加入

```python
from hfc.fabric import Client

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user(org_name='org1.example.com', name='Admin')

# Create a New Channel, the response should be true if succeed
response = cli.channel_create(
            orderer_name='orderer.example.com',
            channel_name='businesschannel',
            requestor=org1_admin,
            config_yaml='test/fixtures/e2e_cli/',
            channel_profile='TwoOrgsChannel'
            )
print(response==True)

# Join Peers into Channel, the response should be true if succeed
response = cli.channel_join(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com',
                           'peer1.org1.example.com']
               orderer_name='orderer.example.com'
               )
print(response==True)


# Join Peers from a different MSP into Channel
org2_admin = cli.get_user(org_name='org2.example.com', name='Admin')

# For operations on peers from org2.example.com, org2_admin is required as requestor
response = cli.channel_join(
               requestor=org2_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org2.example.com',
                           'peer1.org2.example.com']
               orderer_name='orderer.example.com'
               )
print(response==True)

```

### 1.1 操作示范

1. 将`configtxgen`加入到`PATH`路径下
![](https://fars.ee/wNYN.png)

2. 开启fabric客户端，确认客户端里没有Channel
![](https://fars.ee/Giad.png)

3. 进行建立Channel操作
![](https://fars.ee/AVXa.png)

    再次查看客户端Channel，发现新的Channel已经建立

4. 加入Peers

## 2. 在Fabric网络中进行Chaincode相关操作

* 使用sdk进行install, instantiate和invoke chaincode的操作

```python
from hfc.fabric import Client

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Install Chaincode to Peers
# This is only needed if to use the example chaincode inside sdk
import os
gopath_bak = os.environ.get('GOPATH', '')
gopath = os.path.normpath(os.path.join(
                      os.path.dirname(os.path.realpath('__file__')),
                      'test/fixtures/chaincode'
                     ))
os.environ['GOPATH'] = os.path.abspath(gopath)

# The response should be true if succeed
response = cli.chaincode_install(
               requestor=org1_admin,
               peer_names=['peer0.org1.example.com',
                           'peer1.org1.example.com']
               cc_path='github.com/example_cc',
               cc_name='example_cc',
               cc_version='v1.0'
               )

# Instantiate Chaincode in Channel, the response should be true if succeed
args = ['a', '200', 'b', '300']
response = cli.chaincode_instantiate(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               args=args,
               cc_name='example_cc',
               cc_version='v1.0'
               )

# Invoke a chaincode
args = ['a', 'b', '100']
# The response should be true if succeed
response = cli.chaincode_invoke(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               args=args,
               cc_name='example_cc',
               cc_version='v1.0'
               )

```

## 3. Query信息

```python
from hfc.fabric import Client

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Query Peer installed chaincodes, make sure the chaincode is installed
response = cli.query_installed_chaincodes(
               requestor=org1_admin,
               peer_names=['peer0.org1.example.com']
               )

"""
# An example response:

chaincodes {
  name: "example_cc"
  version: "1.0"
  path: "github.com/example_cc"
}
"""

# Query Peer Joined channel
response = cli.query_channels(
               requestor=org1_admin,
               peer_names=['peer0.org1.example.com']
               )

"""
# An example response:

channels {
  channel_id: "businesschannel"
}
"""

# Query Channel Info
response = cli.query_info(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com']
               )

# Query Block by tx id
# example txid of instantiated chaincode transaction
response = cli.query_block_by_txid(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               tx_id=cli.txid_for_test
                                  )
```

* 根据区块哈希值来访问区块

```python
from hfc.fabric import Client

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# first get the hash by calling 'query_info'
response = cli.query_info(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
                           )

test_hash = response.currentBlockHash

response = cli.query_block_by_hash(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               block_hash=test_hash
                           )
```

* 根据区块编号访问区块

```python
from hfc.fabric import Client

cli = Client(net_profile="test/fixtures/network.json")
org1_admin = cli.get_user('org1.example.com', 'Admin')

# Query Block by block number
response = cli.query_block(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               block_number='1'
               )

# Query Transaction by tx id
# example txid of instantiated chaincode transaction
response = cli.query_transaction(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               tx_id=cli.txid_for_test
               )

# Query Instantiated Chaincodes
response = cli.query_instantiated_chaincodes(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com']
               )
```

```python
# first get the hash by calling 'query_info'
response = cli.query_info(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
                           )

test_hash = response.currentBlockHash

response = cli.query_block_by_hash(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               block_hash=test_hash
                           )
                           
# Query Block by block number
response = cli.query_block(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               block_number='1'
               )

# Query Transaction by tx id
# example txid of instantiated chaincode transaction
response = cli.query_transaction(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com'],
               tx_id=cli.txid_for_test
               )

# Query Instantiated Chaincodes
response = cli.query_instantiated_chaincodes(
               requestor=org1_admin,
               channel_name='businesschannel',
               peer_names=['peer0.org1.example.com']
               )
               
# Query Peer Joined channel
response = cli.query_channels(
               requestor=org1_admin,
               peer_names=['peer0.org1.example.com']
               )
```

