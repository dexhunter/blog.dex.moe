---
title: git useage
date: 2017-02-01 15:05:03
category: notebook
tags:
---

## First, fork a repo

I use example of Snoop Knife, you can find it [there](https://github.com/octocat/Spoon-Knife)

`git clone https://github.com/YOUR-USERNAME/Spoon-Knife`

You can check remote status by 'git remote -v'

Link: [What is remote](https://dexhunter.github.io/2017/02/01/Github-new/)

## Second, create a branch `upstream`

`git checkout -b upstream` is one way to do it.

But the common case you will encounter is that `upstream` corresponds to **original author's code** 

So in this case what we will do is `git remote add upstream https://github.com/octocat/Spoon-Knife.git`

This will configure the remote to point to upstream repo in git

Then verify by `git remote -v`

## Third, sync branch `upstream`

`git fetch upstream`

`git checkout master`

`git merge upstream/master`

## Fourth, pull request

After you fixed a bug or wrote some new features, you can `git commit -am "message"` and `git push` to push to the remote on you repo. Then there is a function called **pull request** on the front page of you Github repo. Click that and create a PR for author's to see.

