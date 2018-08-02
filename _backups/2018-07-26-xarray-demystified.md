---
layout: post
title: "Xarray Demystified"
date: 2018-07-26 22:19:22
categories: xarray data-science
tags: tutorial
---

I have been using [`xarray`](http://xarray.pydata.org/en/stable/) for quite a while now. Our project uses `pandas.Panel` to handle 3-Dimensional data, however `Panel` is going to be [deprecated](https://github.com/pandas-dev/pandas/issues/13563) thus I think it's good time that we switch to xarray. In our private repo, we convert the `Panel` to `DataArray` directly but the step involves convert to `Panel` first which is not desired. I then was wondering to find a way to solve
the probelm.

Luckily, it is very easy to do. We can just extract the value from dict of DataFrames and use `xarray.Dataset(dict).to_array()` or `xarray.concat(DataArray)` to make the transition.
