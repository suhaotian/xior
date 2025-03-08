/* eslint-disable */
/* eslint-disable-for-generated-file */
/* prettier-disable */

window.onload = function () {
  console.log('Init popover');
  var id = 0;
  var timer = 0;
  var timer2 = 0;

  document.querySelector('body .col-content').addEventListener('mouseover', handleMouseEvents);
  document.querySelector('body .col-content').addEventListener('mouseout', handleMouseEvents);

  function handleMouseEvents(e) {
    // Check if target is a link
    var target = e.target.closest('a');
    if (!target) return;

    // Skip links without href attribute or internal page links
    if (!target.getAttribute('href')) return;
    if (target.getAttribute('href').includes('#')) return;

    // Skip "Defined in" links
    var parentText = target.parentElement?.textContent || '';
    if (parentText.startsWith('Defined in')) return;

    var currentId = id;

    if (e.type === 'mouseover') {
      // Remove any existing popover
      removePopover(currentId);

      // Increment ID for new popover
      id++;
      currentId = id;

      fetch(target.getAttribute('href'))
        .then(function (res) {
          return res.text();
        })
        .then(function (res) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(res, 'text/html');
          var content = doc.querySelector('.col-content');
          var rect = target.getBoundingClientRect();

          // Calculate available space
          var viewportHeight = window.innerHeight;
          var viewportWidth = window.innerWidth;
          var popoverHeight = 400; // Max height of popover
          var popoverWidth = 400; // Width of popover
          var linkHeight = target.offsetHeight;
          if (viewportHeight < popoverHeight) {
            popoverHeight = viewportHeight - 40;
          }
          if (viewportWidth < popoverWidth) {
            popoverWidth = viewportWidth - 40;
          }

          // Position calculations
          var topPos = rect.top + linkHeight + window.scrollY + 5;

          var leftPos = rect.left + window.scrollX + 20;

          // If there's not enough room below, position it above
          if (topPos + popoverHeight > viewportHeight) {
            topPos = Math.max(10, rect.top + window.scrollY - popoverHeight - 5);
          }

          // Ensure it doesn't go off-screen horizontally
          if (leftPos + popoverWidth > viewportWidth) {
            leftPos = Math.max(10, viewportWidth - popoverWidth - 20);
          }

          // Apply styles to popover
          Object.assign(content.style, {
            opacity: 0,
            position: 'absolute',
            top: `${topPos}px`,
            left: `${leftPos}px`,
            width: '400px',
            padding: '10px',
            borderRadius: '10px',
            maxWidth: '100%',
            maxHeight: '400px',
            overflowY: 'auto',
            fontSize: '14px',
            background: '#fff',
            zIndex: '9999',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            transition: 'opacity .3s ease',
          });

          content.setAttribute('data-popover', currentId);

          // Remove breadcrumb if exists
          var breadcrumb = content.querySelector('.tsd-breadcrumb');
          if (breadcrumb) breadcrumb.remove();

          // Handle mouse events on the popover itself
          content.addEventListener('mouseenter', function () {
            clearTimeout(timer);
            clearTimeout(timer2);
          });
          content.addEventListener('mouseleave', function () {
            removePopover(currentId);
          });

          document.body.appendChild(content);
          timer2 = setTimeout(function () {
            // Position calculations
            var topPos = rect.top + linkHeight + window.scrollY + 5;
            popoverHeight = content.getBoundingClientRect().height;
            // If there's not enough room below, position it above
            if (topPos + popoverHeight > viewportHeight) {
              topPos = Math.max(10, rect.top + window.scrollY - popoverHeight - 5);
            }
            content.style.top = topPos + 'px';
            content.style.opacity = 1;
          }, 100);
        })
        .catch(function (error) {
          console.error('Error fetching content:', error);
        });
    } else {
      // On mouseout, remove popover after delay
      timer = setTimeout(function () {
        removePopover(currentId);
      }, 200);
    }
  }

  function removePopover(popoverId) {
    var popover = document.querySelector(`[data-popover="${popoverId}"]`);
    if (popover) {
      popover.remove();
    }
  }
};
