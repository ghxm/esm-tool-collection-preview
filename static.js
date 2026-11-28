// Browser-side behavior of the static website written by build_site.R.

var TABLE_ID = 'tool-table';
var DETAILS_TAB = 'Detailed Tool Information';

// Web address of each tab (#table, ...); a shown tool has #tool=<name> instead of #details
var TAB_ADDRESSES = {
  'Tool Table': 'table',
  'Detailed Tool Information': 'details',
  'Database Statistics': 'statistics',
  'About this Tool Collection': 'about',
  'How to contribute': 'contribute'
};
var PAGE_TITLE = document.title;
var shownTool = null; // template of the tool in the details tab, kept for this visit only (nothing is stored in the browser)
var applying = false; // true while the page follows the web address

// Switches to a tab by its title
function showTab(name) {
  $('a[data-value="' + name + '"]').tab('show');
}

// Shows the description in a tool's template, and the details tab in the tab row
function showTool(tpl) {
  document.getElementById('tool_details').innerHTML = tpl.innerHTML;
  shownTool = tpl;
  showDetailsTab();
}

// Shows the details tab, hidden in the tab row until a tool has been opened (www/custom.css)
function showDetailsTab() {
  document.querySelector('.nav-tabs').classList.add('has-tool');
}

// Moves keyboard focus to the heading of the shown tab
function focusHeading() {
  var heading = document.querySelector('.tab-pane.active h2');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}

// Shows the tab and tool named in the web address, at the scroll position remembered for it;
// a new view starts at the tabs (the top of the page on wide screens, below the filters on phones)
function applyAddress() {
  var address = location.hash.slice(1);
  var tab = 'Tool Table';
  var tool = null;
  if (address.indexOf('tool=') === 0) {
    var slug = address.slice(5);
    tool = /^[a-z0-9-]+$/.test(slug) ? document.querySelector('#tool-templates template[data-tool-slug="' + slug + '"]') : null;
    tab = DETAILS_TAB;
  } else {
    for (var name in TAB_ADDRESSES) if (TAB_ADDRESSES[name] === address) tab = name;
    if (tab === DETAILS_TAB) tool = shownTool; // the details tab without a tool shows the last tool opened in this visit
  }
  if (tab === DETAILS_TAB) {
    // Without a tool (none opened yet, or an unknown name) the table is shown instead
    if (tool) showTool(tool);
    else tab = 'Tool Table';
    history.replaceState(history.state, '', '#' + (tool ? 'tool=' + tool.getAttribute('data-tool-slug') : 'table'));
  }
  applying = true;
  showTab(tab);
  applying = false;
  var active = document.querySelector('.nav-tabs li.active');
  if (active) {
    active.scrollIntoView({ block: 'nearest', inline: 'center' }); // tab row on phones scrolls sideways
    fadeTabEdges();
  }
  document.title = tab === DETAILS_TAB && shownTool ? shownTool.getAttribute('data-tool-name') + ' – ' + PAGE_TITLE : PAGE_TITLE;
  var saved = history.state && history.state.scrollY;
  var tabsTop = document.querySelector('.nav-tabs').getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, saved != null ? saved : Math.max(0, tabsTop - 30)); // 30 px, as the page's top margin
}

// Goes to `address` as a new history entry; the current entry keeps its scroll position for Back
function goTo(address) {
  if (location.hash === '#' + address) return;
  var from = location.hash.slice(1) || 'table';
  history.replaceState($.extend({}, history.state, { scrollY: window.scrollY }), '');
  history.pushState({ from: from }, '', '#' + address);
  applyAddress();
}

// Opens the description of the tool in table row `index` and moves keyboard focus to it
function openTool(index) {
  var tpl = document.querySelector('#tool-templates template[data-tool-index="' + index + '"]');
  if (!tpl) return;
  goTo('tool=' + tpl.getAttribute('data-tool-slug'));
  focusHeading();
}

// Tab clicks go through the web address, so Back and Forward follow them
$(document).on('show.bs.tab', function (event) {
  if (applying) return;
  event.preventDefault();
  var tab = $(event.target).attr('data-value');
  var last = tab === DETAILS_TAB && shownTool;
  goTo(last ? 'tool=' + last.getAttribute('data-tool-slug') : TAB_ADDRESSES[tab]);
});

// Links to these addresses ("How to cite", "Back to table") as well; "Back to table" acts like Back if you came from the table
$(document).on('click', 'a[href^="#"]', function (event) {
  var address = this.getAttribute('href').slice(1);
  var known = address.indexOf('tool=') === 0 || Object.keys(TAB_ADDRESSES).some(function (t) { return TAB_ADDRESSES[t] === address; });
  if (!known || this.hasAttribute('data-toggle')) return;
  event.preventDefault();
  if ($(this).hasClass('back-to-table') && history.state && history.state.from === 'table') {
    history.back();
  } else {
    goTo(address);
    if (address !== 'table') focusHeading();
  }
});

$(window).on('popstate hashchange', applyAddress);

