/*
 * The search box of docusaurus-lunr-search 3.6.0
 * (node_modules/docusaurus-lunr-search/src/theme/SearchBar/index.jsx), with
 * its interface text in Bahasa Indonesia. The rest of the plugin is used as
 * it is: when updating the plugin, compare its index.jsx with this file.
 */
import React, { useRef, useCallback, useState, useEffect } from "react";
import clsx from "clsx";
import { useHistory } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { usePluginData } from "@docusaurus/useGlobalData";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { HighlightSearchResults } from "docusaurus-lunr-search/src/theme/SearchBar/HighlightSearchResults";

const PREFIX = "algolia-docsearch-suggestion";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** Replaces the English texts that the plugin builds into its dropdown. */
function translate(DocSearch) {
  if (DocSearch.translated) {
    return;
  }
  DocSearch.translated = true;

  // No match: say so, and what to try next.
  DocSearch.getEmptyTemplate = () => ({ query }) => `
    <div class="${PREFIX}">
      <div class="${PREFIX}--wrapper">
        <div class="${PREFIX}--content ${PREFIX}--no-results">
          <div class="${PREFIX}--title">
            <div class="${PREFIX}--text">
              Tidak ada tulisan yang cocok dengan <b>“${escapeHtml(query)}”</b>.
              Coba kata lain yang lebih umum, atau telusuri Topik dan Arsip.
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Each result is a link; its accessible name was English.
  const suggestion = DocSearch.getSuggestionTemplate;
  DocSearch.getSuggestionTemplate = (isSimpleLayout) => {
    const render = suggestion(isSimpleLayout);
    return (hit) =>
      render(hit).replace(
        'aria-label="Link to the result"',
        'aria-label="Buka tulisan ini"',
      );
  };
}

const Search = props => {
  const initialized = useRef(false);
  const searchBarRef = useRef(null);
  const [indexReady, setIndexReady] = useState(false);
  const history = useHistory();
  const { siteConfig = {} } = useDocusaurusContext();
  const pluginConfig = (siteConfig.plugins || []).find(plugin => Array.isArray(plugin) && typeof plugin[0] === "string" && plugin[0].includes("docusaurus-lunr-search"))
  const isBrowser = useIsBrowser();
  const { baseUrl } = siteConfig;
  const assetUrl = pluginConfig && pluginConfig[1]?.assetUrl || baseUrl;
  const initAlgolia = (searchDocs, searchIndex, DocSearch, options) => {
    translate(DocSearch);
    new DocSearch({
      searchDocs,
      searchIndex,
      baseUrl,
      inputSelector: "#search_input_react",
      // Override algolia's default selection event, allowing us to do client-side
      // navigation and avoiding a full page refresh.
      handleSelected: (_input, _event, suggestion) => {
        const url = suggestion.url || "/";
        // Use an anchor tag to parse the absolute url into a relative url
        // Alternatively, we can use new URL(suggestion.url) but its not supported in IE
        const a = document.createElement("a");
        a.href = url;
        _input.setVal(''); // clear value
        _event.target.blur(); // remove focus

        // Get the highlight word from the suggestion.
        let wordToHighlight = '';
        if (options.highlightResult) {
          try {
            const matchedLine = suggestion.text || suggestion.subcategory || suggestion.title;
            const matchedWordResult = matchedLine.match(new RegExp('<span.+span>\\w*', 'g'));
            if (matchedWordResult && matchedWordResult.length > 0) {
              const tempDoc = document.createElement('div');
              tempDoc.innerHTML = matchedWordResult[0];
              wordToHighlight = tempDoc.textContent;
            }
          } catch (e) {
            console.log(e);
          }
        }

        history.push(url, {
          highlightState: { wordToHighlight },
        });
      },
      maxHits: options.maxHits
    });
  };

  const pluginData = usePluginData('docusaurus-lunr-search');
  const getSearchDoc = () =>
    process.env.NODE_ENV === "production"
      ? fetch(`${assetUrl}${pluginData.fileNames.searchDoc}`).then((content) => content.json())
      : Promise.resolve({});

  const getLunrIndex = () =>
    process.env.NODE_ENV === "production"
      ? fetch(`${assetUrl}${pluginData.fileNames.lunrIndex}`).then((content) => content.json())
      : Promise.resolve([]);

  const loadAlgolia = () => {
    if (!initialized.current) {
      Promise.all([
        getSearchDoc(),
        getLunrIndex(),
        import("docusaurus-lunr-search/src/theme/SearchBar/DocSearch"),
        import("docusaurus-lunr-search/src/theme/SearchBar/algolia.css")
      ]).then(([searchDocFile, searchIndex, { default: DocSearch }]) => {
        const { searchDocs, options } = searchDocFile;
        if (!searchDocs || searchDocs.length === 0) {
          return;
        }
        initAlgolia(searchDocs, searchIndex, DocSearch, options);
        setIndexReady(true);
      });
      initialized.current = true;
    }
  };

  const toggleSearchIconClick = useCallback(
    e => {
      if (!searchBarRef.current.contains(e.target)) {
        searchBarRef.current.focus();
      }

      props.handleSearchBarToggle && props.handleSearchBarToggle(!props.isSearchBarExpanded);
    },
    [props.isSearchBarExpanded]
  );

  let placeholder
  if (isBrowser) {
    loadAlgolia();
    placeholder = window.navigator.platform.startsWith("Mac") ?
      'Cari (⌘K)' : 'Cari (Ctrl+K)'
  }

  // auto focus search bar on page load
  useEffect(() => {
    if (props.autoFocus && indexReady) {
      searchBarRef.current.focus();
    }
  }, [indexReady]);

  return (
    <div className="navbar__search" key="search-box">
      <span
        aria-label="Buka kotak pencarian"
        role="button"
        className={clsx("search-icon", {
          "search-icon-hidden": props.isSearchBarExpanded
        })}
        onClick={toggleSearchIconClick}
        onKeyDown={toggleSearchIconClick}
        tabIndex={0}
      />
      <input
        id="search_input_react"
        type="search"
        // In development there is no index, so it stays at this text.
        placeholder={indexReady ? placeholder : 'Memuat pencarian…'}
        aria-label="Cari tulisan"
        className={clsx(
          "navbar__search-input",
          { "search-bar-expanded": props.isSearchBarExpanded },
          { "search-bar": !props.isSearchBarExpanded }
        )}
        onClick={loadAlgolia}
        onMouseOver={loadAlgolia}
        onFocus={toggleSearchIconClick}
        onBlur={toggleSearchIconClick}
        ref={searchBarRef}
        disabled={!indexReady}
      />
      <HighlightSearchResults />
    </div>
  );
};

export default Search;
