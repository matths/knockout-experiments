# knockout experiments

knockout.js is a nice MVVM (Model View ViewModel) framework for easily binding values to DOM elements (View), with a small footprint, and is good for rapid prototyping.

## custom elements

It also enables the creation of custom html dom elements (close to web components) with the same kind of binding.
(http://knockoutjs.com/documentation/component-custom-elements.html)

## my examples so far

I just started building a basic example. So far it offers insights two the following stuff:

* creation / use of custom elements
* mode switching (view/edit)
* custom attributes (knockout.js itself offers just the data-bind attribute for components and the params attribute for custom elements)

```
<editable-label content="{{yourContentVar}}"></editable-label>
```

* reuse of custom elements

```
<name-form firstname="{{firstname}}" lastname="{{lastname}}"></name-form>
```


## applications using knockout.js

I have found that the skype web client is using knockout.js https://web.skype.com/. How cool is that? ;)
