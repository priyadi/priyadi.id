import React from 'react';

export function SarcasmToggler(props) {
  // Add styles for animation
  React.useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('sarcasm-toggler-styles')) {
      const style = document.createElement('style');
      style.id = 'sarcasm-toggler-styles';
      style.textContent = `
        span[data-replace] {
          display: inline-block;
          transition: all 0.3s ease;
        }
        span[data-replace].replacing {
          animation: replaceAnimation 0.6s ease;
          background-color: rgba(255, 193, 7, 0.3);
        }
        @keyframes replaceAnimation {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          25% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
          75% {
            opacity: 0.8;
            transform: scale(0.98);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            background-color: transparent;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const replacements = props?.replacements || REPLACEMENT_MAP;
  const [isToggled, setIsToggled] = React.useState(false);
  const [isWrapped, setIsWrapped] = React.useState(false);
  
  const handleClick = () => {
    const article = document.querySelector('article');
    if (!article) return;
    
    // Helper function to apply case to replacement text
    const applyCase = (text, isUpper) => {
      if (isUpper) {
        return text.charAt(0).toUpperCase() + text.slice(1);
      }
      return text;
    };
    
    if (!isWrapped) {
      // First click: wrap all target strings in spans
      function wrapInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const tempDiv = document.createElement('div');
          let html = node.textContent;
          
          // Wrap each original string from the replacement map
          replacements.forEach(({ original }) => {
            const pattern = new RegExp(`"${original}"`, 'gi');
            html = html.replace(pattern, (match) => {
              const isUpper = match.charAt(1) === match.charAt(1).toUpperCase();
              return `<span data-replace="${original.toLowerCase()}" data-upper="${isUpper}">${match}</span>`;
            });
          });
          
          if (html !== node.textContent) {
            tempDiv.innerHTML = html;
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              fragment.appendChild(tempDiv.firstChild);
            }
            node.parentNode.replaceChild(fragment, node);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   node.tagName !== 'SCRIPT' && 
                   node.tagName !== 'STYLE' &&
                   !node.hasAttribute('data-replace')) {
          Array.from(node.childNodes).forEach(wrapInNode);
        }
      }
      
      wrapInNode(article);
      setIsWrapped(true);
      
      // Now replace the wrapped content with animation
      const spans = article.querySelectorAll('span[data-replace]');
      spans.forEach((span, index) => {
        setTimeout(() => {
          span.classList.add('replacing');
          
          const type = span.getAttribute('data-replace');
          const isUpper = span.getAttribute('data-upper') === 'true';
          
          const mapping = replacements.find(r => r.original.toLowerCase() === type);
          if (mapping) {
            setTimeout(() => {
              span.textContent = applyCase(mapping.replacement, isUpper);
            }, 150);
          }
          
          setTimeout(() => {
            span.classList.remove('replacing');
          }, 600);
        }, index * 30);
      });
      
      setIsToggled(true);
    } else {
      // Toggle between replaced and original with animation
      const spans = article.querySelectorAll('span[data-replace]');
      spans.forEach((span, index) => {
        setTimeout(() => {
          span.classList.add('replacing');
          
          const type = span.getAttribute('data-replace');
          const isUpper = span.getAttribute('data-upper') === 'true';
          
          const mapping = replacements.find(r => r.original.toLowerCase() === type);
          if (mapping) {
            setTimeout(() => {
              if (isToggled) {
                // Revert to original
                span.textContent = `"${applyCase(mapping.original, isUpper)}"`;
              } else {
                // Replace again
                span.textContent = applyCase(mapping.replacement, isUpper);
              }
            }, 150);
          }
          
          setTimeout(() => {
            span.classList.remove('replacing');
          }, 600);
        }, index * 30);
      });
      
      setIsToggled(!isToggled);
    }
  };
  
  return (
    <button className="button button--primary" onClick={handleClick}>
      {isToggled ? 'Kembali ke Versi Asli' : 'Baca Versi Non-Sarkastik'}
    </button>
  );
}
