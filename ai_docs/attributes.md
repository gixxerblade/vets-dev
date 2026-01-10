# Datastar Attributes Reference

## Core Attributes Overview

Datastar provides a comprehensive set of data attributes for building reactive web interfaces. These attributes are evaluated in DOM order and support special casing rules, aliasing, and built-in error handling.

## Standard Attributes

### data-attr

Sets the value of any HTML attribute to an expression, and keeps it in sync. Supports both single attribute assignment (`data-attr:aria-label="$foo"`) and multiple attributes via key-value pairs.

### data-bind

Establishes two-way data binding between signals and form elements. Creates signals automatically and preserves type information when binding predefined signals. Includes file upload support with base64 encoding and modifier options for case conversion.

### data-class

Conditionally adds or removes CSS classes based on expression evaluation. Can manage single classes or multiple classes through object syntax.

### data-computed

Creates read-only signals derived from expressions that update automatically when dependencies change. Useful for memoization without side effects.

### data-effect

Executes an expression on page load and whenever any signals in the expression change. Handles side effects and backend interactions.

### data-ignore

Prevents Datastar processing on an element and descendants. Useful for third-party library conflicts.

### data-ignore-morph

Skips DOM morphing for specified elements while applying other transformations.

### data-indicator

Creates signals tracking fetch request states (true during requests, false otherwise). Useful for loading indicators and button states.

### data-init

Runs expressions when attributes load into the DOM. Supports delay and view transition modifiers.

### data-json-signals

Displays reactive JSON representation of signals with optional filtering via include/exclude regex patterns.

### data-on

Attaches event listeners executing expressions on triggers. Includes extensive modifiers for debouncing, throttling, event propagation control, and timing adjustments.

### data-on-intersect

Triggers expressions when elements enter viewport with visibility threshold options and timing modifiers.

### data-on-interval

Executes expressions at regular intervals (default one second) with customizable duration.

### data-on-signal-patch

Runs expressions whenever signals update, with access to patch details and optional filtering.

### data-on-signal-patch-filter

Filters which signals trigger patch listeners using regex include/exclude patterns.

### data-preserve-attr

Maintains attribute values during DOM morphing operations. Supports multiple attributes separated by spaces.

### data-ref

Creates element reference signals accessible throughout expressions.

### data-show

Shows or hides elements conditionally. Recommends initial `display: none` styling to prevent flicker before processing.

### data-signals

Patches signals into the reactive system. Supports nested paths via dot notation and signal removal via null/undefined values.

### data-style

Sets inline CSS properties reactively. Restores original values when expressions evaluate to empty strings, null, undefined, or false.

### data-text

Binds element text content to reactive expressions.

## Pro Attributes (Commercial License)

### data-animate

Animates element attributes over time with reactive updates.

### data-custom-validity

Applies custom HTML5 form validation through expressions returning validation messages.

### data-on-raf

Executes expressions on every requestAnimationFrame event with throttling modifiers.

### data-on-resize

Triggers expressions on element dimension changes with debounce/throttle options.

### data-persist

Saves signals to local or session storage between page loads. Supports custom storage keys and filtering.

### data-query-string

Syncs signals with URL query parameters, including history management support.

### data-replace-url

Updates browser URLs without page reloading using evaluated expressions.

### data-rocket

Creates Rocket web components (see separate reference).

### data-scroll-into-view

Scrolls elements into viewport with customizable behavior (smooth/instant) and positioning (start/center/end/nearest).

### data-view-transition

Explicitly sets `view-transition-name` for View Transition API integration.

## Key Concepts

### Attribute Evaluation Order

Attributes process in DOM appearance order during depth-first traversal. This matters when indicator signals must initialize before fetch requests.

### Casing Conventions

HTML attributes are case-insensitive. Datastar converts hyphenated attribute keys to camelCase for signals but uses kebab-case defaults for other attributes. The `__case` modifier enables explicit conversion between camelCase, kebab-case, snake_case, and PascalCase.

### Expressions

Support standard JavaScript syntax with signal variables (prefixed by `$`) and an `el` variable referencing the current element.

### Error Handling

Runtime errors provide context-aware messages with diagnostic links explaining issues and demonstrating correct usage patterns.
