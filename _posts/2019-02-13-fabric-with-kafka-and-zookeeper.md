---
layout: post
title: "Hyperledger Fabric with Kafka and Zookeeper MultiNode Cluster Setup"
date: 2019-02-13 00:39:16
categories: note
tags: fabric kafka zookeeper
---

Today we are going to investigate how to set up a fabric network with kafka and zookeeper. As a beginner, first we need to understand what is kafka and zookeeper.

# Background

## Apache Kafka

> Apache Kafka is an open-source stream-processing software platform<sup>0</sup>.

> Kafka is a distributed, horizontally-saclable, fault-tolerant, commit log<sup>1</sup>.

Since commit log is **a record of transactions**, Kafka can easily integrates with blockchain platform. Therefore, I think this is the reason why the first "consensus" of Fabric is utilising Kafka while the next would be based on Raft<sup>2</sup>.

## Zookeeper

Zookeeper is a general purpose distribtued process coordination system, it helps to coordinate tasks, manage state, configure, etc accross a distributed system.

## Ordering Service

Ordering Service consists of orderers, providing `a shared communication channel` to clients and peers and offering a broadcast service for messages containing transactions.

OSN (Ordering Service Node/ Orderer Node): connected with the endorsers and peers

### Understanding the role of ordering service in fabric network

![Fabric transaction flow](/assets/images/fabric_tx_flow.png)

*Image Source: [Hyperledger Fabric: A Distributed Operating System for Permissioned Blockchains](https://arxiv.org/pdf/1801.10228.pdf)*

# Configurations

* For kafka & zookeep, refer  to [this](https://github.com/hyperledger/fabric/blob/release-1.4/orderer/common/server/docker-compose.yml)

# Deployment

*Disclaimer: this is based on [fabric-samples/first-network](https://github.com/hyperledger/fabric-samples/tree/release-1.4/first-network)*


# FAQ

1. If kafka is a streaming-process software, why are we calling kafka-consensus in fabric?

- First, we need to understand what is consensus. The definition of `consensus` is `a general agreement`<sup>3</sup> and in the context of blockchain, it means **all nodes must agree to the same order of transactions/blocks** to achieve a universal shared ledger
- Kafka provides the same order of transactions among multiple nodes by a shared queue as ordering nodes send to Kafka transactions and receive from Kafka transactions in the same order.


---

0. [Wiki page of `kafka`](https://en.wikipedia.org/wiki/Apache_Kafka)
1. [Through INtroduction to Apache Kafka](https://hackernoon.com/thorough-introduction-to-apache-kafka-6fbf2989bbc1)
2. [Fabric Proposal: A Raft-Based Ordering Service](https://docs.google.com/document/d/138Brlx2BiYJm5bzFk_B0csuEUKYdXXr7Za9V7C76dwo/edit)
3. [Search Result of `consensus`](https://www.google.com/search?q=consensus)