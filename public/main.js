// FlexNet JSX Styling Utilities and Functional Runtime
(function() {
  // Pure DOM selectors
  const select = selector => document.querySelector(selector);
  const selectAll = selector => Array.from(document.querySelectorAll(selector));
  
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
  
  // Task Monad for handling asynchronous operations
  const Task = executor => ({
    run: callback => executor(callback),
    map: fn => Task(cb => executor(x => cb(fn(x)))),
    chain: fn => Task(cb => executor(x => fn(x).run(cb)))
  });
  
  // Pure DOM transformers
  const setAttribute = curry((attr, value, element) => {
    if (!element) return element;
    element.setAttribute(attr, value);
    return element;
  });
  
  const removeAttribute = curry((attr, element) => {
    if (!element) return element;
    element.removeAttribute(attr);
    return element;
  });
  
  const setStyle = curry((property, value, element) => {
    if (!element) return element;
    element.style[property] = value;
    return element;
  });
  
  const setData = curry((key, value, element) => {
    if (!element) return element;
    element.dataset[key] = value;
    return element;
  });
  
  const removeData = curry((key, element) => {
    if (!element) return element;
    delete element.dataset[key];
    return element;
  });
  
  const setText = curry((text, element) => {
    if (!element) return element;
    element.textContent = text;
    return element;
  });
  
  const getValue = element => 
    element ? element.value : null;
  
  const setValue = curry((value, element) => {
    if (!element) return element;
    element.value = value;
    return element;
  });
  
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
  
  // Event Handling with effect isolation
  const addListener = curry((eventType, handler, element) => {
    if (!element) return () => {};
    
    element.addEventListener(eventType, handler);
    return () => element.removeEventListener(eventType, handler);
  });
  
  // Carousel Component with functional composition
  const createCarousel = () => {
    // Pure initial state
    const initialState = Object.freeze({
      items: [],
      currentIndex: 0,
      autoScrollId: null
    });
    
    // State container (closure)
    let state = initialState;
    
    // Updaters that return new state
    const updateState = newPartialState => {
      state = Object.freeze({ ...state, ...newPartialState });
      return state;
    };
    
    // Calculation for next slide index
    const calcNextIndex = state => 
      (state.currentIndex + 1) % Math.max(state.items.length, 1);
      
    // Calculation for previous slide index
    const calcPrevIndex = state => 
      (state.currentIndex - 1 + Math.max(state.items.length, 1)) % Math.max(state.items.length, 1);
    
    // Transform functions
    const nextSlide = () => updateState({ 
      currentIndex: calcNextIndex(state) 
    });
    
    const prevSlide = () => updateState({ 
      currentIndex: calcPrevIndex(state) 
    });
    
    // Renderer - returns transform to apply
    const getTransform = state => 
      `translateX(${-state.currentIndex * 100}vw)`;
      
    // Effects isolated in functions that return cleanup
    const startAutoScroll = () => {
      const intervalId = setInterval(compose(render, nextSlide), 3000);
      updateState({ autoScrollId: intervalId });
      return () => clearInterval(intervalId);
    };
    
    const resetAutoScroll = () => {
      if (state.autoScrollId) {
        clearInterval(state.autoScrollId);
      }
      return startAutoScroll();
    };
    
    // Render function
    const render = () => {
      const carouselElement = select("[data-carousel-slide]");
      if (carouselElement && state.items.length > 0) {
        setStyle('transform', getTransform(state), carouselElement);
      }
      return state;
    };
    
    // Setup as an effect that returns cleanup
    const setup = items => {
      updateState({ items, currentIndex: 0 });
      render();
      
      const autoScrollEffect = createEffect(startAutoScroll);
      autoScrollEffect.run();
      
      // Event handler functions
      const handlePrevClick = () => {
        prevSlide();
        render();
        resetAutoScroll();
      };
      
      const handleNextClick = () => {
        nextSlide();
        render();
        resetAutoScroll();
      };
      
      // Add event listeners and collect cleanup functions
      const cleanupPrev = addListener('click', handlePrevClick, select("#carouselPrev"));
      const cleanupNext = addListener('click', handleNextClick, select("#carouselNext"));
      
      // Return a cleanup function that calls all cleanup functions
      return () => {
        autoScrollEffect.dispose();
        cleanupPrev();
        cleanupNext();
      };
    };
    
    // Public API
    return {
      setup,
      nextSlide: compose(render, nextSlide),
      prevSlide: compose(render, prevSlide),
      getState: () => state
    };
  };
  
  // Navigation Component with pure functions
  const createNavigation = () => {
    // State in closure
    let isMenuOpen = false;
    
    // Toggle function
    const toggleMenu = () => {
      isMenuOpen = !isMenuOpen;
      const navMenu = select("#navMenu");
      if (isMenuOpen) {
        setData('open', '', navMenu);
      } else {
        removeData('open', navMenu);
      }
      return isMenuOpen;
    };
    
    // Scroll to section as an isolated effect
    const scrollToSection = targetId => {
      const targetSection = select(targetId);
      const headerHeight = select("#headerFixed")?.offsetHeight || 0;
      
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - headerHeight - 20,
          behavior: 'smooth'
        });
        
        // Close menu if open (side effect isolated to this function)
        if (isMenuOpen) {
          toggleMenu();
        }
        
        // Highlight active menu item
        updateMenuHighlight(targetId);
      }
    };
    
    // Function to update menu highlights
    const updateMenuHighlight = targetId => {
      const navLinks = selectAll('#navMenu a');
      
      // Remove highlight from all links
      navLinks.forEach(link => {
        removeAttribute('data-active', link);
      });
      
      // Add highlight to current active link
      navLinks.forEach(link => {
        if (link.getAttribute('href') === targetId) {
          setAttribute('data-active', '', link);
        }
      });
    };
    
    // Setup as an effect that returns cleanup
    const setup = () => {
      // Handle nav toggle
      const handleNavToggle = () => toggleMenu();
      const cleanupToggle = addListener('click', handleNavToggle, select("#navToggle"));
      
      // Handle anchor clicks
      const anchorCleanups = selectAll('a[href^="#"]').map(anchor => {
        const handleClick = e => {
          e.preventDefault();
          const targetId = anchor.getAttribute('href');
          scrollToSection(targetId);
        };
        
        return addListener('click', handleClick, anchor);
      });
      
      // Set up section highlighting with IntersectionObserver
      const highlightActiveSection = () => {
        const sections = selectAll('section');
        const navLinks = selectAll('#navMenu a');
        
        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                // Get section id
                const sectionId = `#${entry.target.id}`;
                
                // Update menu highlights
                navLinks.forEach(link => {
                  removeAttribute('data-active', link);
                  if (link.getAttribute('href') === sectionId) {
                    setAttribute('data-active', '', link);
                  }
                });
              }
            });
          },
          { threshold: 0.7 }
        );
        
        sections.forEach(section => observer.observe(section));
        
        // Return cleanup function
        return () => {
          sections.forEach(section => observer.unobserve(section));
          observer.disconnect();
        };
      };
      
      const cleanupHighlight = highlightActiveSection();
      
      // Return cleanup function
      return () => {
        cleanupToggle();
        anchorCleanups.forEach(cleanup => cleanup());
        cleanupHighlight();
      };
    };
    
    // Public API
    return {
      setup,
      toggleMenu,
      scrollToSection,
      updateMenuHighlight
    };
  };
  
  // Form Component with pure functions and Task pattern
  const createForm = () => {
    // Pure initial state
    const initialState = Object.freeze({
      status: '',
      data: {}
    });
    
    // State container (closure)
    let state = initialState;
    
    // Update function
    const updateState = newPartialState => {
      state = Object.freeze({ ...state, ...newPartialState });
      return state;
    };
    
    // Status update
    const updateStatus = status => {
      updateState({ status });
      const statusElement = select("#formStatus");
      if (statusElement) {
        setText(status, statusElement);
      }
      return state;
    };
    
    // Form data extraction
    const extractFormData = () => {
      // The contactForm is now the only form
      const nameSelector = "#FNAME";
      const emailSelector = "#EMAIL";
      const messageSelector = "#message"; // Only in the main contact form
      
      const name = pipe(
        select,
        Maybe,
        maybeElem => maybeElem.map(getValue),
        nameValue => nameValue.orElse("")
      )(nameSelector);
      
      const email = pipe(
        select,
        Maybe,
        maybeElem => maybeElem.map(getValue),
        emailValue => emailValue.orElse("")
      )(emailSelector);
      
      // Only try to get message if we're using the main contact form
      const message = pipe(
        select,
        Maybe,
        maybeElem => maybeElem.map(getValue),
        msgValue => msgValue.orElse("")
      )(messageSelector);
      
      return { name, email, message };
    };
    
    // Form reset
    const resetForm = () => {
      pipe(select, elem => setValue("", elem))("#FNAME");
      pipe(select, elem => setValue("", elem))("#EMAIL");
      pipe(select, elem => setValue("", elem))("#message");
      return true;
    };
    
    // Task creation for form submission
    const createSubmitTask = formData => Task(callback => {
      // For local browser without server, mock the API request
      setTimeout(() => {
        // Simulate successful submission
        callback(Either.Right({ success: true, message: "Form submitted successfully" }));
      }, 1000);
    });
    
    // Isolated effect handler for form submission
    const handleSubmit = (event) => {
      event.preventDefault();
      
      // Extract form data
      const formData = extractFormData();
      updateState({ data: formData });
      
      // Update status to show loading
      updateStatus("Submitting...");
      
      // Create and run task
      const submitTask = createSubmitTask(formData);
      
      submitTask.run(result => 
        result.fold(
          error => {
            updateStatus(`Error: ${error.message || 'Unknown error'}`);
          },
          success => {
            updateStatus("Submitted successfully!");
            resetForm();
          }
        )
      );
    };
    
    // Setup as an effect that returns cleanup
    const setup = () => {
      // Set up contact form
      const contactForm = select("#contactForm");
      const contactFormCleanup = contactForm 
        ? addListener('submit', e => handleSubmit(e), contactForm) 
        : () => {};
      
      // Return cleanup function
      return () => {
        contactFormCleanup();
      };
    };
    
    // Public API
    return {
      setup,
      getState: () => state,
      updateStatus
    };
  };

  // Search Component with functional composition
  const createSearch = () => {
    // Pure initial state
    const initialState = Object.freeze({
      query: '',
      results: [],
      isSearching: false
    });
    
    // State container (closure)
    let state = initialState;
    
    // Updaters that return new state
    const updateState = newPartialState => {
      state = Object.freeze({ ...state, ...newPartialState });
      return state;
    };
    
    // Function to update query
    const updateQuery = query => updateState({ 
      query, 
      isSearching: query.length > 0 
    });
    
    // Function to filter content based on query
    const performSearch = query => {
      if (!query.trim()) {
        return [];
      }
      
      // Get all searchable content from the page
      const sections = selectAll('section');
      const searchableItems = [];
      
      // Extract text content from sections
      sections.forEach(section => {
        const headings = selectAll('h1, h2, h3', section);
        const paragraphs = selectAll('p', section);
        
        headings.forEach(heading => {
          searchableItems.push({
            text: heading.textContent,
            element: section,
            type: 'heading',
            id: section.id
          });
        });
        
        paragraphs.forEach(paragraph => {
          searchableItems.push({
            text: paragraph.textContent,
            element: section,
            type: 'paragraph',
            id: section.id
          });
        });
      });
      
      // Filtering function
      const filterByQuery = item => 
        item.text.toLowerCase().includes(query.toLowerCase());
      
      // Return filtered results
      return searchableItems.filter(filterByQuery);
    };
    
    // Function to highlight search results
    const highlightResults = results => {
      // Remove any existing highlights
      selectAll('[data-search-highlight]').forEach(element => {
        removeAttribute('data-search-highlight', element);
      });
      
      // No results or empty query, do nothing further
      if (results.length === 0) {
        return results;
      }
      
      // Group results by section ID for efficiency
      const resultsBySectionId = results.reduce((acc, result) => {
        if (!acc[result.id]) {
          acc[result.id] = [];
        }
        acc[result.id].push(result);
        return acc;
      }, {});
      
      // Highlight section with results
      Object.keys(resultsBySectionId).forEach(sectionId => {
        const section = select(`#${sectionId}`);
        if (section) {
          setAttribute('data-search-highlight', '', section);
        }
      });
      
      return results;
    };
    
    // Function to create DOM element
    const createDomElement = (tag, attributes = {}) => {
      const element = document.createElement(tag);
      
      // Apply attributes
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else if (key === 'textContent') {
          element.textContent = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.entries(value).forEach(([styleKey, styleValue]) => {
            element.style[styleKey] = styleValue;
          });
        } else {
          element.setAttribute(key, value);
        }
      });
      
      return element;
    };
    
    // Function to render search results
    const renderSearchResults = () => {
      // Get or create search results container
      let resultsContainer = select('#searchResults');
      if (!resultsContainer) {
        resultsContainer = createDomElement('div', { id: 'searchResults' });
        const searchPill = select('#searchPill');
        if (searchPill) {
          searchPill.appendChild(resultsContainer);
        }
      }
      
      // Clear existing results - pure DOM operation
      resultsContainer.innerHTML = '';
      
      // Determine visibility
      if (!state.isSearching || state.results.length === 0) {
        setStyle('display', 'none', resultsContainer);
        return;
      }
      
      // Show container
      setStyle('display', 'block', resultsContainer);
      
      // Group results by section - pure transformation
      const resultsBySectionId = state.results.reduce((acc, result) => {
        if (!acc[result.id]) {
          acc[result.id] = [];
        }
        acc[result.id].push(result);
        return acc;
      }, {});
      
      // Create result elements
      Object.keys(resultsBySectionId).forEach(sectionId => {
        const sectionResults = resultsBySectionId[sectionId];
        
        // Create section heading
        const sectionHeading = createDomElement('div', {
          dataset: { searchSection: '' },
          textContent: sectionId.charAt(0).toUpperCase() + sectionId.slice(1)
        });
        resultsContainer.appendChild(sectionHeading);
        
        // Create result items
        sectionResults.forEach(result => {
          const resultItem = createDomElement('div', {
            dataset: { searchItem: '' },
            textContent: result.text.substring(0, 30) + (result.text.length > 30 ? '...' : '')
          });
          
          // Add click handler
          const navHandler = () => {
            // Get navigation handler and scroll to section
            const navigation = createNavigation();
            navigation.scrollToSection(`#${result.id}`);
            
            // Hide results
            setStyle('display', 'none', resultsContainer);
            
            // Reset search input
            const searchInput = select('#searchPill input');
            if (searchInput) {
              setValue('', searchInput);
              updateQuery('');
            }
          };
          
          addListener('click', navHandler, resultItem);
          resultsContainer.appendChild(resultItem);
        });
      });
      
      // Handle empty results with message
      if (state.results.length === 0 && state.query.trim()) {
        const noResults = createDomElement('div', {
          dataset: { searchNoResults: '' },
          textContent: 'No results found'
        });
        resultsContainer.appendChild(noResults);
      }
    };
    
    // Effect handling for search input
    const handleSearchInput = event => {
      const query = getValue(event.target);
      updateQuery(query);
      
      // Handle empty query
      if (!query.trim()) {
        updateState({ results: [] });
        renderSearchResults();
        return;
      }
      
      // Perform search and update results
      const results = performSearch(query);
      updateState({ results });
      
      // Highlight results
      highlightResults(results);
      
      // Render results
      renderSearchResults();
    };
    
    // Handle document click for closing results
    const handleDocumentClick = event => {
      const searchPill = select('#searchPill');
      const searchResults = select('#searchResults');
      
      // If click outside search area, hide results
      if (searchPill && searchResults && !searchPill.contains(event.target)) {
        setStyle('display', 'none', searchResults);
      }
    };
    
    // Setup as an effect that returns cleanup
    const setup = () => {
      // Add search input handler
      const searchInput = select('#searchPill input');
      const searchInputCleanup = searchInput 
        ? addListener('input', handleSearchInput, searchInput)
        : () => {};
      
      // Add focus handler to show results if we have them
      const searchFocusCleanup = searchInput
        ? addListener('focus', () => {
            if (state.results.length > 0) {
              renderSearchResults();
              const searchResults = select('#searchResults');
              if (searchResults) {
                setStyle('display', 'block', searchResults);
              }
            }
          }, searchInput)
        : () => {};
      
      // Add document click handler to close results
      const documentClickCleanup = addListener('click', handleDocumentClick, document);
      
      // Return cleanup function
      return () => {
        searchInputCleanup();
        searchFocusCleanup();
        documentClickCleanup();
      };
    };
    
    // Public API
    return {
      setup,
      updateQuery,
      performSearch,
      getState: () => state
    };
  };
  
  // Main application initialization function
  const initApp = () => {
    console.log("Initializing CryptoVersus application...");
    
    // Create navigation component
    const navigation = createNavigation();
    const navCleanup = navigation.setup();
    
    // Create carousel component
    const carousel = createCarousel();
    const carouselItems = selectAll('[data-carousel-item]');
    const carouselCleanup = carousel.setup(carouselItems);
    
    // Create form component
    const contactForm = createForm();
    const formCleanup = contactForm.setup();
    
    // Create search component
    const search = createSearch();
    const searchCleanup = search.setup();
    
    // Set initial active section based on URL hash or default to home
    const hash = window.location.hash || '#home';
    navigation.updateMenuHighlight(hash);
    
    // If there's a hash in the URL, scroll to that section
    if (hash && hash !== '#home') {
      setTimeout(() => {
        navigation.scrollToSection(hash);
      }, 100);
    }
    
    // Return cleanup function
    return () => {
      navCleanup();
      carouselCleanup();
      formCleanup();
      searchCleanup();
    };
  };
  
  // Expose public API
  window.initApp = initApp;
  
  // Auto-initialize when DOM is ready if not already handled
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    // DOM already loaded, initialize immediately
    initApp();
  }
})();