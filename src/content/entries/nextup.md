---
image: ./images/nextup.jpg
headline: Next Up
datetime: 2014-07-27T00:00:00.000Z
summary: Automated tournament software
link: https://nextup.me
disabled: true
---
During my years after high school, I was very interested in competitive video gaming. I'd go to local tournaments fairly regularly and even some across state lines. Eventually, I'd become a well-known tournament organizer and host some of the first international gaming tournaments with significant prizes.

One of the most stressful responsibilities would be finding registered competitors. At large events with multiple stations for playing, it's hard to keep track of everyone and all the scores. Even with helpful staff, things can get challenging as folks wander off-site. 

> How might we make tournament organization more automated?

The NextUp platform was launched with the ability to link to Challonge, a free bracketing system. A tournament organizer would input participant's names and phone numbers into the system. Once the tournament starts, the system automatically reads the bracket and sends a text message to the participants ready to compete. Once the match ends, the competitors would reply to that text message with their results; either a W or L. The system would then update the bracket and text the next match. The system could also catch conflicts for tournament organizer verification.

This project was my first introduction to backend engineering; written in PHP and using a MySQL database. It connected with Twilio to send text messages using their API. The front end was mostly jQuery.

The system was in use for a few tournaments and had some early successes. However, one tournament reported that the system failed in the middle of a tournament, which caused the bracket to be completely inaccurate. Because the event relied completely on the system, there was no backup of results available. A majority of the tournament needed to be replayed. I sunset the project at that time as I wasn't knowledgeable enough to solve those problems. It was a great learning experience and got me more familiar with a web application stack.