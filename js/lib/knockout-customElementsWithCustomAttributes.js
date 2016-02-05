(function(global, undefined) {
	function attachToKo(ko) {
		ko.componentBindingProvider = function (providerToWrap) {
			this._providerToWrap = providerToWrap;
			this._nativeBindingProvider = new ko.bindingProvider();
		};

		function _nodeIsCustomComponentElement (node) {
			var noParams = !node.getAttribute || node.getAttribute('params') === null;
			// return node && (node.nodeType === 1) && ko.components.isRegistered(node.tagName.toLowerCase()) && noParams;
			return node && (node.nodeType === 1) && ko.components['getComponentNameForNode'](node) && noParams;
		}

		ko.componentBindingProvider.prototype.nodeHasBindings = function (node) {
			// return _nodeIsCustomComponentElement(node) || this._providerToWrap.nodeHasBindings.apply(this._providerToWrap, arguments);
			return this._providerToWrap.nodeHasBindings.apply(this._providerToWrap, arguments);
		};

		ko.componentBindingProvider.prototype.getBindings = function (node, bindingContext) {
			var bindings = this._providerToWrap.getBindings.apply(this._providerToWrap, arguments);
			return bindings;
		};

		ko.componentBindingProvider.prototype.getBindingAccessors = function (node, bindingContext) {
			var bindings = this._providerToWrap.getBindingAccessors.apply(this._providerToWrap, arguments);
			// extended to use all attributes bindings
			return this._addAttrBindingsForCustomElement(bindings, node, bindingContext, /* valueAccessors */ true);
		};

		ko.componentBindingProvider.prototype._addAttrBindingsForCustomElement = function (allBindings, node, bindingContext, valueAccessors) {
			// Determine if it's really a custom element matching a component
			if (_nodeIsCustomComponentElement(node)) {
				allBindings = allBindings || {};

				if (allBindings['component'] && !isEmptyObject(allBindings.component().params.$raw)) {
					// Avoid silently overwriting some other 'component' binding that may already be on the element
					throw new Error('Cannot use the "component" binding on a custom element matching a component');
				}

				var componentName = ko.components['getComponentNameForNode'](node);
				var componentBindingValue = {
					'name': componentName,
					'params': this._getComponentAttrParamsFromCustomElement(node, bindingContext)
				};

				allBindings['component'] = valueAccessors
					? function() { return componentBindingValue; }
					: componentBindingValue;
			}
			return allBindings;
		};

		ko.componentBindingProvider.prototype._getComponentAttrParamsFromCustomElement = function (elem, bindingContext) {
			var attributes = elem.attributes || [],
				result = {};

			for (var i = 0; i < attributes.length; i++) {
				var attribute = attributes[i];
				if (attribute.specified === false) {
					// IE7 returns about a hundred "unspecified" attributes on every element. Skip them.
					continue;
				}

				var attributeName = attribute.name;
				var propertyName = toCamelCase(attributeName);
				var valueText = attribute.value || "";

				if (valueText.substring(0, 2) === "{{" && valueText.substring(valueText.length - 2) === "}}") {
					// Dynamic expressions are converted to writable computeds
					// TODO: Handle "{{abc}} some string {{def}}", i.e., proper interpolation
					valueText = valueText.substring(2, valueText.length - 2);

					var valueDummyBinding = "value: " + valueText,
						valueAccessors = this._nativeBindingProvider.parseBindingsString(valueDummyBinding, bindingContext, elem, {
							'valueAccessors': true
						}),
						valueReader = valueAccessors.value,
						valueReaderInitialValue = valueReader();

					if (ko.isObservable(valueReaderInitialValue)) {
						// If it's just an observable instance, pass it straight through without wrapping
						result[propertyName] = valueReaderInitialValue;
					} else {
						// If it's not an observable instance, but is evaluated with reference to observables,
						// then we promote the parameter to an observable so the receiving component can
						// observe changes without us having to tear down and replace the component on each change.
						//
						// We differentiate between "a function of some observables" and "a function of no observables"
						// by testing whether or not the wrapped computed has any active dependencies.
						var valueWriter = valueAccessors._ko_property_writers ? valueAccessors._ko_property_writers().value : undefined,
							valueWrappedAsObservable = ko.computed({
								read: valueReader,
								write: valueWriter
							}, null, { disposeWhenNodeIsRemoved: elem });
						result[propertyName] = valueWrappedAsObservable.isActive() ? valueWrappedAsObservable : valueReaderInitialValue;
					}
				} else {
					// Everything else is interpreted as a string, and is passed literally
					result[propertyName] = valueText;
				}
			}
			return result;
		}

		function toCamelCase(str) {
			return str.replace(/-([a-z])/g, function (a, capture) {
				return capture.toUpperCase();
			});
		}

		function isEmptyObject (obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					return false;
				}
			}
			return true;
		}

		ko.bindingProvider.instance = new ko.componentBindingProvider(ko.bindingProvider.instance);
	}

	// Determines which module loading scenario we're in, grabs dependencies, and attaches to KO
	function prepareExports() {
		if (typeof define === 'function' && define.amd) {
			// AMD anonymous module
			define(["knockout", "knockout-components"], attachToKo);
		} else if ('ko' in global) {
			// Non-module case - attach to the global instance, and assume
			// knockout-components.js is already loaded.
			attachToKo(global.ko);
		} else {
			throw new Error('Couldn\'t find an instance of ko to attach to');
		}
	}

	prepareExports();
})(this);