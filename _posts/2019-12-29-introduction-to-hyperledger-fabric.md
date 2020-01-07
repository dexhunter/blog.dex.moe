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

Fabric作为一个分布式账本平台，其中一个核心概念是账本（ledger）。Fabric中账本由两部分组成 - 世界观(world state)和区块链(blockchain)。

整个功能架构如下图所示。

![](/assets/images/refarch.png)

主要有三大组件：区块链服务（Blockchain）、链码服务（Chaincode）、成员权限管理（Membership）。

### 区块链服务

区块链服务提供一个分布式账本平台。一般地，多个交易被打包进区块中，多个区块构成一条区块链。区块链代表的是账本状态机发生变更的历史过程。

#### 交易

交易意味着围绕着某个链码进行操作。 交易可以改变世界状态。在新版本的gRPC服务中交易有交易动作（transaction action）。而交易动作有头文（header）和负载（payload）组成。

其中头文主要包含以下信息：

* 通道头文：
    * version：版本；
    * 时间戳 timestamp；
    * channel_id：通道id；
    * tx_id：代表交易的唯一编号；
    * epoch：当前周期（头文生成的周期）
    * tls_cert_hash：当mutual TLS启用时，客户TLS证书的hash值；
* 签名头文
    * creator：签名身份
    * 临时生成值 nonce：跟安全机制相关。

具体来说，交易的数据结构（Protobuf 格式）定义为

```protobuf
message Transaction {

    // The payload is an array of TransactionAction. An array is necessary to
    // accommodate multiple actions per transaction
    repeated TransactionAction actions = 1;
}

// TransactionAction binds a proposal to its action.  The type field in the
// header dictates the type of action to be applied to the ledger.
message TransactionAction {

    // The header of the proposal action, which is the proposal header
    bytes header = 1;

    // The payload of the action as defined by the type in the header For
    // chaincode, it's the bytes of ChaincodeActionPayload
    bytes payload = 2;
}
```

其中 `Header` 定义为

```protobuf
message Header {
    bytes channel_header = 1;
    bytes signature_header = 2;
}

// Header is a generic replay prevention and identity message to include in a signed payload
message ChannelHeader {
    int32 type = 1; // Header types 0-10000 are reserved and defined by HeaderType

    // Version indicates message protocol version
    int32 version = 2;

    // Timestamp is the local time when the message was created
    // by the sender
    google.protobuf.Timestamp timestamp = 3;

    // Identifier of the channel this message is bound for
    string channel_id = 4;

    // An unique identifier that is used end-to-end.
    //  -  set by higher layers such as end user or SDK
    //  -  passed to the endorser (which will check for uniqueness)
    //  -  as the header is passed along unchanged, it will be
    //     be retrieved by the committer (uniqueness check here as well)
    //  -  to be stored in the ledger
    string tx_id = 5;

    // The epoch in which this header was generated, where epoch is defined based on block height
    // Epoch in which the response has been generated. This field identifies a
    // logical window of time. A proposal response is accepted by a peer only if
    // two conditions hold:
    // 1. the epoch specified in the message is the current epoch
    // 2. this message has been only seen once during this epoch (i.e. it hasn't
    //    been replayed)
    uint64 epoch = 6;

    // Extension that may be attached based on the header type
    bytes extension = 7;

    // If mutual TLS is employed, this represents
    // the hash of the client's TLS certificate
    bytes tls_cert_hash = 8;
}

message SignatureHeader {
    // Creator of the message, a marshaled msp.SerializedIdentity
    bytes creator = 1;

    // Arbitrary number that may only be used once. Can be used to detect replay attacks.
    bytes nonce = 2;
}
```

`ChaincodeActionPayload`定义为

```protobuf
// ChaincodeAction contains the actions the events generated by the execution
// of the chaincode.
message ChaincodeAction {
    reserved 5;
    reserved "token_operations";

    // This field contains the read set and the write set produced by the
    // chaincode executing this invocation.
    bytes results = 1;

    // This field contains the events generated by the chaincode executing this
    // invocation.
    bytes events = 2;

    // This field contains the result of executing this invocation.
    Response response = 3;

    // This field contains the ChaincodeID of executing this invocation. Endorser
    // will set it with the ChaincodeID called by endorser while simulating proposal.
    // Committer will validate the version matching with latest chaincode version.
    // Adding ChaincodeID to keep version opens up the possibility of multiple
    // ChaincodeAction per transaction.
    ChaincodeID chaincode_id = 4;
}
```

#### 交易背书的流程

![](/assets/images/fabric_tx_flow.png)

如图所示，主要是四步：
1. 客户端创建一个交易并将其发送给它所指定的背书节点
2. 背书节点模拟交易并生成背书签名
3. 提交客户端收集交易背书并向排序服务广播
4. 排序服务将交易发送给节点


#### 区块

区块打包交易，确认交易后的世界状态。

一个区块中主要由三部分组成：

* 区块头 Block Header
  * 区块数：一个由0开始的整数(int)，0为创世区块
  * 当前区块的哈希： 这个区块里所有的交易的哈希值
  * 前一个区块的哈希：前一个区块的哈希值
* 区块数据 Block Data
  * 包含交易序列
  * 在区块生成时被排序服务生成
* 区块的元数据 Block Metadata
  * 包含区块生成者的证书和签名（可用来验证）
  * 这部分并不会用来生成区块哈希值

![](/assets/images/ledger-tx.png)

*区块头细节如图所示。*

区块的数据结构（Protobuf 格式）定义为

```protobuf
message Block {
    BlockHeader header = 1;
    BlockData data = 2;
    BlockMetadata metadata = 3;
}
```

