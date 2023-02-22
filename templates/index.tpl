<!doctype html>
<html lang="en">
  <head>
    {% include "_includes/head.njk" %}
    <link rel="stylesheet" href="index.styles.css">
  </head>
  <body>
    <main>
      <div>
        {% include "_includes/header.njk" %}
        {% include "_includes/hero.njk" %}
        <ul class="timeline">
          <interest-point 
            title="adjunct professor @ parsons school of design"
            url="https://parsons.edu"
            type="role"
            datetime="2020-01-30T00:00:00.000Z"></interest-point>
          <interest-point 
            title="principle engineer @ godaddy"
            url="https://godaddy.com"
            type="role"
            datetime="2019-07-28T00:00:00.000Z"></interest-point>
          <interest-point 
            title="senior ux engineer @ compass"
            url="https://compass.com"
            type="role"
            datetime="2017-04-15T00:00:00.000Z"></interest-point>
        </ul>
      </div>
    </main>
  </body>
</html>