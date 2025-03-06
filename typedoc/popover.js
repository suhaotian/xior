window.onload = function () {
  console.log('Init popover');
  let id = 0;
  let timer = 0;

  document.querySelector('body .col-content').addEventListener('mouseover', handleMouseEvents);
  document.querySelector('body .col-content').addEventListener('mouseout', handleMouseEvents);

  function handleMouseEvents(e) {
    // Check if target is a link
    const target = e.target.closest('a');
    if (!target) return;

    // Skip links without href attribute or internal page links
    if (!target.getAttribute('href')) return;
    if (target.getAttribute('href').includes('#')) return;

    // Skip "Defined in" links
    const parentText = target.parentElement?.textContent || '';
    if (parentText.startsWith('Defined in')) return;

    let currentId = id;

    if (e.type === 'mouseover') {
      // Remove any existing popover
      removePopover(currentId);

      // Increment ID for new popover
      id++;
      currentId = id;

      fetch(target.getAttribute('href'))
        .then((res) => res.text())
        .then((res) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(res, 'text/html');
          const content = doc.querySelector('.col-content');
          const rect = target.getBoundingClientRect();

          // Calculate available space
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const popoverHeight = 400; // Max height of popover
          const popoverWidth = 400; // Width of popover
          const linkHeight = target.offsetHeight;

          // Position calculations
          let topPos = rect.top + linkHeight + window.scrollY + 15;
          let leftPos = rect.left + window.scrollX + 20;

          // If there's not enough room below, position it above
          if (topPos + popoverHeight > viewportHeight) {
            topPos = Math.max(10, rect.top + window.scrollY - popoverHeight - 25);
          }

          // Ensure it doesn't go off-screen horizontally
          if (leftPos + popoverWidth > viewportWidth) {
            leftPos = Math.max(10, viewportWidth - popoverWidth - 20);
          }

          // Apply styles to popover
          Object.assign(content.style, {
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
          });

          content.setAttribute('data-popover', currentId);

          // Remove breadcrumb if exists
          const breadcrumb = content.querySelector('.tsd-breadcrumb');
          if (breadcrumb) breadcrumb.remove();

          // Handle mouse events on the popover itself
          content.addEventListener('mouseenter', () => clearTimeout(timer));
          content.addEventListener('mouseleave', () => removePopover(currentId));

          document.body.appendChild(content);
        })
        .catch((error) => {
          console.error('Error fetching content:', error);
        });
    } else {
      // On mouseout, remove popover after delay
      timer = setTimeout(() => removePopover(currentId), 200);
    }
  }

  function removePopover(popoverId) {
    const popover = document.querySelector(`[data-popover="${popoverId}"]`);
    if (popover) {
      popover.remove();
    }
  }
};
