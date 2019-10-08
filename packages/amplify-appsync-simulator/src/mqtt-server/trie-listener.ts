import { Qlobber } from 'qlobber';

import { AbstractListener, Settings } from './abstract-listener';
import { defer } from './util';

export class TrieListener extends AbstractListener {
  private matcher;
  constructor(settings: Settings = {}) {
    super(settings);
    this.matcher = new Qlobber({
      separator: settings.separator || '/',
      wildcard_one: settings.wildcardOne || '+',
      wildcard_some: settings.wildcardSome || '*',
    });

    this.emit('ready');
  }

  subscribe(topic, callback, done) {
    this._raiseIfClosed();
    this.matcher.add(topic, callback);
    defer(done);
  }

  publish(topic, message, options, done = () => {}) {
    this._raiseIfClosed();
    var cbs = this.matcher.match(topic);

    for (var i = 0; i < cbs.length; i++) {
      cbs[i](topic, message, options);
    }
    defer(done);
  }

  unsubscribe(topic, callback, done = () => {}) {
    this._raiseIfClosed();
    this.matcher.remove(topic, callback);
    defer(done);
  }
  close(done = () => {}) {
    this.matcher.clear();
    this.emit('closed');
    defer(done);
  }
}
