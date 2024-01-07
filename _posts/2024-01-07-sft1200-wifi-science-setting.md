---
layout: post
title: "sft1200科学上网设置"
date: 2024-01-07 21:14:43
categories: router tutorial
tags: wifi router tutorial
---

马上要到农历新年了，所以有差旅+科学上网（工作）的需求，这两天看了不少方案，包括travel router（比如GLiNet的mt3000等）和最新5g cpe，然后就黄鱼淘了一支sft1200（主要是便宜，才100rmb），迅速设置了一下就可以愉快的使用了。

## sft1200安装shellclash（性能不高就这个比较合适）
```
export url='https://gh.jwsc.eu.org/master' && sh -c "$(curl -kfsSl $url/install.sh)" && source /etc/profile &> /dev/null
```

设置好以后登录 [ttp://192.168.8.1:9999/ui/#/proxies](http://192.168.8.1:9999/ui/#/proxies) 就可以访问了，注意不是31


## 其他
还有些操作来源这个[折腾指南](https://www.cnblogs.com/Edwardlyz/articles/16712323.html)

1. 关闭2.4Gwifi *试了但感觉提高不明显*
2. 超频
    ```
    echo 1000000 > /sys/devices/system/cpu/cpu0/cpufreq/scaling_setspeed
    ``` 
    *试了有所提高*
3. 提高5G wifi 功耗
    ```
    vim /etc/config/wireless
    ```
    在5G部分 country改为AU，txpower_max设置为31，之后去192.168.8.1的设置界面，将信道设置为149，功率设置为最高（31dbm） *试了有所提高*

### 操作前
![](/assets/images/sft1200-1.png)

### 操作后
![](/assets/images/sft1200-2.png)

## 总结
之后还是会关注5g cpe相关的，4g和5g的速率差距还是挺明显的。（不过5g需要锁n78频段）