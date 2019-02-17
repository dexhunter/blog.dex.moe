---
layout: post
title: "Understanding configuration files in Fabric"
date: 2019-02-16 14:18:45
categories: note
tags: docker configuration
---

Many times I see docker compose files used in Fabric but since I am new to both docker (container) and fabric (blockchain), I find it difficult to understand why these configuration works and which settings should I change in order to make the network running or functioning accordingly. This post is a summary of what I have learned.

# File Extensions

### .yaml (.yml)

> YAML (YAML Ain't Markup Language) is a human-readable data serialization language<sup>1</sup>

> It’s a strict superset of JSON, with the addition of syntactically significant newlines and indentation, like Python. Unlike Python, however, YAML doesn’t allow literal tab characters for indentation.<sup>2</sup>


### .json

> JSON (JavaScript Object Notation) is an open-standard file format that uses human-readable text to transmit data objects consisting of attribute-value pairs and array data types (or any other serializable value).<sup>3</sup>

# Docker Compose

> The Compose file is a YAML file defining services, networks, and volumes for a Docker application.<sup>4</sup>

```
version: '3'
services:
  web:
    build: .
    ports:
    - "5000:5000"
    volumes:
    - .:/code
    - logvolume01:/var/log
    links:
    - redis
  redis:
    image: redis
volumes:
  logvolume01: {}
```


# Examples

* base ([source files](https://github.com/hyperledger/fabric-samples/blob/master/first-network/base/docker-compose-base.yaml))
* cli
* couch
* e2e-template
* kafka
* org3

# Keys (with reference)

* [`version`](https://github.com/docker/docker.github.io/blob/master/compose/compose-file/compose-versioning.md#compatibility-matrix)
* [`service`](https://github.com/docker/docker.github.io/blob/master/compose/compose-file/index.md#service-configuration-reference)
* [`volume`](https://github.com/docker/docker.github.io/blob/master/compose/compose-file/compose-file-v2.md#volume-configuration-reference): mount host folders



---

1. [Wiki page of `yaml`](https://en.wikipedia.org/wiki/YAML)
2. [Learn yaml in Y minutes](https://learnxinyminutes.com/docs/yaml/)
3. [Wiki page of `json`](https://en.wikipedia.org/wiki/JSON)