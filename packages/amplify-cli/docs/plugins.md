# Plugin Guide for Amplify

Plugins enable you to add features to Amplify, such as commands and
extensions to the `context` object that provides the majority of the functionality
used by Amplify.

To create an Amplify plugin, create a repo with the following folders:

```
commands/
extensions/
```

A command is a file that looks something like the following:

```js
// commands/foo.js

module.exports = (context) => {
  const { print, filesystem } = context

  const desktopDirectories = filesystem.subdirectories(`~/Desktop`)
  print.info(desktopDirectories)
}
```

You can use extensions to add additional features to `context`, like the following:

```js
// extensions/bar-extension.js

module.exports = (context) => {
  const { print } = context

  context.bar = () => { print.info('Bar!') }
}
```

You can access extensions from your plugin's commands as `context.bar`.

# Loading a Plugin

All plugin names must start with `amplify-*`. To load a particular plugin, install it to your project using `npm install --save-dev amplify-PLUGINNAME` and then amplify picks it up automatically.
