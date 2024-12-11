// AnchorJS Library
(function(root, factory) {
    'use strict';
  
    if (typeof define === 'function' && define.amd) {
      define([], factory);
    } else if (typeof module === 'object' && module.exports) {
      module.exports = factory();
    } else {
      root.AnchorJS = factory();
      root.anchors = new root.AnchorJS();
    }
  }(globalThis, function() {
    'use strict';
  
    function AnchorJS(options) {
      this.options = options || {};
      this.elements = [];
  
      /**
       * Assigns options to the internal options object, and provides defaults.
       * @param {Object} opts
       */
      function _applyRemainingDefaultOptions(opts) {
        opts.icon = Object.prototype.hasOwnProperty.call(opts, 'icon') ? opts.icon : '\uE9CB';
        opts.visible = Object.prototype.hasOwnProperty.call(opts, 'visible') ? opts.visible : 'hover';
        opts.placement = Object.prototype.hasOwnProperty.call(opts, 'placement') ? opts.placement : 'right';
        opts.ariaLabel = Object.prototype.hasOwnProperty.call(opts, 'ariaLabel') ? opts.ariaLabel : 'Anchor';
        opts.class = Object.prototype.hasOwnProperty.call(opts, 'class') ? opts.class : '';
        opts.base = Object.prototype.hasOwnProperty.call(opts, 'base') ? opts.base : '';
        opts.truncate = Object.prototype.hasOwnProperty.call(opts, 'truncate') ? Math.floor(opts.truncate) : 64;
        opts.titleText = Object.prototype.hasOwnProperty.call(opts, 'titleText') ? opts.titleText : '';
      }
  
      _applyRemainingDefaultOptions(this.options);
  
      /**
       * Add anchor links to page elements.
       * @param  {String|Array|Nodelist} selector - A CSS selector for targeting the elements you wish to add anchor links
       *                                            to. Also accepts an array or nodeList containing the relavant elements.
       * @return {this}                           - The AnchorJS object
       */
      this.add = function(selector) {
        var elements,
            elsWithIds,
            idList,
            elementID,
            i,
            index,
            count,
            tidyText,
            newTidyText,
            anchor,
            hrefBase,
            indexesToDrop = [];
  
        _applyRemainingDefaultOptions(this.options);
  
        if (!selector) {
          selector = 'h2, h3, h4, h5, h6';
        }
  
        elements = _getElements(selector);
  
        if (elements.length === 0) {
          return this;
        }
  
        _addBaselineStyles();
  
        elsWithIds = document.querySelectorAll('[id]');
        idList = [].map.call(elsWithIds, function(el) {
          return el.id;
        });
  
        for (i = 0; i < elements.length; i++) {
          if (this.hasAnchorJSLink(elements[i])) {
            indexesToDrop.push(i);
            continue;
          }
  
          if (elements[i].hasAttribute('id')) {
            elementID = elements[i].getAttribute('id');
          } else if (elements[i].hasAttribute('data-anchor-id')) {
            elementID = elements[i].getAttribute('data-anchor-id');
          } else {
            tidyText = this.urlify(elements[i].textContent);
  
            newTidyText = tidyText;
            count = 0;
            do {
              if (index !== undefined) {
                newTidyText = tidyText + '-' + count;
              }
  
              index = idList.indexOf(newTidyText);
              count += 1;
            } while (index !== -1);
  
            index = undefined;
            idList.push(newTidyText);
  
            elements[i].setAttribute('id', newTidyText);
            elementID = newTidyText;
          }
  
          anchor = document.createElement('a');
          anchor.className = 'anchorjs-link ' + this.options.class;
          anchor.setAttribute('aria-label', this.options.ariaLabel);
          anchor.setAttribute('data-anchorjs-icon', this.options.icon);
          if (this.options.titleText) {
            anchor.title = this.options.titleText;
          }
  
          hrefBase = document.querySelector('base') ? window.location.pathname + window.location.search : '';
          hrefBase = this.options.base || hrefBase;
          anchor.href = hrefBase + '#' + elementID;
  
          if (this.options.visible === 'always') {
            anchor.style.opacity = '1';
          }
  
          if (this.options.icon === '\uE9CB') {
            anchor.style.font = '1em/1 anchorjs-icons';
  
            if (this.options.placement === 'left') {
              anchor.style.lineHeight = 'inherit';
            }
          }
  
          if (this.options.placement === 'left') {
            anchor.style.position = 'absolute';
            anchor.style.marginLeft = '-1.25em';
            anchor.style.paddingRight = '.25em';
            anchor.style.paddingLeft = '.25em';
            elements[i].insertBefore(anchor, elements[i].firstChild);
          } else {
            anchor.style.marginLeft = '.1875em';
            anchor.style.paddingRight = '.1875em';
            anchor.style.paddingLeft = '.1875em';
            elements[i].appendChild(anchor);
          }
        }
  
        for (i = 0; i < indexesToDrop.length; i++) {
          elements.splice(indexesToDrop[i] - i, 1);
        }
  
        this.elements = this.elements.concat(elements);
  
        return this;
      };
  
      /**
       * Removes all anchorjs-links from elements targeted by the selector.
       * @param  {String|Array|Nodelist} selector - A CSS selector string targeting elements with anchor links,
       *                                            OR a nodeList / array containing the DOM elements.
       * @return {this}                           - The AnchorJS object
       */
      this.remove = function(selector) {
        var index,
            domAnchor,
            elements = _getElements(selector);
  
        for (var i = 0; i < elements.length; i++) {
          domAnchor = elements[i].querySelector('.anchorjs-link');
          if (domAnchor) {
            index = this.elements.indexOf(elements[i]);
            if (index !== -1) {
              this.elements.splice(index, 1);
            }
  
            elements[i].removeChild(domAnchor);
          }
        }
  
        return this;
      };
  
      /**
       * Removes all anchorjs links. Mostly used for tests.
       */
      this.removeAll = function() {
        this.remove(this.elements);
      };
  
      /**
       * Urlify - Refine text so it makes a good ID.
       *
       * To do this, we remove apostrophes, replace non-safe characters with hyphens,
       * remove extra hyphens, truncate, trim hyphens, and make lowercase.
       *
       * @param  {String} text - Any text. Usually pulled from the webpage element we are linking to.
       * @return {String}      - hyphen-delimited text for use in IDs and URLs.
       */
      this.urlify = function(text) {
        var textareaElement = document.createElement('textarea');
        textareaElement.innerHTML = text;
        text = textareaElement.value;
  
        var nonsafeChars = /[& +$,:;=?@"#{}|^~[`%!'<>\]./()*\\\n\t\b\v\u00A0]/g;
  
        if (!this.options.truncate) {
          _applyRemainingDefaultOptions(this.options);
        }
  
        return text.trim()
          .replace(/'/gi, '')
          .replace(nonsafeChars, '-')
          .replace(/-{2,}/g, '-')
          .substring(0, this.options.truncate)
          .replace(/^-+|-+$/gm, '')
          .toLowerCase();
      };
  
      /**
       * Determines if this element already has an AnchorJS link on it.
       * Uses this technique: https://stackoverflow.com/a/5898748/1154642
       * @param    {HTMLElement}  el - a DOM node
       * @return   {Boolean}     true/false
       */
      this.hasAnchorJSLink = function(el) {
        var hasLeftAnchor = el.firstChild && (' ' + el.firstChild.className + ' ').indexOf(' anchorjs-link ') > -1,
            hasRightAnchor = el.lastChild && (' ' + el.lastChild.className + ' ').indexOf(' anchorjs-link ') > -1;
  
        return hasLeftAnchor || hasRightAnchor || false;
      };
  
      /**
      @param  {String|Array|Nodelist} input
      @return {Array}
      */

      function _getElements(input) {
        var elements;
        if (typeof input === 'string' || input instanceof String) {
          elements = [].slice.call(document.querySelectorAll(input));
        } else if (Array.isArray(input) || input instanceof NodeList) {
          elements = [].slice.call(input);
        } else {
          throw new TypeError('The selector provided to AnchorJS was invalid.');
        }
  
        return elements;
      }
  
      function _addBaselineStyles() {
        if (document.head.querySelector('style.anchorjs') !== null) {
          return;
        }
  
        var style = document.createElement('style'),
            linkRule =
            '.anchorjs-link{'                        +
              'opacity:0;'                           +
              'text-decoration:none;'                +
              '-webkit-font-smoothing:antialiased;'  +
              '-moz-osx-font-smoothing:grayscale'    +
            '}',
            hoverRule =
            ':hover>.anchorjs-link,'                 +
            '.anchorjs-link:focus{'                  +
              'opacity:1'                            +
            '}',
            anchorjsLinkFontFace =
            '@font-face{'                            +
              'font-family:anchorjs-icons;'          +
              'src:url(data:n/a;base64,AAEAAAALAIAAAwAwT1MvMg8yG2cAAAE4AAAAYGNtYXDp3gC3AAABpAAAAExnYXNwAAAAEAAAA9wAAAAIZ2x5ZlQCcfwAAAH4AAABCGhlYWQHFvHyAAAAvAAAADZoaGVhBnACFwAAAPQAAAAkaG10eASAADEAAAGYAAAADGxvY2EACACEAAAB8AAAAAhtYXhwAAYAVwAAARgAAAAgbmFtZQGOH9cAAAMAAAAAunBvc3QAAwAAAAADvAAAACAAAQAAAAEAAHzE2p9fDzz1AAkEAAAAAADRecUWAAAAANQA6R8AAAAAAoACwAAAAAgAAgAAAAAAAAABAAADwP/AAAACgAAA/9MCrQABAAAAAAAAAAAAAAAAAAAAAwABAAAAAwBVAAIAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAMCQAGQAAUAAAKZAswAAACPApkCzAAAAesAMwEJAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAQAAg//0DwP/AAEADwABAAAAAAQAAAAAAAAAAAAAAIAAAAAAAAAIAAAACgAAxAAAAAwAAAAMAAAAcAAEAAwAAABwAAwABAAAAHAAEADAAAAAIAAgAAgAAACDpy//9//8AAAAg6cv//f///+EWNwADAAEAAAAAAAAAAAAAAAAACACEAAEAAAAAAAAAAAAAAAAxAAACAAQARAKAAsAAKwBUAAABIiYnJjQ3NzY2MzIWFxYUBwcGIicmNDc3NjQnJiYjIgYHBwYUFxYUBwYGIwciJicmNDc3NjIXFhQHBwYUFxYWMzI2Nzc2NCcmNDc2MhcWFAcHBgYjARQGDAUtLXoWOR8fORYtLTgKGwoKCjgaGg0gEhIgDXoaGgkJBQwHdR85Fi0tOAobCgoKOBoaDSASEiANehoaCQkKGwotLXoWOR8BMwUFLYEuehYXFxYugC44CQkKGwo4GkoaDQ0NDXoaShoKGwoFBe8XFi6ALjgJCQobCjgaShoNDQ0NehpKGgobCgoKLYEuehYXAAAADACWAAEAAAAAAAEACAAAAAEAAAAAAAIAAwAIAAEAAAAAAAMACAAAAAEAAAAAAAQACAAAAAEAAAAAAAUAAQALAAEAAAAAAAYACAAAAAMAAQQJAAEAEAAMAAMAAQQJAAIABgAcAAMAAQQJAAMAEAAMAAMAAQQJAAQAEAAMAAMAAQQJAAUAAgAiAAMAAQQJAAYAEAAMYW5jaG9yanM0MDBAAGEAbgBjAGgAbwByAGoAcwA0ADAAMABAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAH//wAP) format("truetype")' +
            '}',
            pseudoElContent =
            '[data-anchorjs-icon]::after{'           +
              'content:attr(data-anchorjs-icon)'     +
            '}',
            firstStyleEl;
  
        style.className = 'anchorjs';
        style.appendChild(document.createTextNode(''));
  
        firstStyleEl = document.head.querySelector('[rel="stylesheet"],style');
        if (firstStyleEl === undefined) {
          document.head.appendChild(style);
        } else {
          document.head.insertBefore(style, firstStyleEl);
        }
  
        style.sheet.insertRule(linkRule, style.sheet.cssRules.length);
        style.sheet.insertRule(hoverRule, style.sheet.cssRules.length);
        style.sheet.insertRule(pseudoElContent, style.sheet.cssRules.length);
        style.sheet.insertRule(anchorjsLinkFontFace, style.sheet.cssRules.length);
      }
    }
  
    return AnchorJS;
  }));

// AnchorJS Configuration
anchors.options = {
  placement: 'right',
  icon: '#',
  visible: 'hover',
};
anchors.add();

document.addEventListener('DOMContentLoaded', () => {
  anchors.add();
  document.querySelectorAll('.anchorjs-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

  