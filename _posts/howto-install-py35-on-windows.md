---
title: How to install py35 kernel for jupyter notebook on Windows
date: 2017-03-06 20:37:54
categories: [notebook]
tags: [windows, anaconda, jupyter, installation, python]
---

## Show me the command (**preferably under anaconda terminal**)

`conda info --envs` To see if you have already installed python 3.5

`conda create --name py35 python=3` If not you can do this command.

'activate py35'

`path/to/python35 -m ipykernel install <options>`

or `python -m ipykernel install --name py35`

Done

### It is so simple why do you open a new post?

Well, to start with, I installed the latest anaconda with a default python3.6 version. But since I need to use tensorflow, I want a kernel of python3.5. I tried docker at first, but gcr is blocked in China because GFW. Then since anaconda is by default py3.6, I had a hard time configuring how to set a kernel with py3.5. But gladly I figured all out and now I am set to test all applcations written with tensorflow.
