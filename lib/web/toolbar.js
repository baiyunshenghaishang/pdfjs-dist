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

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Toolbar = void 0;

var _ui_utils = require("./ui_utils");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var PAGE_NUMBER_LOADING_INDICATOR = 'visiblePageIsLoading';
var SCALE_SELECT_CONTAINER_PADDING = 8;
var SCALE_SELECT_PADDING = 22;

var Toolbar =
/*#__PURE__*/
function () {
  function Toolbar(options, eventBus) {
    var l10n = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _ui_utils.NullL10n;

    _classCallCheck(this, Toolbar);

    this.toolbar = options.container;
    this.eventBus = eventBus;
    this.l10n = l10n;
    this.items = options;
    this._wasLocalized = false;
    this.reset();

    this._bindListeners();
  }

  _createClass(Toolbar, [{
    key: "setPageNumber",
    value: function setPageNumber(pageNumber, pageLabel) {
      this.pageNumber = pageNumber;
      this.pageLabel = pageLabel;

      this._updateUIState(false);
    }
  }, {
    key: "setPagesCount",
    value: function setPagesCount(pagesCount, hasPageLabels) {
      this.pagesCount = pagesCount;
      this.hasPageLabels = hasPageLabels;

      this._updateUIState(true);
    }
  }, {
    key: "setPageScale",
    value: function setPageScale(pageScaleValue, pageScale) {
      this.pageScaleValue = (pageScaleValue || pageScale).toString();
      this.pageScale = pageScale;

      this._updateUIState(false);
    }
  }, {
    key: "reset",
    value: function reset() {
      this.pageNumber = 0;
      this.pageLabel = null;
      this.hasPageLabels = false;
      this.pagesCount = 0;
      this.pageScaleValue = _ui_utils.DEFAULT_SCALE_VALUE;
      this.pageScale = _ui_utils.DEFAULT_SCALE;

      this._updateUIState(true);
    }
  }, {
    key: "_bindListeners",
    value: function _bindListeners() {
      var _this = this;

      var eventBus = this.eventBus,
          items = this.items;
      var self = this;
      items.previous.addEventListener('click', function () {
        eventBus.dispatch('previouspage', {
          source: self
        });
      });
      items.next.addEventListener('click', function () {
        eventBus.dispatch('nextpage', {
          source: self
        });
      });
      items.zoomIn.addEventListener('click', function () {
        eventBus.dispatch('zoomin', {
          source: self
        });
      });
      items.zoomOut.addEventListener('click', function () {
        eventBus.dispatch('zoomout', {
          source: self
        });
      });
      items.pageNumber.addEventListener('click', function () {
        this.select();
      });
      items.pageNumber.addEventListener('change', function () {
        eventBus.dispatch('pagenumberchanged', {
          source: self,
          value: this.value
        });
      });
      items.scaleSelect.addEventListener('change', function () {
        if (this.value === 'custom') {
          return;
        }

        eventBus.dispatch('scalechanged', {
          source: self,
          value: this.value
        });
      });
      items.presentationModeButton.addEventListener('click', function () {
        eventBus.dispatch('presentationmode', {
          source: self
        });
      });
      items.openFile.addEventListener('click', function () {
        eventBus.dispatch('openfile', {
          source: self
        });
      });
      items.print.addEventListener('click', function () {
        eventBus.dispatch('print', {
          source: self
        });
      });
      items.download.addEventListener('click', function () {
        eventBus.dispatch('download', {
          source: self
        });
      });
      items.scaleSelect.oncontextmenu = _ui_utils.noContextMenuHandler;
      eventBus.on('localized', function () {
        _this._localized();
      });
    }
  }, {
    key: "_localized",
    value: function _localized() {
      this._wasLocalized = true;

      this._adjustScaleWidth();

      this._updateUIState(true);
    }
  }, {
    key: "_updateUIState",
    value: function _updateUIState() {
      var resetNumPages = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (!this._wasLocalized) {
        return;
      }

      var pageNumber = this.pageNumber,
          pagesCount = this.pagesCount,
          pageScaleValue = this.pageScaleValue,
          pageScale = this.pageScale,
          items = this.items;

      if (resetNumPages) {
        if (this.hasPageLabels) {
          items.pageNumber.type = 'text';
        } else {
          items.pageNumber.type = 'number';
          this.l10n.get('of_pages', {
            pagesCount: pagesCount
          }, 'of {{pagesCount}}').then(function (msg) {
            items.numPages.textContent = msg;
          });
        }

        items.pageNumber.max = pagesCount;
      }

      if (this.hasPageLabels) {
        items.pageNumber.value = this.pageLabel;
        this.l10n.get('page_of_pages', {
          pageNumber: pageNumber,
          pagesCount: pagesCount
        }, '({{pageNumber}} of {{pagesCount}})').then(function (msg) {
          items.numPages.textContent = msg;
        });
      } else {
        items.pageNumber.value = pageNumber;
      }

      items.previous.disabled = pageNumber <= 1;
      items.next.disabled = pageNumber >= pagesCount;
      items.zoomOut.disabled = pageScale <= _ui_utils.MIN_SCALE;
      items.zoomIn.disabled = pageScale >= _ui_utils.MAX_SCALE;
      var customScale = Math.round(pageScale * 10000) / 100;
      this.l10n.get('page_scale_percent', {
        scale: customScale
      }, '{{scale}}%').then(function (msg) {
        var options = items.scaleSelect.options;
        var predefinedValueFound = false;

        for (var i = 0, ii = options.length; i < ii; i++) {
          var option = options[i];

          if (option.value !== pageScaleValue) {
            option.selected = false;
            continue;
          }

          option.selected = true;
          predefinedValueFound = true;
        }

        if (!predefinedValueFound) {
          items.customScaleOption.textContent = msg;
          items.customScaleOption.selected = true;
        }
      });
    }
  }, {
    key: "updateLoadingIndicatorState",
    value: function updateLoadingIndicatorState() {
      var loading = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var pageNumberInput = this.items.pageNumber;
      pageNumberInput.classList.toggle(PAGE_NUMBER_LOADING_INDICATOR, loading);
    }
  }, {
    key: "_adjustScaleWidth",
    value: function _adjustScaleWidth() {
      var container = this.items.scaleSelectContainer;
      var select = this.items.scaleSelect;

      _ui_utils.animationStarted.then(function () {
        if (container.clientWidth === 0) {
          container.setAttribute('style', 'display: inherit;');
        }

        if (container.clientWidth > 0) {
          select.setAttribute('style', 'min-width: inherit;');
          var width = select.clientWidth + SCALE_SELECT_CONTAINER_PADDING;
          select.setAttribute('style', 'min-width: ' + (width + SCALE_SELECT_PADDING) + 'px;');
          container.setAttribute('style', 'min-width: ' + width + 'px; ' + 'max-width: ' + width + 'px;');
        }
      });
    }
  }]);

  return Toolbar;
}();

exports.Toolbar = Toolbar;