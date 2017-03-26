---
title: Neural Network
date: 2017-02-01 21:22:50
category: notebook
tags: [learning, neural network]
---

[*Reference*](http://iamtrask.github.io/2015/07/12/basic-python-network/)


## Perceptrons

![](http://neuralnetworksanddeeplearning.com/images/tikz0.png)

multiple binary inputs -> a single binary output

## Understanding the code

```python
for i in range(10000):
	l0 = X
	l1 = sigmoid(np.dot(l0,syn0))
	error = y - l1
	delta = error * sigmoid_deriv(l1)
	syn0 += np.dot(l0.T, delta)

#print(l1) #result
```

Ok, our problem is understanding why the result will approach to the real answer with backpropagation.

First, we need to separate elements line by line. Every row inside l0 will multiply itself by syn0, more precisely row 1 in l0 will multiply syn0[0], syn0[1], syn[2] correspondingly and result in a guessed answer which normally will deviate from the actual answer. Then

## Conclusion

There are basically two types of neural network problems. First one is there is a connection between input and output like the code shown. The second one which is more common one is there is NO connection between input and output BUT there are certain patterns among the input which will result in the correct output and this is where things get interesting 
