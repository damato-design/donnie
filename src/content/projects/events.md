---
title: DS Events
link: https://ds.events
date: 2023-09-19
---

The design systems practice has a worldwide audience looking for ways of connecting. While many platforms can help host events, they aren't often specific to any one group.

> How might we help easily find the next gathering for folks interested in design systems?

The design was collaborative with other members of the community across the globe. There was a delicate balance between a whirlwind of ideas and what was possible as a viable solution. We aimed to keep things simple for the first release; a feed of events, accessible through iCal and RSS formats. We also tried to make it easy for the community to add their events and switch time zones quickly for planning travel.

The site is built using Astro and content is stored as Markdown files with Frontmatter metadata. Posting an event is mostly self-service, which creates a Github pull request for a small team to review before publishing. This avoids a need for a custom role-based access control system and supports deploy previews with Netlify to verify the final presentation.