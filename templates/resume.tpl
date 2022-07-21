<!doctype html>
<html lang="en">
  <head>
    {% include "_includes/head.njk" %}
    <link href="https://fonts.googleapis.com/css2?family=Lustria&family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://system.damato.design/themes/resume.theme.css">
    <link rel="stylesheet" href="resume.styles.css">
    <script type="text/javascript" src="qrcode.min.js"></script>
  </head>
  <body data-density-shift>
    <main data-density-shift class="max-content" id="main">
      {% include "_includes/resume-header.njk" %}
      {% include "_includes/resume-summary.njk" %}
      {% include "_includes/resume-experience.njk" %}
    </main>
     <script type="text/javascript">
      const qrcode = document.getElementById('qrcode');
      if (qrcode) new window.QRCode(qrcode, {
        text: 'https://donnie.damato.design/resume',
        width: 64,
        height: 64,
      });
    </script>
  </body>
</html>