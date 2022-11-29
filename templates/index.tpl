<!doctype html>
<html lang="en">
  <head>
    {% include "_includes/head.njk" %}
    <link rel="stylesheet" href="https://system.damato.design/themes/donnie.theme.css">
    <link rel="stylesheet" href="index.styles.css">
    <script type="text/javascript" src="zdog.dist.min.js" defer></script>
    <script type="text/javascript" src="brickspin.js" defer></script>
  </head>
  <body data-density-shift>
    <canvas id="zdog-illustration" role="presentation"></canvas>
    <header>
      <div class="max-content">
        {% include "_includes/index-header.njk" %}
      </div>
    </header>
    <section class="feature" id="hero">
      <div class="max-content">
        {% include "_includes/index-hero.njk" %}
      </div>
    </section>
    <section>
      <div class="max-content">
        {% include "_includes/index-cards.njk" %}
      </div>
    </section>
    <section>
      <div class="max-content">
        {% include "_includes/index-uxeng.njk" %}
      </div>
    </section>
    <section class="feature">
      <div class="max-content">
        {% include "_includes/index-feature.njk" %}
      </div>
    </section>
    <section>
      <div class="max-content">
        {% include "_includes/index-education.njk" %}
      </div>
    </section>
    <footer>
      <div class="max-content">
        {% include "_includes/index-footer.njk" %}
      </div>
    </footer>
  </body>
</html>