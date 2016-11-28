/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var Mirror = require("../worker/mirror").Mirror;
var htmllint = require('../lib/htmllint');

var lintOptions = {
	'attr-bans': [
		'background',
		'bgcolor',
		'frameborder',
		'longdesc',
		'marginwidth',
		'marginheight',
		'scrolling'
	],
	'attr-quote-style': 'quoted',
	'tag-bans': ['script'],
	'doctype-first': true,
	'line-end-style': false,
	'indent-style': false,
	'indent-width': false,
	'spec-char-escape':true,
	'id-no-dup': true,
	'title-max-len': false,
	'id-class-style': false,
	'img-req-alt': 'allownull',
	'img-req-src': true
};

var errorTypes = {
    "expected-doctype-but-got-start-tag": "info",
    "expected-doctype-but-got-chars": "info",
    "non-html-root": "info"
}

var Worker = exports.Worker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(400);
    this.context = null;
};

oop.inherits(Worker, Mirror);

(function() {

    this.setOptions = function(options) {
        this.context = options.context;
    };

    this.onUpdate = function() {
        var that = this;
        var value = this.doc.getValue();
        if (!value)
            return;

        var linter = new htmllint.Linter(htmllint.rules)

		linter.lint(value, lintOptions)
			.then(function (issues) {
				var resultIssues = issues.map(function (issue) {
					return {
						row: issue.line-1,
						column: issue.column-1,
						text: htmllint.messages.renderIssue(issue),
						//text: htmllint.messages.renderIssue(issue)+' - '+JSON.stringify(issue),
						type: 'error'
					};
				});
				console.warn('issues',resultIssues);
				that.sender.emit('error', resultIssues);
			})
			.catch(function (err) {
				// MC: muahahahahah :D
				console.error(err);
				that.sender.emit('error', [
					{	
						row: 0,
						column: 0,
						text: 'Message code is badly formatted. Please, cleanup your HTML.',
						type: 'error'
					}
				]);
				//throw ('[htmllint error in ' + filename + ' ] ' + err);
			});

    };

}).call(Worker.prototype);

});
