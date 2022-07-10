// ==UserScript==
// @name        Jenkins Console Colors and Shortcuts
// @author      zarjay
// @version     2.0.0
// @description Adds colors to the Jenkins console output
// @match       https://*/job/*/console*
// @license     MIT License; https://github.com/zarjay/userscripts/blob/master/LICENSE
// ==/UserScript==
// Fork of https://openuserjs.org/meta/zarjay/Jenkins_Console_Colors.meta.js

function userscriptConsoleJumpTo(id){
    var a = document.getElementById(id);
    window.scrollTo(0, a.offsetTop);
}

(function() {
    'use strict';
    const PREFIX = `userscript-console-`;
    function css(content) {
        const element = document.createElement('style');
        element.textContent = content;
        document.head.appendChild(element);
    }

    function getType(line) {
        const markers = {
            error: [
                /ERROR|FAILED|FAILURE|exception/i
            ],

            warning: [
                /\d Warning/,
                /\[SKIP]/
            ],

            success: [
                /^Passed/,
                / 0 failed/,
                /Build succeeded/,
                /Finished: SUCCESS/,
                /build result: success/i,
            ],

            important: [
                /xUnit\.net console test runner/,
                /Test Execution Command Line Tool/,
                /Build Engine/,
                / 0 (Warning|Error)/,
                /^Build started/
            ],

            normal: [
                /^\s*\d+&gt;/
            ]
        };

        for (const type in markers) {
            for (const pattern of markers[type]) {
                if (pattern.test(line)) {
                    return type;
                }
            }
        }

        return 'minor';
    }

    function include(url) {
        return new Promise((resolve, reject) => {
            const element = document.createElement('script');
            element.src = url;
            element.async = false;
            element.onload = resolve;
            element.onerror = reject;
            document.head.appendChild(element);
        });
    }

    function getTocBlock(){
        let toc = document.querySelector('.toc');
        if (!toc) {
            let outputElement = document.querySelector('pre.console-output');
            toc = document.createElement('ul');
            toc.className = `${PREFIX}toc`;
            outputElement.parentNode.insertBefore(toc, outputElement);
        }
        return toc;
    }

    function parseBlock(block) {
        console.log('Processing text block', block);
        block.classList.add('parsed');

        let tocBlock = getTocBlock();

        const lines = block.innerHTML.split('\n');
        const html = [];
        let tocIndex = 0;

        let currentLine = 0;

        (function parseChunk() {
            for (let i = 0; i < 20; ++i, ++currentLine) {
                if (currentLine >= lines.length) {
                    block.innerHTML = html.join('');
                    return;
                }

                const line = lines[currentLine];
                const match = /^(\s*)(.*)/.exec(line);
                const className = getType(line);
                const spaces = '&nbsp'.repeat(match[1].length);
                const content = ansi_up.ansi_to_html(match[2]);

                let isToc = (className !== 'minor' && className !== 'normal');
                html.push(`<div class="${`${PREFIX}${className}`}" ${isToc?`id="${PREFIX}${++tocIndex}"`:""}>${spaces}${content}</div>`);
                if (isToc) {
                    const li = document.createElement('li');
                    li.className = `${PREFIX}toc-item ${PREFIX}${className}`;
                    const a = document.createElement('a');
                    a.href=`#${PREFIX}${tocIndex}`;
                    a.innerHTML = content;
                    a.innerText = a.innerText;
                    li.appendChild(a);
                    tocBlock.appendChild(li);
                }
            }

            setTimeout(parseChunk, 0);
        })();
    }

    function parseBlocks() {
        query('pre.console-output:not(.parsed), #out pre:not(.parsed)').forEach(parseBlock);
    }

    function query(selector) {
        return Array.from(document.querySelectorAll(selector));
    }



    css(`
    .${PREFIX}minor                      { color: #666 }
    .${PREFIX}normal                     { color: #000 }
    .${PREFIX}important, .${PREFIX}toc .${PREFIX}important * { color: #08C }
    .${PREFIX}success,   .${PREFIX}toc .${PREFIX}success * { color: #080 }
    .${PREFIX}warning,   .${PREFIX}toc .${PREFIX}warning * { color: #F0F }
    .${PREFIX}error,     .${PREFIX}toc .${PREFIX}error * { color: #F00 }
    .${PREFIX}toc a {font-weight: initial;}
`);

    include('https://cdn.rawgit.com/drudru/ansi_up/32a3c2deb983579fe6149fba4938ce0f840d2afd/ansi_up.js')
        .then(() => setInterval(parseBlocks, 200));
})();
