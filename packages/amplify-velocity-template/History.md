## 1.1.3 2018-09-18

- fixes issue#113 support for add method on arrays by @gauravlanjekar [#114](https://github.com/shepherdwind/velocity.js/pull/114/)

## 1.1.2 2018-08-09

- fix Velocity cli error fix [#109](https://github.com/shepherdwind/velocity.js/issues/109)

## 1.1.1 2018-06-14

- fix: Allow own keySet, entrySet, put and size methods on objects by @lightsofapollo [!106](https://github.com/shepherdwind/velocity.js/pull/106)

## 1.1.0 2018-06-12

- feat: Add support for .put, fix issue [#103](https://github.com/shepherdwind/velocity.js/issues/103) by @lightsofapollo
- feat: add config.valueMapper support by @lightsofapollo [#105](https://github.com/shepherdwind/velocity.js/pull/105)

## 1.0.2 2018-06-06

- fix: ignore path where build on broswer, fix issue [#102](https://github.com/shepherdwind/velocity.js/issues/102)

## 1.0.1 2018-03-08

- fix: #set bug in nested #foreach loops [#100](https://github.com/shepherdwind/velocity.js/issues/100)

## 1.0.0 2018-01-13

- feat: support macro bodyContext [!97](https://github.com/shepherdwind/velocity.js/pull/97)

## 0.10.1 2017-11-10

- fix: #set variable key not work [!91](https://github.com/shepherdwind/velocity.js/issues/92)

## 0.10.0 2017-11-08

- feat: support text version of logical operators [!90](https://github.com/shepherdwind/velocity.js/pull/90)

## 0.9.6 2017-04-14

- fix: keep newline after unparse block [!83](https://github.com/shepherdwind/velocity.js/pull/83)

## 0.9.5 2017-04-07

- fix: support foreach.hasnext when iterating objects [!81](https://github.com/shepherdwind/velocity.js/pull/81)

## 0.9.4 2017-01-16

- fix: #set bug with eval string [#79](https://github.com/shepherdwind/velocity.js/issues/79)

## 0.9.3 2017-01-04

- fix: #set false when in forEach statement [#77](https://github.com/shepherdwind/velocity.js/issues/77)

## 0.9.1 2016-11-22

- add typescript DefinitelyTyped index.d.ts

## 0.9.0 2016-09-20

- feat: support to throw errors in case null values are used [!71](https://github.com/shepherdwind/velocity.js/issues/71)
- fix: support {end} [!70](https://github.com/shepherdwind/velocity.js/issues/71)

## 0.8.5 2016-07-16

- fix bug #foreach with nest empty foreach [!70](https://github.com/shepherdwind/velocity.js/pull/70)

## 0.8.4 2016-07-04

- fix bug when render `#foreach(${itemData} in ${defaultData})`, see
[#69](https://github.com/shepherdwind/velocity.js/issues/69#issuecomment-230152986)

## 0.8.3 2016-06-15

- fix comment bug [#67](https://github.com/shepherdwind/velocity.js/pull/67)

## 0.8.2 2016-05-28

- nothing change, just update npm page readme

## 0.8.0 2016-04-20

- set bug fix [#63](https://github.com/shepherdwind/velocity.js/issues/63)

### Break api change

Before set value will set undefined node as plan object

```
#set($a = {}) #set($a.c.d = 1) $a.c.d
```

This will output `1` .

But now, in 0.8.0 version, a.c will not set as {}, so output is `$a.c.d`.

## 0.7.5

- toString rewrite only when toString equal function { [native code]} [57](https://github.com/shepherdwind/velocity.js/pull/57)

## 0.7.4

- toString like org.apache.velocity when render [56](https://github.com/shepherdwind/velocity.js/pull/56)

## 0.7.3

- fix [53](https://github.com/shepherdwind/velocity.js/issues/52)
- runt support [54](https://github.com/shepherdwind/velocity.js/pull/54)

## 0.7.2

- fix: merge [52](https://github.com/shepherdwind/velocity.js/pull/52)

## 0.7.1

- fix: merge [51](https://github.com/shepherdwind/velocity.js/pull/51)

## 0.7.0

- feat: merge [49](https://github.com/shepherdwind/velocity.js/pull/49) and [#50](https://github.com/shepherdwind/velocity.js/pull/50)

## 0.6.2

- feat: merge [47](https://github.com/shepherdwind/velocity.js/pull/47)

## 0.6.1

- feat: merge [46](https://github.com/shepherdwind/velocity.js/pull/46)

## [0.6](https://github.com/shepherdwind/velocity.js/milestones/0.6)

- change: remove Velocity.Parser, change to Velocity.parse [#43](https://github.com/shepherdwind/velocity.js/issues/43)
- feat: add custom blocks support [#44](https://github.com/shepherdwind/velocity.js/issues/44)

## 0.4

### 0.4.11 / 2015-01-24

- feat: self define macro context keep to origin object

### 0.4.10 / 2015-01-08

- fix: allow optional space after colon in map passed as parameter to macro
      ([#38](https://github.com/shepherdwind/velocity.js/pull/38) by @jamescookie)

### 0.4.9 / 2014-12-29

- feature: support friendly error stack #35
- chore: improve coverage

### 0.4.8 / 2014-12-20

- fix issue #32
- Remove useless code: Helper
- merge pull request #34

### 0.4.7 / 2014-12-18

- fix issue #32
