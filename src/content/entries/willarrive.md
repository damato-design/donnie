---
image: ./images/willarrive.jpg
headline: willarrive.in
datetime: 2016-03-22T00:00:00.000Z
summary: More transit, less taps
link: https://willarrive.in
---
Transit app experiences usually result in a lot of navigation. After all, it is an experience meant to navigate a person to a physical destination. 

> How might we reduce the number of taps but continue to present accurate transit information.

The site allows the user to save a train line web page as a progressive web app to their device. Tapping the icon launches a very minimal interface, first checking for their geographic position to determine the closest stop on the line chosen. Once identified, the relative time of the next train is presented (ie., the next train is in 7 minutes). The only other tap would be to change the direction as most platforms allow for a train line to go in two directions. As a result, the user will tap at most twice to learn when the next train will come to their station, and in many cases only once.

The site makes heavy use of subdomain redirecting and Lambda functions to render train line branding based on the requested URL. The native JavaScript Geopositon API is used to capture the user's location and train times are provided by the MTA in real-time.