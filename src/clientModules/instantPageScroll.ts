/**
 * In-page links scroll smoothly (see `scroll-behavior` in src/css/custom.css),
 * but a move to another page should still start at its top, or at the
 * section it links to, at once. Docusaurus scrolls there with the default
 * behaviour, which the CSS would otherwise make smooth too.
 */
import type {ClientModule} from '@docusaurus/types';

const root = () => document.documentElement.style;

const clientModule: ClientModule = {
  onRouteUpdate({location, previousLocation}) {
    if (previousLocation && location.pathname !== previousLocation.pathname) {
      root().scrollBehavior = 'auto';
    }
  },
  onRouteDidUpdate() {
    root().scrollBehavior = '';
  },
};

export default clientModule;
