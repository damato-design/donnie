---
title: deltazeus
link: https://deltazeus.com
date: 2015-03-22
---

It's common for people to check the weather regularly. This ritual is how we prepare for taking on the day. However, what if instead of this being an active experience, it could be instead a passive one? What if the weather could notify you when it changed significantly?

The onboarding experience would ask for a location marker, either postal code or geo-location, and return an RSS feed that you could use any number of services to subscribe for updates. This made the method of receiving updates flexible and did not require any additional app or download. The feed would only update if the difference between the weather measurements were significantly different between yesterday and today. If the weather was similar between yesterday and today, you wouldn't receive any updates and can prepare for today just like yesterday.

To keep costs low for requesting data from the DarkSky API, updates would only occur for any given feed if it was actively subscribed. This was achieved by checking incoming requests and determining if a feed should be added or updated, or a lack of requests to deprecate a feed.

Most of the work for the system was done server-side with a very minimal web homepage. Additional care was taken to custom style the feeds if they were visited directly. While the original system is no longer operating at this time due to the deprecation of DarkSky, the concept was adopted by social platforms such as Facebook and Google Plus soon after the initial launch of the project.