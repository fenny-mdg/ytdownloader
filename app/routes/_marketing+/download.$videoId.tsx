import fs from "node:fs";

import { json, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import ytdl from "ytdl-core";

const { APP_DOWNLOAD_FOLDER } = process.env;

const extensionMapper: Record<string, string> = {
  webm: "mp3",
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { videoId } = params;
  const searchParams = new URL(request.url).searchParams;
  const downloadType = searchParams.get("downloadType");
  const quality = searchParams.get("quality");

  invariant(typeof downloadType === "string", "downloadType is not a string");
  invariant(typeof quality === "string", "quality is not a string");

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, {
      quality,
      ...(downloadType === "audio" ? { filter: "audioonly" } : {}),
    });
    const extension = format.mimeType?.split(";")[0].split("/")[1];
    const fileName = `${info.videoDetails.title}_[${format.qualityLabel || format.audioBitrate}].${extensionMapper[extension!] || extension}`;
    const filePath = `${APP_DOWNLOAD_FOLDER}/${fileName}`;

    await new Promise((resolve, reject) => {
      const file = ytdl.downloadFromInfo(info, { format });
      const writeStream = fs.createWriteStream(filePath);

      file.pipe(writeStream);

      writeStream.on("finish", resolve);

      writeStream.on("error", reject);
    });
    const mediaFile = fs.readFileSync(filePath);

    return new Response(mediaFile, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": format.mimeType!,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
