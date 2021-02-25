import * as assert from 'assert';
import * as vscode from 'vscode';
import { extract, parse } from '../../metadata';


function asName(text?: string): string {
  return text
    ? text.replace(/\n/g, '\\n')
    : 'test';
}

suite('Markdown Metadata Tests', function () {
  vscode.window.showInformationMessage('Start all tests.');

  suite('#extract()', function () {

    suite('should return metadata if block is starting with --- and ending with --- or ..., like:', function () {
      [
        ['---\ntitle: metadata\nblock:metadata\n---', `title: metadata\nblock:metadata`],
        ['---\ntitle: metadata\nblock:metadata\n...', `title: metadata\nblock:metadata`],
        ['---\ntitle: metadata\nblock:metadata\n---\nwith more lines\nof\ntext', `title: metadata\nblock:metadata`],
        ['---\ntitle: metadata\nblock:metadata\n...\nwith more lines\nof\ntext', `title: metadata\nblock:metadata`],
        ['---\ntest\n---', `test`],
      ]
        .forEach(([value, expected]) => {
          test(asName(value), () => {
            assert.strictEqual(extract(value), expected);
          });
        });
    });

    suite('should return empty string if block is not starting with --- and ending with --- or ..., like:', () => {
      [
        '---\nstarting but not ending\n--',
        '---\nstarting: file\nbut: not ending\n.',
        '- \nnot: starting:\nbut: ending\n---',
        '-- \nnot: starting:\nbut: ending\n...',
        '\nnot: starting:\nbut: ending\n---',
        '\n---not: on first line:\nbut: ending\n---',
        'one line text',
        '--- also one line text',
        '--- this is not metadata ---',
        '--- this is not metadata ...',
        'two line\ntext',
        'this\nis\nnot\n\metadata',
        'this\n---\nis not\n---\nmetadata',
        '--- ---',
        '------',
        '---...',
        '--- ...',
        '---\n---',
        '---\n...'
      ]
        .forEach(function (text) {
          test(asName(text), function () {
            assert.strictEqual(extract(text), '');
          });
        });
    });
  });

  suite('#parse()', function () {

    suite('should return object with valid yaml block', () => {
      [
        {
          text: `title:  'This is the title: it contains a colon'\n` +
            `author:\n` +
            `- Author One\n` +
            `- Author Two\n` +
            `keywords: [fiction, writer, markdown]\n` +
            `tags: [draft]\n` +
            `abstract: |\n` +
            `  This is the abstract.\n` +
            `\n` +
            `  It consists of two paragraphs.`,
          expected: {
            title: 'This is the title: it contains a colon',
            author: ['Author One', 'Author Two'],
            keywords: ['fiction', 'writer', 'markdown'],
            tags: ['draft'],
            abstract: 'This is the abstract.\n\nIt consists of two paragraphs.\n',
          }
        },
        {
          text: `title: A Title`,
          expected: { title: 'A Title' }
        },
        {
          text: `Something`,
          expected: `Something`
        },
        {
          text: `42`,
          expected: 42
        }
      ].forEach(testValue => {
        test(asName(testValue.text), () => {
          assert.deepStrictEqual(parse(testValue.text), testValue.expected);
        });
      });
    });


    suite('should return undefined if empty or invalid yaml block', () => {
      ['',
        'not yaml',
        '{ "this": "is json" }',
        'unformated: yaml: block\ntitle: test'
      ].forEach(value => {
        test(value, () => {
          assert.strictEqual(parse(''), undefined);
        });
      });
    });
  });
});