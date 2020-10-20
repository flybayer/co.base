import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../api-utils/createAPI";
import { createGetURL, s3Client, S3_BUCKET } from "../../api-utils/s3Client";
import { database } from "../../data/database";

const clipURLCache = new Map<number, string>();
async function getClipWithReadURL(clip: { id: number }) {
  if (clipURLCache.has(clip.id)) {
    return {
      url: clipURLCache.get(clip.id),
      ...clip,
    };
  }
  const clipURL = await createGetURL(`clips/upload/c_${clip.id}.mov`);
  clipURLCache.set(clip.id, clipURL);
  setTimeout(() => {
    // clear cache in 1 day. because we request 2 day URLs, we they will be usable on the client for at least one day
    clipURLCache.delete(clip.id);
  }, 1000 * 60 * 60 * 24);
  return {
    url: clipURL,
    ...clip,
  };
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (!s3Client || !S3_BUCKET) {
      throw new Error("S3 not configured");
    }
    const clips = await database.clip.findMany({
      where: {
        publishTime: { not: null },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      take: -5, // grab the last 5
    });
    return {
      clips: await Promise.all(clips.map(getClipWithReadURL)),
    };
  }
);

export default APIHandler;
