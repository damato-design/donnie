import { parse } from 'rss-to-json'
const YOUTUBE_PLAYLIST_XML = `https://www.youtube.com/feeds/videos.xml?playlist_id=PLGdCLFdGE_uwOSFPB0IwRv1JpQoEygdGA`;

export default async (request) => {
  if (request.httpMethod !== "GET") {
    Response.json({ error: 'Failed fetching data' }, { status: 500 });
  }
  const rss = await parse(YOUTUBE_PLAYLIST_XML);
  return Response.json(rss);
}