// Chart images: loads the version drawn for the width closest to the column width
function fitPlots() {
  $('img[data-plot-base]').each(function () {
    var width = this.parentElement.clientWidth;
    if (!width) return; // tab not visible
    var widths = this.getAttribute('data-plot-widths').split(',').map(Number);
    var pick = widths.reduce(function (a, b) { return Math.abs(b - width) < Math.abs(a - width) ? b : a; });
    var src = this.getAttribute('data-plot-base') + '-' + pick + '.png';
    if (this.getAttribute('src') !== src) this.setAttribute('src', src);
  });
}
$(document).on('shown.bs.tab', fitPlots);
$(window).on('resize', fitPlots);

// Scrolls back to the search field above the table if it is above the window (20 px gap, as the sidebar)
function scrollToTable() {
  var top = document.querySelector('.search-row').getBoundingClientRect().top;
  if (top < 0) window.scrollTo(0, window.scrollY + top - 20);
}

// Phones: the filters sit above the table (#filter-slot) instead of in the sidebar
var PHONE = window.matchMedia('(max-width: 991px)'); // as the phone layout in custom.css
function placeFilters() {
  var box = document.getElementById('filter-box');
  var target = PHONE.matches ? document.getElementById('filter-slot') : document.querySelector('.row > .col-sm-2');
  if (box.parentElement !== target) target.appendChild(box);
}
placeFilters(); // right away, before the page is first drawn
PHONE.addEventListener('change', placeFilters);

// Tab row on phones: marks the edges where more tabs can be swiped into view (faded in custom.css)
function fadeTabEdges() {
  var row = document.querySelector('.nav-tabs');
  row.classList.toggle('more-left', row.scrollLeft > 1);
  row.classList.toggle('more-right', row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
}

// "Filters" button on phones: opens and closes the filter panel
function toggleFilters() {
  var button = document.getElementById('filter-toggle');
  var open = button.parentElement.classList.toggle('filters-open');
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
}

// Number of selected filter values, shown on the "Filters" button
function showFilterCount() {
  var n = 0;
  $('select[data-filter-column]').each(function () { n += ($(this).val() || []).length; });
  $('#filter-toggle .filter-count').text(n ? '(' + n + ' active)' : '');
}

// Line above the table: how many tools match the filters and the search
function showMatchCount(state) {
  var shown = state.sortedData.length, total = state.data.length;
  document.getElementById('match-count').textContent = shown === total ?
    'Showing all ' + total + ' tools' : 'Showing ' + shown + ' of ' + total + ' tools';
}

// Search field above the table: searches the hidden column with the shown text (build_site.R)
$(document).on('input', '#table-search', function () {
  Reactable.setSearch(TABLE_ID, this.value || undefined);
});

// Updates the count on every change of the table, once the table has been drawn
function watchMatchCount() {
  try {
    Reactable.onStateChange(TABLE_ID, showMatchCount);
  } catch (e) {
    setTimeout(watchMatchCount, 100); // table not drawn yet
  }
}

// Tool descriptions: "Expand all" opens every section, "Collapse all" closes them all
function updateExpandButton() {
  var button = document.querySelector('#tool_details .expand-all');
  if (button) button.textContent = document.querySelector('#tool_details details:not([open])') ? 'Expand all' : 'Collapse all';
}
$(document).on('click', '#tool_details .expand-all', function () {
  var open = !!document.querySelector('#tool_details details:not([open])');
  document.querySelectorAll('#tool_details details').forEach(function (d) { d.open = open; });
  updateExpandButton();
});
document.addEventListener('toggle', updateExpandButton, true); // toggle events of sections don't bubble

// Links in the table only open the link, not also the tool description of their row
document.addEventListener('click', function (event) {
  if (event.target.closest && event.target.closest('#tool-table a')) event.stopPropagation();
}, true);

$(function () {
  history.scrollRestoration = 'manual'; // scroll positions are restored by applyAddress()
  fitPlots();
  watchMatchCount();

  // Filter dropdowns: selectize as in Shiny, filtering the table on change
  $('select[data-filter-column]').each(function () {
    var el = this;
    var config = document.querySelector('script[data-for="' + el.id + '"]');
    $(el).selectize(config ? JSON.parse(config.textContent) : {});
    $(el).on('change', function () {
      var values = $(el).val() || [];
      Reactable.setFilter(TABLE_ID, el.getAttribute('data-filter-column'), values.length ? values : undefined);
      showFilterCount();
      scrollToTable();
    });
  });

  $('#filter-toggle').on('click', toggleFilters);

  $('.nav-tabs').on('scroll', fadeTabEdges);
  $(window).on('load resize', fadeTabEdges); // also once fonts and layout are final
  fadeTabEdges();

  // Reset button: clears all filter dropdowns
  $('#reset-filters').on('click', function () {
    $('select[data-filter-column]').each(function () { this.selectize.clear(); });
  });

  // A link to a tab or tool opens it; last, once the filters above have their final height
  if (location.hash) applyAddress();
});
