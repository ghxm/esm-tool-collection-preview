// Browser-side behavior of the static website written by build_site.R.

var TABLE_ID = 'tool-table';

// Switches to a tab by its title
function showTab(name) {
  $('a[data-value="' + name + '"]').tab('show');
}

// Shows the description of the tool in table row `index`
function showTool(index) {
  var tpl = document.querySelector('#tool-templates template[data-tool-index="' + index + '"]');
  if (tpl) document.getElementById('tool_details').innerHTML = tpl.innerHTML;
}

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

$(function () {
  fitPlots();

  // Filter dropdowns: selectize as in Shiny, filtering the table on change
  $('select[data-filter-column]').each(function () {
    var el = this;
    var config = document.querySelector('script[data-for="' + el.id + '"]');
    $(el).selectize(config ? JSON.parse(config.textContent) : {});
    $(el).on('change', function () {
      var values = $(el).val() || [];
      Reactable.setFilter(TABLE_ID, el.getAttribute('data-filter-column'), values.length ? values : undefined);
    });
  });
});
