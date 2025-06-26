# Tabulator Tree Table – Looker Custom Visualization

**Folder contents**

- `manifest.lkml` – registers the visualization with Looker.
- `main.js` – visualization code (ES5, compatible with Looker sandbox).
- `tabulator.min.js`, `tabulator.min.css`, `tabulator_midnight.min.css` – **not included** in this zip to keep it light.  
  Download the matching Tabulator build (e.g. v6.3.0) and drop the files here.
  

**Quick setup**

```bash
# From inside this directory
curl -L https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js  -o tabulator.min.js
curl -L https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css -o tabulator.min.css
curl -L https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator_midnight.min.css -o tabulator_midnight.min.css
```

Then commit & push to your LookML project repository and add the visualization
in **Admin → Platform → Visualizations**.

For full documentation see the [Tabulator docs](https://tabulator.info/) and [Looker Custom Visualization API](https://developers.looker.com/).

*Happy exploring!*  
— Syful Islam Alif
