/**
 * @licstart The following is the entire license notice for the
 * Javascript code in this page
 *
 * Copyright 2019 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * Javascript code in this page
 */
"use strict";

var _parser = require("../../core/parser");

var _util = require("../../shared/util");

var _primitives = require("../../core/primitives");

var _stream = require("../../core/stream");

describe('parser', function () {
  describe('Parser', function () {
    describe('inlineStreamSkipEI', function () {
      it('should skip over the EI marker if it is found', function () {
        var string = 'q 1 0 0 1 0 0 cm BI /W 10 /H 10 /BPC 1 ' + '/F /A85 ID abc123~> EI Q';
        var input = new _stream.StringStream(string);
        var parser = new _parser.Parser({
          lexer: new _parser.Lexer(input),
          xref: null,
          allowStreams: true
        });
        parser.inlineStreamSkipEI(input);
        expect(input.pos).toEqual(string.indexOf('Q'));
        expect(input.peekByte()).toEqual(0x51);
      });
      it('should skip to the end of stream if the EI marker is not found', function () {
        var string = 'q 1 0 0 1 0 0 cm BI /W 10 /H 10 /BPC 1 ' + '/F /A85 ID abc123~> Q';
        var input = new _stream.StringStream(string);
        var parser = new _parser.Parser({
          lexer: new _parser.Lexer(input),
          xref: null,
          allowStreams: true
        });
        parser.inlineStreamSkipEI(input);
        expect(input.pos).toEqual(string.length);
        expect(input.peekByte()).toEqual(-1);
      });
    });
  });
  describe('Lexer', function () {
    describe('nextChar', function () {
      it('should return and set -1 when the end of the stream is reached', function () {
        var input = new _stream.StringStream('');
        var lexer = new _parser.Lexer(input);
        expect(lexer.nextChar()).toEqual(-1);
        expect(lexer.currentChar).toEqual(-1);
      });
      it('should return and set the character after the current position', function () {
        var input = new _stream.StringStream('123');
        var lexer = new _parser.Lexer(input);
        expect(lexer.nextChar()).toEqual(0x32);
        expect(lexer.currentChar).toEqual(0x32);
      });
    });
    describe('peekChar', function () {
      it('should only return -1 when the end of the stream is reached', function () {
        var input = new _stream.StringStream('');
        var lexer = new _parser.Lexer(input);
        expect(lexer.peekChar()).toEqual(-1);
        expect(lexer.currentChar).toEqual(-1);
      });
      it('should only return the character after the current position', function () {
        var input = new _stream.StringStream('123');
        var lexer = new _parser.Lexer(input);
        expect(lexer.peekChar()).toEqual(0x32);
        expect(lexer.currentChar).toEqual(0x31);
      });
    });
    describe('getNumber', function () {
      it('should stop parsing numbers at the end of stream', function () {
        var input = new _stream.StringStream('11.234');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getNumber()).toEqual(11.234);
      });
      it('should parse PostScript numbers', function () {
        var numbers = ['-.002', '34.5', '-3.62', '123.6e10', '1E-5', '-1.', '0.0', '123', '-98', '43445', '0', '+17'];

        for (var _i = 0, _numbers = numbers; _i < _numbers.length; _i++) {
          var number = _numbers[_i];
          var input = new _stream.StringStream(number);
          var lexer = new _parser.Lexer(input);
          var result = lexer.getNumber(),
              expected = parseFloat(number);

          if (result !== expected && Math.abs(result - expected) < 1e-15) {
            console.error("Fuzzy matching \"".concat(result, "\" with \"").concat(expected, "\" to ") + 'work-around rounding bugs in Chromium browsers.');
            expect(true).toEqual(true);
            continue;
          }

          expect(result).toEqual(expected);
        }
      });
      it('should ignore double negative before number', function () {
        var input = new _stream.StringStream('--205.88');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getNumber()).toEqual(-205.88);
      });
      it('should ignore minus signs in the middle of number', function () {
        var input = new _stream.StringStream('205--.88');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getNumber()).toEqual(205.88);
      });
      it('should ignore line-breaks between operator and digit in number', function () {
        var minusInput = new _stream.StringStream('-\r\n205.88');
        var minusLexer = new _parser.Lexer(minusInput);
        expect(minusLexer.getNumber()).toEqual(-205.88);
        var plusInput = new _stream.StringStream('+\r\n205.88');
        var plusLexer = new _parser.Lexer(plusInput);
        expect(plusLexer.getNumber()).toEqual(205.88);
      });
      it('should treat a single decimal point as zero', function () {
        var input = new _stream.StringStream('.');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getNumber()).toEqual(0);
        var numbers = ['..', '-.', '+.', '-\r\n.', '+\r\n.'];

        var _loop = function _loop() {
          var number = _numbers2[_i2];
          var input = new _stream.StringStream(number);
          var lexer = new _parser.Lexer(input);
          expect(function () {
            return lexer.getNumber();
          }).toThrowError(_util.FormatError, /^Invalid number:\s/);
        };

        for (var _i2 = 0, _numbers2 = numbers; _i2 < _numbers2.length; _i2++) {
          _loop();
        }
      });
      it('should handle glued numbers and operators', function () {
        var input = new _stream.StringStream('123ET');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getNumber()).toEqual(123);
        expect(lexer.currentChar).toEqual(0x45);
      });
    });
    describe('getString', function () {
      it('should stop parsing strings at the end of stream', function () {
        var input = new _stream.StringStream('(1$4)');

        input.getByte = function (super_getByte) {
          var ch = super_getByte.call(input);
          return ch === 0x24 ? -1 : ch;
        }.bind(input, input.getByte);

        var lexer = new _parser.Lexer(input);
        expect(lexer.getString()).toEqual('1');
      });
      it('should ignore escaped CR and LF', function () {
        var input = new _stream.StringStream('(\\101\\\r\n\\102\\\r\\103\\\n\\104)');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getString()).toEqual('ABCD');
      });
    });
    describe('getHexString', function () {
      it('should not throw exception on bad input', function () {
        var input = new _stream.StringStream('<7 0 2 15 5 2 2 2 4 3 2 4>');
        var lexer = new _parser.Lexer(input);
        expect(lexer.getHexString()).toEqual('p!U"$2');
      });
    });
    describe('getName', function () {
      it('should handle Names with invalid usage of NUMBER SIGN (#)', function () {
        var inputNames = ['/# 680 0 R', '/#AQwerty', '/#A<</B'];
        var expectedNames = ['#', '#AQwerty', '#A'];

        for (var i = 0, ii = inputNames.length; i < ii; i++) {
          var input = new _stream.StringStream(inputNames[i]);
          var lexer = new _parser.Lexer(input);
          expect(lexer.getName()).toEqual(_primitives.Name.get(expectedNames[i]));
        }
      });
    });
  });
  describe('Linearization', function () {
    it('should not find a linearization dictionary', function () {
      var stream1 = new _stream.StringStream('3 0 obj\n' + '<<\n' + '/Length 4622\n' + '/Filter /FlateDecode\n' + '>>\n' + 'endobj');
      expect(_parser.Linearization.create(stream1)).toEqual(null);
      var stream2 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 0\n' + '>>\n' + 'endobj');
      expect(_parser.Linearization.create(stream2)).toEqual(null);
    });
    it('should accept a valid linearization dictionary', function () {
      var stream = new _stream.StringStream('131 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O 133\n' + '/H [ 1388 863 ]\n' + '/L 90\n' + '/E 43573\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      var expectedLinearizationDict = {
        length: 90,
        hints: [1388, 863],
        objectNumberFirst: 133,
        endFirst: 43573,
        numPages: 18,
        mainXRefEntriesOffset: 193883,
        pageFirst: 0
      };
      expect(_parser.Linearization.create(stream)).toEqual(expectedLinearizationDict);
    });
    it('should reject a linearization dictionary with invalid ' + 'integer parameters', function () {
      var stream1 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O 133\n' + '/H [ 1388 863 ]\n' + '/L 196622\n' + '/E 43573\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      expect(function () {
        return _parser.Linearization.create(stream1);
      }).toThrow(new Error('The "L" parameter in the linearization ' + 'dictionary does not equal the stream length.'));
      var stream2 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O 133\n' + '/H [ 1388 863 ]\n' + '/L 84\n' + '/E 0\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      expect(function () {
        return _parser.Linearization.create(stream2);
      }).toThrow(new Error('The "E" parameter in the linearization ' + 'dictionary is invalid.'));
      var stream3 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O /abc\n' + '/H [ 1388 863 ]\n' + '/L 89\n' + '/E 43573\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      expect(function () {
        return _parser.Linearization.create(stream3);
      }).toThrow(new Error('The "O" parameter in the linearization ' + 'dictionary is invalid.'));
    });
    it('should reject a linearization dictionary with invalid hint parameters', function () {
      var stream1 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O 133\n' + '/H 1388\n' + '/L 80\n' + '/E 43573\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      expect(function () {
        return _parser.Linearization.create(stream1);
      }).toThrow(new Error('Hint array in the linearization dictionary ' + 'is invalid.'));
      var stream2 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O 133\n' + '/H [ 1388 ]\n' + '/L 84\n' + '/E 43573\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      expect(function () {
        return _parser.Linearization.create(stream2);
      }).toThrow(new Error('Hint array in the linearization dictionary ' + 'is invalid.'));
      var stream3 = new _stream.StringStream('1 0 obj\n' + '<<\n' + '/Linearized 1\n' + '/O 133\n' + '/H [ 1388 863 0 234]\n' + '/L 93\n' + '/E 43573\n' + '/N 18\n' + '/T 193883\n' + '>>\n' + 'endobj');
      expect(function () {
        return _parser.Linearization.create(stream3);
      }).toThrow(new Error('Hint (2) in the linearization dictionary ' + 'is invalid.'));
    });
  });
});