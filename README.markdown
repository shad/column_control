# Javascript Column Control #

A simple way to create a column view control (ala OS X) on the web.  Intended for use with AJaX.

## Overview ##

Creates a column control within the element id passed.  Pass in the root of the tree that should be used.  Each
action called should return a UL with multiple LI's defined.  Currently, it will look in the attribute 'pathname' on
the LI to know which url to hit next.

## SIMPLE EXAMPLE ##

The following is a simple example.

    <div id="foo"/>
    <script> var columns = new Ajax.ColumnControl( 'foo', '/root/path/for/items'); </script>

This will contact `/root/path/for/items` for it's initial list.  It expects to get back a normal unformatted list.

    <ul>
      <li pathname='foo'>Foo</li>
      <li pathname='bar'>Bar</li>
    </ul>
    
Note that the only odd thing here is the extra attribute 'pathname'.  This will be used to generate the url that we'll hit when someone clicks on the list item.  If someone clicks on "Foo" then the column control will hit `/root/path/for/items/foo` on the server for the next set of options.  This continues as far down as needed.

## CSS ##

CSS should be used to style the columns.  Each column can include any css info it needs to.  Additionally, the following
classes will be applied at the appropriate times:

- UL level classes
  - column\_0, column\_1, column\_2, ...
  - current\_column

- LI level classes
  - current
  - selected
  - hover


## OPTIONS ##

- pathName - The name of the attribute that will be used to build the path url on each click (pathname by default)
- keyBindings - Turn on/off key bindings which enable keyboard navigation (true/false, on by default)
- ajaxOptions - Any options that should be passed with each ajax call

## Dependencies ##

[Prototype](http://prototypejs.com) and [Scriptaculous](http://script.aculo.us/)

Scriptaculous is only used for the effect of scrolling to the right.  This could probably be turned off without too much work if you don't want this dependency.

