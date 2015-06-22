# Safegit

If you're like me, sometimes you forget to lint your commits.  Then you push them, and it is oh so embarassing when your build job says "Hey, you stupid idiot, even I know that this code is bad."  Well, now you have the solution.  Safegit lets you define command line operations to be carried out before you are allowed to run git commands.  So, in my case, before I push I want to run our grunt task that lints.  All I have to do is define a `.safegit.json` file in either my home directory or the project directory and add this:

```
{
  "push": "grunt jshint"
}
```

And *BAM!* no more embarassment.

## .safegit.json

You can either specify commands to run before other commands, or you can specify totally custom shortcuts.  For example, checking out a PR,

```
{
  "review": [
    "commands": [
      "git fetch upstream pull/$1/head:pr-$1",
      "git checkout pr-$1"
    ]
  ]
}
```

This will fetch the PR with the first argument (of the form `safegit review $1 $2 $3 ...`) and check it out locally.
