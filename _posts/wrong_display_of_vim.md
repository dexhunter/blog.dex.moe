---
title: Wrong Display of Vim
date: 2017-02-02 21:08:45
category: experiment
tags: [bug, vim]
---

## The beginning of story
Today I was trying to write some code as usual. Since I always write code on notepad++ and compile the code manually, to imporve effiency I was wondering if I can use just one terminal to deal all tasks which means coding in vim at first and compile it on the same terminal henceafter. However, as I am using Windows with powershell and vim installed, I opened the terminal, wrote something inside vim editor. But the color scheme is not easy to adapt since some syntax are really dark. ![]( http://static.zybuluo.com/xdx24/1fohpymmlvn91qp3afub5kdo/232.png) See the `import` there.

## Meet the bug
 I tried several built-in colorscheme but they all seem weird at some point. At first, I thought color scheme is not compatible with python syntax but I tried open `.java` or `.js`, they all don't work well. [some examples](https://github.com/flazz/vim-colorschemes). I downloaded one called `vim-lucius` from github and then the result is this:![](http://static.zybuluo.com/xdx24/ksfw7pfsjdynvjlbvn698zo8/wrongcolor.png) 
What??? The color is totally different from what I would expect.
I found the reason is something about support of xterm-256color. So I tried to import `TERM` to `xterm-256color` according to [this](http://stackoverflow.com/questions/559816/how-to-export-and-import-environment-variables-in-windows) and [this](http://superuser.com/questions/370556/vim-colors-not-working-properly-in-terminal) But it didn't work.

## The reason
So I just searched on google and find the it's because windows bash does not support xterm-256-color. What??? I hate using windows more. :/ ([reference](https://github.com/Microsoft/BashOnWindows/issues/345)) People at Microsoft said they will support it soon. But I cannot use it yet, so meh. 

## End
At the end, I switched back to notepad++. (I would use vim on ubuntu) I felt dumb when using windows but still, it is faster to boot on my laptop. Maybe I should consider buying a ubuntu laptop in the future.
