// custom element with instant edit mode
ko.components.register('editable-label', {
	viewModel: function(params) {
		//this.placeholder = ko.observable(params.placeholder);
		this.content = params.content;
		this.inEditing = ko.observable(false);
		this.edit = function() {
			this.inEditing(true)
		}
	},
	template:
		'<span data-bind="visible: !inEditing(), text: content?content:placeholder, click: edit"></span>\
		<input data-bind="visible: inEditing, textInput: content, hasFocus: inEditing" />'
});

// custom element with custom element reuse
ko.components.register('name-labels', {
	viewModel: function(params) {
		this.firstname = params.fn;
		this.lastname = params.ln;
	},
	template:
		'<editable-label params="content: firstname"></editable-label>\
		<editable-label params="content: lastname"></editable-label>'
});
