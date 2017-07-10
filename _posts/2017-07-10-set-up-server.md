---
layout: post
title:  "Set up server"
categories: server
---

This post is to document how I install all the necessary components for a deep learning server without root previlege.

## install vim

Despite the default vi editor, vim is better for debugging and checking and more customizable.

1. ```wget ftp://ftp.vim.org/pub/vim/unix/vim-8.0.tar.bz2``` download the latest version of source code of vim (for me it is vim80)
2. ```tar xvf vim-8.0.tar.bz2``` extract
3. ```
./configure --with-features=huge \
            --enable-multibyte \
            --enable-rubyinterp=yes \
            --enable-pythoninterp=yes \
            --with-python-config-dir=/usr/lib/python2.7/config \
            --enable-python3interp=yes \
            --with-python3-config-dir=/usr/lib/python3.5/config \
            --enable-perlinterp=yes \
            --enable-luainterp=yes \
            --enable-gui=gtk2 --enable-cscope --prefix=/home/<your username>/vim80
```
I got the command from [YouCompleteMe](https://github.com/Valloric/YouCompleteMe/wiki/Building-Vim-from-source) and remember to change prefix according to your own case (can use `pwd` to see the current directory)
4. ```make```
5. ```make install```

#### Optinal

After successfully installed vim, I like using [vimrc](https://github.com/vim/vim) awesome version which is very handy.

## install tmux

You can use [my script](https://gist.github.com/DexHunter/b5f25b7ddfa9732ae577a7d1c5c07211)

or just copy from there

```
# Exit on error #
set -e

# Clean up #
rm -rf ~/tools/programs/libevent
rm -rf ~/tools/programs/ncurses
rm -rf ~/tools/programs/tmux

# Variable version #
TMUX_VERSION=2.2

# Create our directories #
mkdir -p ~/tools/test
mkdir -p ~/tools/programs/libevent
mkdir -p ~/tools/programs/ncurses
mkdir -p ~/tools/programs/tmux

############
# libevent #
############
cd ~/tools/test
wget https://github.com/downloads/libevent/libevent/libevent-2.0.19-stable.tar.gz
tar xvzf libevent-2.0.19-stable.tar.gz
cd libevent-*/
./configure --prefix=$HOME/tools/programs/libevent --disable-shared
make
make install

############
# ncurses  #
############
cd ~/tools/test
wget ftp://ftp.gnu.org/gnu/ncurses/ncurses-5.9.tar.gz
tar xvzf ncurses-5.9.tar.gz
cd ncurses-5.9
./configure --prefix=$HOME/tools/programs/ncurses LDFLAGS="-static"
make
make install

############
# tmux     #
############
cd ~/tools/test
wget -O tmux-${TMUX_VERSION}.tar.gz https://github.com/tmux/tmux/releases/download/${TMUX_VERSION}/tmux-${TMUX_VERSION}.tar.gz
tar xvzf tmux-${TMUX_VERSION}.tar.gz
cd tmux-${TMUX_VERSION}

# open configure and find the line that says:
# PKG_CONFIG="pkg-config --static"
# And comment it out:
# #PKG_CONFIG="pkg-config --static"

# Build #
./configure --prefix=$HOME/tools/programs/tmux --enable-static CFLAGS="-I$HOME/tools/programs/libevent/include -I$HOME/tools/programs/ncurses/include/ncurses -I$HOME/tools/programs/ncurses/include/" LDFLAGS="-static -L$HOME/tools/programs/libevent/lib -L$HOME/tools/programs/libevent/include -L$HOME/tools/programs/ncurses/lib -L$HOME/tools/programs/ncurses/include/ncurses" PKG_CONFIG=/bin/false
CPPFLAGS="-I$HOME/tools/programs/libevent/include -I$HOME/tools/programs/ncurses/include/ncurses" LDFLAGS="-static -L$HOME/tools/programs/libevent/lib -L$HOME/tools/programs/libevent/include -L$HOME/tools/programs/ncurses/lib -L$HOME/tools/programs/ncurses/include/ncurses" make

# Move #
cp tmux ~/bin/tmux
```

## install pip

checkout [this](https://gist.github.com/saurabhshri/46e4069164b87a708b39d947e4527298)

## install tensorflow

I installed it from source code using bazel

## install cudnn

You need to check nvidia official website and download the lateest version from there

## install virtualenv

Build from source. Download using git.

## install git

Check out on [stackoverflow](https://stackoverflow.com/questions/4039416/installing-git-with-non-root-user-account)

## install other things

I will first google it. Then if no good answer I will ask the admin to install it but he is reluctant to install for students and gives you a mouthful if you send another email. So it is best to use virtualenv and docker for your own good.
