/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _setImmediate2 = require("babel-runtime/core-js/set-immediate");

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TAIL = (0, _symbol2.default)("tail");

/**
 * Dequeue jobs.
 *
 * @param {Queue} queue - A job queue instance.
 * @param {object} item - The current job item.
 * @returns {void}
 */
function dequeue(queue, item) {
    item.action(function () {
        if (item.next) {
            (0, _setImmediate3.default)(dequeue, queue, item.next);
        } else {
            queue[TAIL] = null;
        }
    });
}

/**
 * Job Queue.
 *
 * @private
 */
module.exports = function () {
    /**
     * Constructor.
     */
    function Queue() {
        (0, _classCallCheck3.default)(this, Queue);

        this[TAIL] = null;
    }

    /**
     * Adds a job item into this queue.
     *
     *     queue.push(done => {
     *         // do something.
     *         done();
     *     });
     *
     * @param {function} action - The action of new job.
     * @returns {void}
     */


    (0, _createClass3.default)(Queue, [{
        key: "push",
        value: function push(action) {

            var item = { action: action, next: null };
            if (this[TAIL] != null) {
                this[TAIL] = this[TAIL].next = item;
            } else {
                this[TAIL] = item;
                (0, _setImmediate3.default)(dequeue, this, item);
            }
        }
    }]);
    return Queue;
}();