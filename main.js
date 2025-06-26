/*
 * Tabulator Tree Table for Looker
 * Author: Syful Islam Alif – 2025-06-26
 *
 * Requires: tabulator.min.js and tabulator.min.css in the same folder.
 * 
 */

looker.plugins.visualizations.getAssetUrl('tabulator.min.css')
looker.plugins.visualizations.loadJs(
  looker.plugins.visualizations.getAssetUrl('tabulator.min.js')
)

if (looker?.themes?.currentTheme === 'dark') {
  var darkLink = document.createElement('link');
  darkLink.rel  = 'stylesheet';
  darkLink.type = 'text/css';
  darkLink.href = looker.plugins.visualizations.getAssetUrl('tabulator_midnight.min.css');
  document.head.appendChild(darkLink);
}


looker.plugins.visualizations.add({

  id: 'tabulator_tree',
  label: 'Tabulator Tree Table',

  // Optional user-visible settings
  options: {
    start_expanded: {
      type: 'boolean',
      label: 'Start tree expanded',
      default: false
    },
    row_height: {
      type: 'number',
      label: 'Row height (px)',
      default: 30,
      display: 'select',
      values: [{30: '30'}, {36: '36'}, {42: '42'}]
    }
  },

  // ----------------------------------------------------------------------
  // CREATE - runs once per tile
  // ----------------------------------------------------------------------
  create: function (element, config) {
    // Base container
    this.container = element;
    element.innerHTML = '<div id="tabulator-root" style="height:100%;width:100%;"></div>';

    // Inject Tabulator CSS once
    if (!document.getElementById('tabulator-css')) {
      var link = document.createElement('link');
      link.id   = 'tabulator-css';
      link.rel  = 'stylesheet';
      link.type = 'text/css';
      link.href = looker.plugins.visualizations.getAssetUrl('tabulator.min.css');
      document.head.appendChild(link);
    }

    // Lazy-load Tabulator JS if necessary
    if (typeof Tabulator === 'undefined') {
      looker.plugins.visualizations.loadJs(
        looker.plugins.visualizations.getAssetUrl('tabulator.min.js')
      ).then(() => {
        this._ready = true;
      });
    } else {
      this._ready = true;
    }

    // Holder for the table instance
    this.table = null;
  },

  // ----------------------------------------------------------------------
  // UPDATE – runs every time data or settings change
  // ----------------------------------------------------------------------
  updateAsync: function (data, element, config, queryResponse, details, done) {

    // Wait until Tabulator library is ready
    if (!this._ready) { done(); return; }

    //--------------------------------------------------------------------
    // 1. Build columns from Looker fields
    //--------------------------------------------------------------------
    var fields = [].concat(
      queryResponse.fields.dimensions,
      queryResponse.fields.measures
    );

    var columns = fields.map(function (f) {
      return {
        title: f.label_short || f.label,
        field: f.name,
        formatter: function (cell) {
          // Render HTML from Looker where appropriate
          var raw = cell.getValue();
          return LookerCharts.Utils.htmlForCell ? LookerCharts.Utils.htmlForCell(raw) : raw;
        },
        headerSort: true,
        responsive: 0
      };
    });

    //--------------------------------------------------------------------
    // 2. Transform flat rows into a hierarchy
    //     Assumption: you pass a **dimension hierarchy**:
    //     ─ the first N dimensions represent parent➜child➜… order.
    //--------------------------------------------------------------------
    var dimNames = queryResponse.fields.dimensions.map(function (d) { return d.name; });

    function nestRows(flat) {
      var rootMap = {};
      flat.forEach(function (lookerRow) {
        var currentLevel = rootMap;
        dimNames.forEach(function (dim, idx) {
          var key = lookerRow[dim].value;
          if (!currentLevel[key]) {
            // make a node
            currentLevel[key] = {
              _tabulator_key: dim + ':' + key, // unique id
              [dim]: lookerRow[dim].value
            };
          }
          // last dimension - copy measures
          if (idx === dimNames.length - 1) {
            queryResponse.fields.measures.forEach(function (m) {
              currentLevel[key][m.name] = lookerRow[m.name].value;
            });
          }

          // prepare child map
          currentLevel[key]._children = currentLevel[key]._children || {};
          currentLevel = currentLevel[key]._children;
        });
      });

      // Convert nested object map ➜ array that Tabulator expects
      function mapToArray(obj) {
        return Object.keys(obj).map(function (k) {
          var node = obj[k];
          if (Object.keys(node._children).length) {
            node._children = mapToArray(node._children);
          } else {
            delete node._children; // leaf
          }
          return node;
        });
      }
      return mapToArray(rootMap);
    }

    var tableData = nestRows(data);

    //--------------------------------------------------------------------
    // 3. Initialise or refresh Tabulator
    //--------------------------------------------------------------------
    if (!this.table) {
      this.table = new Tabulator('#tabulator-root', {
        dataTree: true,
        dataTreeStartExpanded: config.start_expanded,
        dataTreeChildField: '_children',
        layout: 'fitDataStretch',
        rowHeight: config.row_height,
        reactiveData: true,
        columns: columns
      });
    }

    // Update data & config
    this.table.setData(tableData);
    this.table.updateOptions({
      dataTreeStartExpanded: config.start_expanded,
      rowHeight: config.row_height
    });

    done();
  }
});
