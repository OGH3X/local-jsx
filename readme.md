# FlexNet JSX Framework

A functional JavaScript implementation designed for building modern web applications. FlexNet JSX implements the JSX Framework Persistent Memory Protocol.

## Overview

This repository contains a webapp template built as part of the local-jsx front-end project for the FlexNet JSX ecosystem. local-jsk demonstrates how to build a simple webapp front-end by implementing functional programming principles using the FlexNet JSX runtime environment running locally within a modern browser without a webserver.

## Core Principles

- Functions as Primary Operations
- Immutable State Management
- Functional Composition
- Zero Dependencies
- Browser Native Implementation
- No Webserver Required

## Features

The example webapp page demonstrates:
- Fixed navigation with responsive menu
- Hero section with call-to-action
- Services section with content organization
- Portfolio carousel with functional state management
- Contact form with functional data handling
- Search functionality with highlighting
- Social media integration

## Core Architecture

- Functional Core Architecture
- Type System (Maybe, Either, Result)
- Effect System with Cleanup
- State Management with Immutable Updates
- Router System with Functional Guards
- Property-Based Testing Framework

## Project Structure

```
.
├── index.html      # Main HTML file
├── public/
│   ├── main.css    # Styling
│   ├── main.js     # JavaScript runtime
│   └── images/     # Image assets
├── privacy.html    # Terms of service
```

## Functional Pattern Examples

The codebase demonstrates several key functional patterns:

```javascript
// Functional Composition Utilities
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
const curry = fn => (...args) => 
  args.length >= fn.length 
    ? fn(...args) 
    : (...more) => curry(fn)(...args, ...more);

// Maybe Monad for handling potentially undefined values
const Maybe = value => ({
  value,
  isNothing: value === null || value === undefined,
  map: fn => Maybe(value).isNothing ? Maybe(null) : Maybe(fn(value)),
  orElse: defaultValue => Maybe(value).isNothing ? defaultValue : value,
  chain: fn => Maybe(value).isNothing ? Maybe(null) : fn(value)
});

// Either Monad for error handling
const Either = {
  Left: value => ({
    isLeft: true,
    isRight: false,
    value,
    map: _ => Either.Left(value),
    mapLeft: fn => Either.Left(fn(value)),
    fold: (leftFn, _) => leftFn(value)
  }),
  Right: value => ({
    isLeft: false,
    isRight: true,
    value,
    map: fn => Either.Right(fn(value)),
    mapLeft: _ => Either.Right(value),
    fold: (_, rightFn) => rightFn(value)
  }),
  fromNullable: value => 
    value === null || value === undefined 
      ? Either.Left(value) 
      : Either.Right(value)
};

// Task Monad for async operations
const Task = executor => ({
  run: callback => executor(callback),
  map: fn => Task(cb => executor(x => cb(fn(x)))),
  chain: fn => Task(cb => executor(x => fn(x).run(cb)))
});
```

## Component Implementation

The example webapp demonstrates functional component creation:

```javascript
// Component Creation Factory
const createComponent = (name, initialState = {}) => {
  // State container (closure)
  let state = Object.freeze(initialState);
  
  // Component registry
  const elements = new Map();
  const effects = [];
  
  // Pure state update
  const updateState = newPartialState => {
    state = Object.freeze({ ...state, ...newPartialState });
    return state;
  };
  
  // Register elements by name
  const registerElement = (elementName, domElement) => {
    if (domElement) {
      elements.set(elementName, domElement);
    }
    return domElement;
  };
  
  // Get registered element 
  const getElement = elementName => elements.get(elementName);
  
  // Register effect
  const registerEffect = effect => {
    effects.push(effect);
    return effect;
  };
  
  // Initialize component
  const init = () => {
    // Find component in DOM
    const componentElement = select(`[data-component="${name}"]`);
    if (!componentElement) return null;
    
    // Find and register all elements
    selectAll(`[data-component="${name}"] [data-element]`).forEach(element => {
      const elementName = element.getAttribute('data-element');
      registerElement(elementName, element);
    });
    
    return {
      element: componentElement,
      getState: () => state,
      updateState,
      getElement,
      dispose: () => {
        effects.forEach(effect => {
          if (typeof effect.dispose === 'function') {
            effect.dispose();
          }
        });
        elements.clear();
        effects.length = 0;
      }
    };
  };
  
  return {
    init,
    registerElement,
    registerEffect,
    getState: () => state,
    updateState
  };
};
```

## Effect Handling

The JSX framework implements an effect system with proper cleanup:

```javascript
// Effect Handling
const createEffect = effect => {
  let cleanup = null;
  
  const run = () => {
    if (cleanup) cleanup();
    cleanup = effect();
    return cleanup;
  };
  
  const dispose = () => {
    if (cleanup) cleanup();
    cleanup = null;
  };
  
  return {
    run,
    dispose
  };
};
```

## Installation and Setup

1. Clone the repository
2. Open `index.html` in your browser
3. No build process needed - everything is HTML, CSS, and functional JavaScript

## Customization

To customize this template for your own web application:

1. Update the component structure in `index.html` to match your needs
2. Modify styling variables in CSS to match your brand (see `:root` in main.css)
3. Replace example content with your application's content
4. Adapt the functional components in main.js for your specific requirements
5. Extend the functional patterns to implement additional features as needed by using the entire JSX framework

## Framework Requirements

The FlexNet JSX framework follows strict requirements:

1. **FRAMEWORK SUPREMACY**
   - Replaces other JavaScript frameworks and stacks
   - No patterns from React, Vue, Angular, or any other framework

2. **FUNCTIONAL PROGRAMMING**
   - Code is structured as functions
   - Avoids objects or classes
   - Minimizes mutable state
   - Function composition for combining functionality
   - State transitions as functional transformations
   - Side effects isolated in the effect system

3. **CORE PATTERNS**
   - Uses Maybe, Either, Result for type safety
   - Uses compose/pipe for function composition
   - Uses curry for partial application
   - Uses functional data structures for state

4. **AVOIDED PATTERNS**
   - Classes
   - Objects for state
   - this keyword
   - Prototypes
   - Mutations
   - Side effects outside effect system
   - Imperative loops
   - Callbacks without functional wrapping

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Relationship to FlexNet JSX Ecosystem

This template is part of the FlexNet JSX ecosystem:

- **FlexNet JSX**: The complete functional JavaScript runtime and framework
- **local-jsx**: The front-end implementation showcased intended to run locally without a webserver. (this template)
- **web-jsx**: The front-end implementation showcased intended for a web server.
- **jsx-javascript-runtime**: The core runtime environment
- **FlexNet JSX Utilities**: Additional functional utilities for building applications

## Version Information
- Version: 1.0.0
- Architecture Version: 1.0.0
- Protocol Version: 1.0.0
- Last Updated: 2025-01-31

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built for modern web applications with a focus on functional programming principles and state management.