其中 `BlockHeader`, `BlockData` , `BlockMetadata` 定义为

```protobuf
message BlockHeader {
    uint64 number = 1; // The position in the blockchain
    bytes previous_hash = 2; // The hash of the previous block header
    bytes data_hash = 3; // The hash of the BlockData, by MerkleTree
}

message BlockData {
    repeated bytes data = 1;
}

message BlockMetadata {
    repeated bytes metadata = 1;
}
```

一个真实的区块内容示例在本博客[这里下载](/assets/sample.block)


#### 世界观 (World State)

世界观用于存放链码执行过程中涉及到的状态变量，是一个键值**数据库**。典型的元素为 `{key=K, value=V} version=0` 结构。

开发者编写的应用可以启动智能合约使用简单的账本API来获得(get)，放置(put)，删除(delete)状态变量。应用可以上传交易使得世界观存贮的键值发生变化，其中应用仅仅是上传交易，和得到交易是否成功（是否有足够多的背书节点同意变化并签名）的返回，这些应用并不会参与共识机制。

世界观的键值中包含了一个`version`，这个数字只用于fabric内部，并随着状态变量的改动而递增(+1)。当状态更新后，这个版本号会被用来验证状态是否更新成功。

### 链码服务

链码包含所有的处理逻辑，并对外提供接口，外部通过调用链码接口来改变世界观。

#### 接口和操作

链码有两个主要接口（Interface），一个是 `Chaincode` 接口，以接收交易信息（Transaction），另一个是 `ChaincodeStubInterface` 接口，用来获取、修改账本信息和在不同链码间的服务调用。目前接口实现有 Golang, Javascript, Java 三种语言。

一个样例的链码如下所示。

```go
package main

import (
    "fmt"

    "github.com/hyperledger/fabric/core/chaincode/shim"
    "github.com/hyperledger/fabric/protos/peer"
)

// SimpleAsset implements a simple chaincode to manage an asset
type SimpleAsset struct {
}

// Init is called during chaincode instantiation to initialize any
// data. Note that chaincode upgrade also calls this function to reset
// or to migrate data.
func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {
    // Get the args from the transaction proposal
    args := stub.GetStringArgs()
    if len(args) != 2 {
            return shim.Error("Incorrect arguments. Expecting a key and a value")
    }

    // Set up any variables or assets here by calling stub.PutState()

    // We store the key and the value on the ledger
    err := stub.PutState(args[0], []byte(args[1]))
    if err != nil {
            return shim.Error(fmt.Sprintf("Failed to create asset: %s", args[0]))
    }
    return shim.Success(nil)
}

// Invoke is called per transaction on the chaincode. Each transaction is
// either a 'get' or a 'set' on the asset created by Init function. The Set
// method may create a new asset by specifying a new key-value pair.
func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
    // Extract the function and args from the transaction proposal
    fn, args := stub.GetFunctionAndParameters()

    var result string
    var err error
    if fn == "set" {
            result, err = set(stub, args)
    } else { // assume 'get' even if fn is nil
            result, err = get(stub, args)
    }
    if err != nil {
            return shim.Error(err.Error())
    }

    // Return the result as success payload
    return shim.Success([]byte(result))
}

// Set stores the asset (both key and value) on the ledger. If the key exists,
// it will override the value with the new one
func set(stub shim.ChaincodeStubInterface, args []string) (string, error) {
    if len(args) != 2 {
            return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
    }

    err := stub.PutState(args[0], []byte(args[1]))
    if err != nil {
            return "", fmt.Errorf("Failed to set asset: %s", args[0])
    }
    return args[1], nil
}

// Get returns the value of the specified asset key
func get(stub shim.ChaincodeStubInterface, args []string) (string, error) {
    if len(args) != 1 {
            return "", fmt.Errorf("Incorrect arguments. Expecting a key")
    }

    value, err := stub.GetState(args[0])
    if err != nil {
            return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
    }
    if value == nil {
            return "", fmt.Errorf("Asset not found: %s", args[0])
    }
    return string(value), nil
}

// main function starts up the chaincode in the container during instantiate
func main() {
    if err := shim.Start(new(SimpleAsset)); err != nil {
            fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
    }
}
```

### 成员权限管理

通过基于 PKI 的成员权限管理，平台可以对接入的节点和客户端的能力进行限制。

![](/assets/images/msp-diagram.png)

MSP主要如图所示，主要由以下几个组成：
* 根 CA：包含根CA自主签名的X.509证书列表；
* 中间 CA：包含受这个组织信任的中间 CA 对应的 X.509 证书列表；
* 组织单元 （OU）：包含组织单元的一个列表；
* 管理员：该文件夹包含了一个身份列表，其中的身份为该组织定义了哪些操作者担任管理员；
* 撤销证书：包含被撤销身份的参与者；
* 节点身份：包含节点的 X.509 证书用来在网络中验证身份；
* 私钥：根据 Peer 节点或排序节点的本地MSP定义包含节点的签名私钥；
* TLS 根 CA：TLS通信时使用的根CA自主签名的X.509证书列表；
* TLS 中间 CA：TLS通信时使用的这个 MSP 所代表的的组织所信任的中间 CA 证书列表。

## Fabric Python SDK的使用

详见本博客另一篇博文： [使用fabric-sdk-py对网络操作](/fabric/2018/11/12/fabric-sdk-py-operations.html)

-----

## References

1. [Hyperledger Docs](https://hyperledger-fabric.readthedocs.io/)
2. [Blockchain Guide](https://github.com/yeasy/blockchain_guide)