---
layout: post
title: "Learning OpenGL"
math: false
---

## Getting Started

First, install `glfw` according to [quick guide](http://www.glfw.org/docs/latest/quick_guide.html)

#### My Environment
```
Ubuntu 16.04
gcc 5.4
```

#### How to install(Compile)

1. Install X.org header packages
`sudo apt-get install xorg-dev` 

2. Get the source code
`git clone git@github.com:glfw/glfw.git`

3. Make an out-of-tree build
```
cd glfw
mkdir build
cd build
cmake ..
make all
```

4. Write a test program <hello.cpp>
```c++
#include <GLFW/glfw3.h>
int main()
{
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    //glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);

    return 0;
}
```

5. Compile manually
`g++ -std=c++11 main.cpp -o out -lGL -lGLU -lglfw3 -lX11 -lXxf86vm -lXrandr -lpthread -lXi -ldl`


## Before you go
Try to write a `CMakeLists.txt` to make compilation eaiser

## Update (Dec. 7th 2017)

Since Assignment 2's deadline is coming, I am re-picking OpenGL. I have switched to `arch` this time (just try out different Linux distribution and found this one is better(with xfce4)).

So in arch the complication command changed. Now it is 
```
g++ -o <output name> <input file> -lGL -lglut -lGLU
```
You can add `lpthread` if you want. I saw this additional link at [arch bbs](https://bbs.archlinux.org/viewtopic.php?id=195334) but I don't really need to do this.


