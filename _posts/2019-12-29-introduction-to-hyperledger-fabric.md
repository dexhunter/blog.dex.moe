---
layout: post
title: "Introduction to Hyperledger Fabric"
date: 2019-12-29 10:27:04
categories: tutorial
tags: fabric
---

Most contents are adapted from [official hyperledger website](https://www.hyperledger.org/) and some Chinese materials are from [*blockchain guide*](https://github.com/yeasy/blockchain_guide) by [Dr. Baohua Yang](https://yeasy.github.io/) (my previous mentor and lead of *fabric-sdk-py*). This tutorial is also based on my presentation at ZJU blockchain association and slides are available [here](https://slides.dex.moe)

---

## What is Hyperledger?

> Hyperledger is an open source collaborative effort created to advance cross-industry blockchain technologies.

超级账本(Hyperledger)是一个致力于推动跨产业区块链技术发展的开源平台。依托于Linux基金会，超级账本项目吸引了包括IBM、Intel、Cisco、DAH、摩根大通、R3、甲骨文、百度、腾讯等在内的众多科技和金融巨头的参与贡献。其应用实践囊括了金融、银行、物联网(IoT)、供应链等诸多领域。成立两年多时间以来，超级账本得到了广泛的关注和飞速的发展，目前有近三百家企业会员。超级账本的开源代码和技术，也成为分布式账本领域的首选。


## What is Fabric?

![](/assets/images/fabric.png)

Fabric是一个面向企业商用的分布式账本平台，其创新地引入了权限管理支持，设计上支持可插拔、可扩展，是首个面向联盟链场景的开源项目。

作为最早加入到超级账本项目中的顶级项目，Fabric 由 IBM、DAH 等企业于 2015 年底联合贡献到社区。项目在 Github 上地址为 [https://github.com/hyperledger/fabric](https://github.com/hyperledger/fabric)。

Fabric项目基于Go语言实现，贡献者超过160人，总提交次数已经超过15000次，核心代码数超过15万行。

Fabric项目目前处于活跃状态，已发布2.0.0版本，同时包括Fabric CA、Fabric SDK等多个相关的子项目。

项目的邮件列表地址为[fabric@lists.hyperledger.org](mailto:fabric@lists.hyperledger.org)。


## Fabric中的一些关键概念

* Identity 身份
  * 区块链网络中的不同参与者包括 Peer 节点、排序节点、客户端应用程序、管理员等等。这些参与者都有一个封装在 X.509 数字证书 (Certificate Authority, CA) 中的数字身份。这些身份决定了参与者在区块链网络中对资源的确切权限和对信息的访问权限。
  * Certificate Authority（CA）：负责身份权限管理，又叫 Member Service 或 Identity Service。
* Membership Service Provider 成员服务提供者
  * 识别出哪些根 CA 和中间 CA 是受到信任来定义某个信任领域的成员的，例如，一个组织。
  * 成员服务的抽象访问接口，实现对不同成员服务的可拔插支持。
* Peers 节点
  * 节点托管着账本和智能合约
  * Committer（提交节点）：1.0 架构中一种 peer 节点角色，负责对 orderer 排序后的交易进行检查，选择合法的交易执行并写入存储。
  * Endorser（背书节点）：1.0 架构中一种 peer 节点角色，负责检验某个交易是否合法，是否愿意为之背书、签名。
  * Orderer（排序节点）：1.0 架构中的共识服务角色，负责排序看到的交易，提供全局确认的顺序。
  * Validating Peer（验证节点）：维护账本的核心节点，参与一致性维护、对交易的验证和执行。
  * Non-validating Peer（非验证节点）：不参与账本维护，仅作为交易代理响应客户端的 REST 请求，并对交易进行一些基本的有效性检查，之后转发给验证节点。
* Smart Contracts and Chaincode 智能合约和链码
  * 区块链上的应用代码，扩展自“智能合约”概念，支持 golang、nodejs 等，运行在隔离的容器环境中。
  * 通常，智能合约定义的是控制世界状态中业务对象生命周期的交易逻辑，随后该交易逻辑被打包进链码，紧接着链码会被部署到区块链网络中。可以将智能合约看成交易的管理者，而链码则管理着如何将智能合约打包用于部署。
* Ledger 账本
  * 包括区块链结构（带有所有的可验证交易信息，但只有最终成功的交易会改变世界观）和当前的世界观（world state）。Ledger 仅存在于 Peer 节点。
  * World State（世界观）：是一个键值数据库，chaincode 用它来存储交易相关的状态。


## Fabric架构设计

区块链是一个分布式系统，由许多相互通信的节点组成。区块链运行链码来保存状态和账本数据，并执行交易。链码是核心元素，因为交易是调用链码的操作。交易必须“背书”，只有背书的交易才可以提交并对状态产生影响。可能存在一个或多个用于管理方法和参数的特殊链码，称之为*系统链码*。

Fabric的架构设计有以下几个优势：

* **链码信任的灵活性。**该架构将链码(区块链应用程序)的*信任假设*与排序的信任假设分开。换句话说，排序服务可能由一组节点(排序节点)提供，并可以容忍其中一些节点出现故障或不当行为，而且每个链码的背书者可能不同。 
* **可扩展性。**由于负责特定链码的背书节点与排序节点是无关的，因此系统的*扩展性*会比由相同的节点完成这些功能更好。特别是当不同的链码指定不同的背书节点时，这会让背书节点的链码互相隔离，并允许并行执行链码（背书）。因此，代价高昂的链码执行从排序服务的关键路径中删除了。
* **机密性。**本架构有助于部署对其交易的内容和状态更新具有“机密性”要求的链码。
* **共识模块化。**该架构是*模块化*的，允许可插拔的共识算法（即排序服务）实现。

整个功能架构如下图所示。

![](/assets/images/refarch.png)

主要有三大组件：区块链服务（Blockchain）、链码服务（Chaincode）、成员权限管理（Membership）。

### 区块链服务

区块链服务提供一个分布式账本平台。一般地，多个交易被打包进区块中，多个区块构成一条区块链。区块链代表的是账本状态机发生变更的历史过程。

#### 交易

交易意味着围绕着某个链码进行操作。

交易可以改变世界状态。

交易中包括的内容主要有：

* 交易类型：目前包括 Deploy、Invoke 两种；
* uuid：代表交易的唯一编号；
* 链码编号 chaincodeID：交易针对的链码；
* 负载内容的 hash 值：Deploy 或 Invoke 时候可以指定负载内容；
* 交易的保密等级 ConfidentialityLevel；
* 交易相关的 metadata 信息；
* 临时生成值 nonce：跟安全机制相关；
* 交易者的证书信息 cert；
* 签名信息 signature；
* metadata 信息；
* 时间戳 timestamp。

交易的数据结构（Protobuf 格式）定义为

```protobuf
message Transaction {
    enum Type {
        UNDEFINED = 0;
        // deploy a chaincode to the network and call `Init` function
        CHAINCODE_DEPLOY = 1;
        // call a chaincode `Invoke` function as a transaction
        CHAINCODE_INVOKE = 2;
        // call a chaincode `query` function
        CHAINCODE_QUERY = 3;
        // terminate a chaincode; not implemented yet
        CHAINCODE_TERMINATE = 4;
    }
    Type type = 1;
    //store ChaincodeID as bytes so its encrypted value can be stored
    bytes chaincodeID = 2;
    bytes payload = 3;
    bytes metadata = 4;
    string uuid = 5;
    google.protobuf.Timestamp timestamp = 6;

    ConfidentialityLevel confidentialityLevel = 7;
    string confidentialityProtocolVersion = 8;
    bytes nonce = 9;

    bytes toValidators = 10;
    bytes cert = 11;
    bytes signature = 12;
}
```

在 1.0 架构中，一个 transaction 包括如下信息：

[ledger] [channel], **proposal:**[chaincode, <function name, arguments>] **endorsement:**[proposal hash, simulation result, signature]

* endorsements: proposal hash, simulation result, signature
* function-spec: function name, arguments
* proposal: [channel,] chaincode, <function-spec>

#### 交易背书的流程

![](/assets/images/fabric_tx_flow.png)

如图所示，主要是四步：
1. 客户端创建一个交易并将其发送给它所指定的背书节点
2. 背书节点模拟交易并生成背书签名
3. 提交客户端收集交易背书并向排序服务广播
4. 排序服务将交易发送给节点


#### 区块

区块打包交易，确认交易后的世界状态。

一个区块中包括的内容主要有：

* 版本号 version：协议的版本信息；
* 时间戳 timestamp：由区块提议者设定；
* 交易信息的默克尔树的根 hash 值：由区块所包括的交易构成；
* 世界观的默克尔树的根 hash 值：由交易发生后整个世界的状态值构成；
* 前一个区块的 hash 值：构成链所必须；
* 共识相关的元数据：可选值；
* 非 hash 数据：不参与 hash 过程，各个 peer 上的值可能不同，例如本地提交时间、交易处理的返回值等；

_注意具体的交易信息并不存放在区块中。_

区块的数据结构（Protobuf 格式）定义为

```protobuf
message Block {
    uint32 version = 1;
    google.protobuf.Timestamp timestamp = 2;
    repeated Transaction transactions = 3;
    bytes stateHash = 4;
    bytes previousBlockHash = 5;
    bytes consensusMetadata = 6;
    NonHashData nonHashData = 7;
}
```

一个真实的区块内容示例：

```json
{
    "nonHashData": {
        "localLedgerCommitTimestamp": {
            "nanos": 975295157,
                "seconds": 1466057539
        },
            "transactionResults": [
            {
                "uuid": "7be1529ee16969baf9f3156247a0ee8e7eee99a6a0a816776acff65e6e1def71249f4cb1cad5e0f0b60b25dd2a6975efb282741c0e1ecc53fa8c10a9aaa31137"
            }
            ]
    },
        "previousBlockHash": "RrndKwuojRMjOz/rdD7rJD/NUupiuBuCtQwnZG7Vdi/XXcTd2MDyAMsFAZ1ntZL2/IIcSUeatIZAKS6ss7fEvg==",
        "stateHash": "TiIwROg48Z4xXFFIPEunNpavMxnvmZKg+yFxKK3VBY0zqiK3L0QQ5ILIV85iy7U+EiVhwEbkBb1Kb7w1ddqU5g==",
        "transactions": [
        {
            "chaincodeID": "CkdnaXRodWIuY29tL2h5cGVybGVkZ2VyL2ZhYnJpYy9leGFtcGxlcy9jaGFpbmNvZGUvZ28vY2hhaW5jb2RlX2V4YW1wbGUwMhKAATdiZTE1MjllZTE2OTY5YmFmOWYzMTU2MjQ3YTBlZThlN2VlZTk5YTZhMGE4MTY3NzZhY2ZmNjVlNmUxZGVmNzEyNDlmNGNiMWNhZDVlMGYwYjYwYjI1ZGQyYTY5NzVlZmIyODI3NDFjMGUxZWNjNTNmYThjMTBhOWFhYTMxMTM3",
            "payload": "Cu0BCAESzAEKR2dpdGh1Yi5jb20vaHlwZXJsZWRnZXIvZmFicmljL2V4YW1wbGVzL2NoYWluY29kZS9nby9jaGFpbmNvZGVfZXhhbXBsZTAyEoABN2JlMTUyOWVlMTY5NjliYWY5ZjMxNTYyNDdhMGVlOGU3ZWVlOTlhNmEwYTgxNjc3NmFjZmY2NWU2ZTFkZWY3MTI0OWY0Y2IxY2FkNWUwZjBiNjBiMjVkZDJhNjk3NWVmYjI4Mjc0MWMwZTFlY2M1M2ZhOGMxMGE5YWFhMzExMzcaGgoEaW5pdBIBYRIFMTAwMDASAWISBTIwMDAw",
            "timestamp": {
                "nanos": 298275779,
                "seconds": 1466057529
            },
            "type": 1,
            "uuid": "7be1529ee16969baf9f3156247a0ee8e7eee99a6a0a816776acff65e6e1def71249f4cb1cad5e0f0b60b25dd2a6975efb282741c0e1ecc53fa8c10a9aaa31137"
        }
    ]
}
```

#### 世界观 (World State)
世界观用于存放链码执行过程中涉及到的状态变量，是一个键值数据库。典型的元素为 `[chaincodeID, ckey]: value` 结构。

为了方便计算变更后的 hash 值，一般采用默克尔树数据结构进行存储。树的结构由两个参数（`numBuckets` 和 `maxGroupingAtEachLevel`）来进行初始配置，并由 `hashFunction` 配置决定存放键值到叶子节点的方式。显然，各个节点必须保持相同的配置，并且启动后一般不建议变动。

* `numBuckets`：叶子节点的个数，每个叶子节点是一个桶（bucket），所有的键值被 `hashFunction` 散列分散到各个桶，决定树的宽度；
* `maxGroupingAtEachLevel`：决定每个节点由多少个子节点的 hash 值构成，决定树的深度。

其中，桶的内容由它所保存到键值先按照 chaincodeID 聚合，再按照升序方式组成。

### 链码服务

链码包含所有的处理逻辑，并对外提供接口，外部通过调用链码接口来改变世界观。

#### 接口和操作
链码需要实现 Chaincode 接口，以被 验证节点调用。

```go
type Chaincode interface { Init(stub *ChaincodeStub, function string, args []string) ([]byte, error) Invoke(stub *ChaincodeStub, function string, args []string) ([]byte, error) Query(stub *ChaincodeStub, function string, args []string) ([]byte, error)}
```

链码目前支持的交易类型包括：部署（Deploy）、调用（Invoke）和查询（Query）。

* 部署：验证节点利用链码创建沙盒，沙盒启动后，处理 protobuf 协议的 shim 层一次性发送包含 ChaincodeID 信息的 REGISTER 消息给 验证节点，进行注册，注册完成后，验证节点通过 gRPC 传递参数并调用链码 Init 函数完成初始化；
* 调用：验证节点发送 TRANSACTION 消息给链码沙盒的 shim 层，shim 层用传过来的参数调用链码的 Invoke 函数完成调用；
* 查询：验证节点发送 QUERY 消息给链码沙盒的 shim 层，shim 层用传过来的参数调用链码的 Query 函数完成查询。

不同链码之间可能互相调用和查询。

#### 容器

在实现上，链码需要运行在隔离的容器中，超级账本采用了 Docker 作为默认容器。

对容器的操作支持三种方法：build、start、stop，对应的接口为 VM。

```go
type VM interface { 
  build(ctxt context.Context, id string, args []string, env []string, attachstdin bool, attachstdout bool, reader io.Reader) error 
  start(ctxt context.Context, id string, args []string, env []string, attachstdin bool, attachstdout bool) error 
  stop(ctxt context.Context, id string, timeout uint, dontkill bool, dontremove bool) error 
}
```
链码部署成功后，会创建连接到部署它的 验证节点的 gRPC 通道，以接受后续 Invoke 或 Query 指令。


#### gRPC 消息
验证节点和容器之间通过 gRPC 消息来交互。消息基本结构为

```protobuf
message ChaincodeMessage {

 enum Type { UNDEFINED = 0; REGISTER = 1; REGISTERED = 2; INIT = 3; READY = 4; TRANSACTION = 5; COMPLETED = 6; ERROR = 7; GET_STATE = 8; PUT_STATE = 9; DEL_STATE = 10; INVOKE_CHAINCODE = 11; INVOKE_QUERY = 12; RESPONSE = 13; QUERY = 14; QUERY_COMPLETED = 15; QUERY_ERROR = 16; RANGE_QUERY_STATE = 17; }

 Type type = 1; google.protobuf.Timestamp timestamp = 2; bytes payload = 3; string uuid = 4;}
```

当发生链码部署时，容器启动后发送 `REGISTER` 消息到 验证节点。如果成功，验证节点返回 `REGISTERED` 消息，并发送 `INIT` 消息到容器，调用链码中的 Init 方法。

当发生链码调用时，验证节点发送 `TRANSACTION` 消息到容器，调用其 Invoke 方法。如果成功，容器会返回 `RESPONSE` 消息。

类似的，当发生链码查询时，验证节点发送 `QUERY` 消息到容器，调用其 Query 方法。如果成功，容器会返回 `RESPONSE` 消息。

### 成员权限管理

通过基于 PKI 的成员权限管理，平台可以对接入的节点和客户端的能力进行限制。

证书有三种，Enrollment，Transaction，以及确保安全通信的 TLS 证书。

* 注册证书 ECert：颁发给提供了注册凭证的用户或节点，一般长期有效；
* 交易证书 TCert：颁发给用户，控制每个交易的权限，一般针对某个交易，短期有效。
* 通信证书 TLSCert：控制对网络的访问，并且防止窃听。


## Fabric Python SDK的使用

详见本博客另一篇博文： [使用fabric-sdk-py对网络操作](/fabric/2018/11/12/fabric-sdk-py-operations.html)