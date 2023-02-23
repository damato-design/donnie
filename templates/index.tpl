<!doctype html>
<html lang="en">
  <head>
    {% include "_includes/head.njk" %}
    <link rel="stylesheet" href="index.styles.css">
  </head>
  <body>
    <div class="max-width">
      <div>
        {% include "_includes/header.njk" %}
        {% include "_includes/hero.njk" %}
        <main id="timeline">
          <div class="select">
            <select id="filter"></select>
          </div>
          <div id="points"></div>
        </main>
      </div>
    </div>
    {% include "_includes/footer.njk" %}
  </body>
</html>