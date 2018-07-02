const { URL } = require('url');
const Request = require('../../../../download/request/Request');

function getFormDataFromTag($tag) {
  const name = $tag.attr('name');
  const value = $tag.attr('value');
  const type = $tag.attr('type');
  const tagType = $tag[0].name;
  if (
    tagType === 'input' &&
    type &&
    (type.toLowerCase() === 'checkbox' || type.toLowerCase() === 'radio')
  ) {
    const checked = $tag.attr('checked') === '';
    if (!checked) {
      return {};
    }
  } else if (tagType === 'select') {
    const multiple = $tag.attr('multiple') === '' || $tag.attr('multiple');
    if (multiple) {
      const selectedOptions = $tag.find('option[selected]');
      const optionsValue = [];
      for (let index in selectedOptions) {
        const option = $tag.eq(index);
        const value = option.attr('value');
        if (value) {
          optionsValue.push(value);
        }
      }
      return {
        name,
        value: optionsValue,
        requestOptions: { qsStringifyOptions: { arrayFormat: 'repeat' } }
      };
    } else {
      return { name, value: $tag.find('option[selected]').attr('value') };
    }
  }
  return {
    name,
    value
  };
}

function buildRequestFromForm($, $form, formData, requestOptions) {
  let relativeUrl = $form.attr('action') || '';
  let url = $.response.getAbsoluteUrl(relativeUrl);
  const method = $form.attr('method') || 'GET';

  formElements = $form
    .find(
      'textarea, select, input:not([type]), input:not([type="submit"]):not([type="reset"]):not([type="reset"])'
    )
    .get();

  const extractedFormData = formElements.reduce(
    (accumulator, currentElement) => {
      let { name, value = '', requestOptions: options } = getFormDataFromTag(
        $(currentElement)
      );

      if (name) {
        if (requestOptions) {
          requestOptions = { ...requestOptions, ...options };
        }
        accumulator[name] = value;
      }
      return accumulator;
    },
    {}
  );
  formData = { ...extractedFormData, ...formData };
  if (
    (requestOptions && requestOptions.method.toUpperCase() === 'GET') ||
    method.toUpperCase() === 'GET'
  ) {
    const parsedUrl = new URL(url);
    Object.keys(formData).forEach(key => {
      if (Array.isArray(formData[key])) {
        formData[key].forEach(v => {
          parsedUrl.searchParams.append(key, v);
        });
      } else {
        parsedUrl.searchParams.append(key, formData[key]);
      }
    });

    url = parsedUrl.href;
  }

  return new Request(url, {
    formData,
    method,
    ...requestOptions
  });
}

function getForm($, identifier) {
  let selector;
  let index = 0;
  if (typeof identifier === 'string') {
    selector = identifier;
  } else if (typeof identifier === 'object') {
    let { selector: inputSelector, name, id, index: inputIndex } = identifier;
    if (inputIndex) {
      index = inputIndex;
    }
    if (selector) {
      selector = inputSelector;
    } else if (name) {
      selector = `form[name="${name}"]`;
    } else if (id) {
      selector = `form[id="${id}"]`;
    } else {
      selector = 'form';
    }
  }

  const elements = $(selector);
  const filteredFormElements = elements.filter((i, e) => e.name === 'form');
  if (filteredFormElements.length > 0) {
    return $(elements).eq(index);
  } else {
    // if the selectors did'nt return any form,
    // we take the element at index and we return the first form in the childrens
    if (elements.length >= index) {
      return $(elements)
        .find('form')
        .eq(index);
    }
  }
}

function addScrapeFormRequestMethod($) {
  $.prototype.scrapeFormRequest = function(
    identifier,
    formData,
    requestOptions
  ) {
    let $form = getForm($, identifier);
    if ($form) {
      let request = buildRequestFromForm($, $form, formData, requestOptions);
      return request;
    }
  };
}

// function getForm($, selector, index = 0) {}

module.exports = { addScrapeFormRequestMethod };
