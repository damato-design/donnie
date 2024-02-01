---
image: ./images/domtricks.jpg
headline: DOM Tricks
datetime: 2020-04-03T00:00:00.000Z
summary: Byte-sized techniques for web pages
link: https://dom-tricks.com
---
Documentation is one of the least prioritized tasks in design and development. This is often because the exercise of documentation is more appropriate in another context from where the resources are created.

> How might we support documentation in the same context as the resource?

Paying homage to CSS-Tricks, this project was originally meant to be a showcase of native JavaScript DOM methods to solve common problems. While there isn't much content due to other projects, there is a unique method to create content

Each page of content was made from testable source code. You can think of each section as steps of a test expectation. The documentation describing the functionality is written in JSDoc, which is then all synthesized into compiled HTML pages. This ensures that creating, testing, and documenting all occur as the same unit of work.