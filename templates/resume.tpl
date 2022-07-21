<!doctype html>
<html lang="en">
  <head>
    {% include "_includes/head.njk" %}
    <link href="https://fonts.googleapis.com/css2?family=Hepta+Slab:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="resume.styles.css">
  </head>
  <body data-density-shift>
    <main data-density-shift class="max-content content" id="main">
      {% include "_includes/resume-header.njk" %}
      {% include "_includes/resume-summary.njk" %}
      {% include "_includes/resume-experience.njk" %}
    </main>
  </body>
</html>