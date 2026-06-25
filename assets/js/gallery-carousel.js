(function () {
  var carouselClasses = ['carousel', 'gallery-carousel', 'is-carousel'];
  var svgNamespace = 'http://www.w3.org/2000/svg';

  function createSvgElement(tagName) {
    return document.createElementNS(svgNamespace, tagName);
  }

  function hasCarouselClass(element) {
    return carouselClasses.some(function (className) {
      return element.classList.contains(className);
    });
  }

  function hasCarouselClassNearby(element) {
    return hasCarouselClass(element) || carouselClasses.some(function (className) {
      return Boolean(element.closest('.' + className));
    });
  }

  function createButton(label, direction) {
    var button = document.createElement('button');
    var icon = createSvgElement('svg');
    var path = createSvgElement('path');

    button.type = 'button';
    button.className = 'gallery-carousel__button gallery-carousel__button--' + direction;
    button.setAttribute('aria-label', label);
    icon.classList.add('gallery-carousel__button-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.setAttribute('viewBox', '0 0 24 24');
    path.setAttribute('d', direction === 'prev' ? 'M15 6 9 12l6 6' : 'M9 6l6 6-6 6');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2.5');
    icon.appendChild(path);
    button.appendChild(icon);
    return button;
  }

  function createDot(index) {
    var dot = document.createElement('button');
    var icon = createSvgElement('svg');
    var circle = createSvgElement('circle');

    dot.type = 'button';
    dot.className = 'gallery-carousel__dot';
    dot.setAttribute('aria-label', 'Show gallery image ' + (index + 1));
    icon.classList.add('gallery-carousel__dot-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.setAttribute('viewBox', '0 0 12 12');
    circle.setAttribute('cx', '6');
    circle.setAttribute('cy', '6');
    circle.setAttribute('r', '4');
    icon.appendChild(circle);
    dot.appendChild(icon);
    return dot;
  }

  function getImageDimensions(slide) {
    var link = slide.querySelector('a[data-size]');
    var image = slide.querySelector('img');
    var dataSize = link && link.getAttribute('data-size');
    var match = dataSize && dataSize.match(/^(\d+)x(\d+)$/);

    if (match) {
      return {
        width: Number(match[1]),
        height: Number(match[2])
      };
    }

    if (!image) {
      return {
        width: 0,
        height: 0
      };
    }

    return {
      width: Number(image.getAttribute('width')) || image.naturalWidth || 0,
      height: Number(image.getAttribute('height')) || image.naturalHeight || 0
    };
  }

  function applyFrameSize(wrapper, slides) {
    var maxWidth = 0;
    var maxHeight = 0;

    slides.forEach(function (slide) {
      var dimensions = getImageDimensions(slide);
      maxWidth = Math.max(maxWidth, dimensions.width);
      maxHeight = Math.max(maxHeight, dimensions.height);
    });

    if (!maxWidth || !maxHeight) {
      return;
    }

    wrapper.style.setProperty('--gallery-carousel-frame-width', maxWidth + 'px');
    wrapper.style.setProperty('--gallery-carousel-aspect-ratio', maxWidth + ' / ' + maxHeight);
  }

  function openSlideLinkInNewTab(slide) {
    var link = slide.querySelector('a[href]');

    if (!link) {
      return;
    }

    link.setAttribute('target', '_blank');

    var rel = link.getAttribute('rel') || '';
    var relParts = rel.split(/\s+/).filter(Boolean);

    ['noopener', 'noreferrer'].forEach(function (value) {
      if (relParts.indexOf(value) === -1) {
        relParts.push(value);
      }
    });

    link.setAttribute('rel', relParts.join(' '));
  }

  function initGalleryCarousel(candidate) {
    var gallery = candidate.classList.contains('gallery') ? candidate : candidate.querySelector('.gallery');
    var wrapper = candidate.classList.contains('gallery-wrapper') ? candidate : gallery && gallery.closest('.gallery-wrapper');

    if (!gallery || !wrapper || wrapper.hasAttribute('data-gallery-carousel-ready')) {
      return;
    }

    var slides = Array.prototype.slice.call(gallery.children).filter(function (child) {
      return child.classList.contains('gallery__item');
    });
    if (!slides.length) {
      return;
    }

    wrapper.setAttribute('data-gallery-carousel-ready', 'true');
    wrapper.setAttribute('aria-roledescription', 'carousel');
    wrapper.setAttribute('tabindex', '0');
    wrapper.classList.add('gallery-carousel');
    gallery.classList.add('gallery-carousel__track');

    var stage = document.createElement('div');
    var viewport = document.createElement('div');
    var previous = createButton('Previous gallery image', 'prev');
    var next = createButton('Next gallery image', 'next');
    var caption = document.createElement('p');
    var dots = document.createElement('div');

    stage.className = 'gallery-carousel__stage';
    viewport.className = 'gallery-carousel__viewport';
    caption.className = 'gallery-carousel__caption';
    caption.setAttribute('aria-live', 'polite');
    dots.className = 'gallery-carousel__dots';
    dots.setAttribute('aria-label', 'Gallery image navigation');

    wrapper.insertBefore(stage, gallery);
    viewport.appendChild(gallery);
    stage.appendChild(previous);
    stage.appendChild(viewport);
    stage.appendChild(next);
    wrapper.appendChild(caption);
    wrapper.appendChild(dots);

    var activeIndex = 0;
    var startX = null;
    var hasSwiped = false;
    var dotButtons = slides.map(function (slide, index) {
      var dot = createDot(index);
      dot.addEventListener('click', function () {
        goTo(index);
      });
      dots.appendChild(dot);
      return dot;
    });

    slides.forEach(function (slide) {
      var image = slide.querySelector('img');
      slide.classList.add('gallery-carousel__slide');
      openSlideLinkInNewTab(slide);

      if (!image || image.complete) {
        return;
      }

      image.addEventListener('load', function () {
        applyFrameSize(wrapper, slides);
      }, { once: true });
    });

    function update() {
      var activeCaption = slides[activeIndex].querySelector('figcaption');
      var activeCaptionHtml = activeCaption ? activeCaption.innerHTML.trim() : '';

      gallery.style.transform = 'translateX(-' + activeIndex * 100 + '%)';
      previous.disabled = slides.length < 2;
      next.disabled = slides.length < 2;
      caption.hidden = !activeCaptionHtml;
      caption.innerHTML = activeCaptionHtml;
      dots.hidden = slides.length < 2;

      slides.forEach(function (slide, index) {
        slide.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
      });

      dotButtons.forEach(function (dot, index) {
        var isActive = index === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }

    function goTo(index) {
      activeIndex = (index + slides.length) % slides.length;
      update();
    }

    previous.addEventListener('click', function () {
      goTo(activeIndex - 1);
    });

    next.addEventListener('click', function () {
      goTo(activeIndex + 1);
    });

    wrapper.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        goTo(activeIndex - 1);
      }

      if (event.key === 'ArrowRight') {
        goTo(activeIndex + 1);
      }
    });

    viewport.addEventListener('pointerdown', function (event) {
      startX = event.clientX;
      hasSwiped = false;
    });

    viewport.addEventListener('pointerup', function (event) {
      if (startX === null) {
        return;
      }

      var delta = event.clientX - startX;
      startX = null;

      if (Math.abs(delta) < 48) {
        return;
      }

      hasSwiped = true;
      goTo(delta > 0 ? activeIndex - 1 : activeIndex + 1);
    });

    viewport.addEventListener('click', function (event) {
      if (!hasSwiped) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      hasSwiped = false;
    }, true);

    applyFrameSize(wrapper, slides);
    update();
  }

  function init() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll([
      '.gallery-wrapper.carousel',
      '.gallery-wrapper.gallery-carousel',
      '.gallery-wrapper.is-carousel',
      '.gallery.carousel',
      '.gallery.gallery-carousel',
      '.gallery.is-carousel',
      '.carousel .gallery-wrapper',
      '.gallery-carousel .gallery-wrapper',
      '.is-carousel .gallery-wrapper'
    ].join(',')));

    candidates.forEach(function (candidate) {
      if (hasCarouselClassNearby(candidate)) {
        initGalleryCarousel(candidate);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
