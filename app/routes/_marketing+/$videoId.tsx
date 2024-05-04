import fs from "node:fs";

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import ytdl from "ytdl-core";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroupField } from "~/components/forms";

export const meta: MetaFunction = () => [{ title: "Yt Downloader" }];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { videoId } = params;

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const {
      videoDetails: { title, lengthSeconds, description, thumbnails },
      formats,
    } = await ytdl.getBasicInfo(videoUrl);
    const filteredFormats = formats
      .filter(
        (format, index, originalFormats) =>
          index ===
          originalFormats.findIndex((f) => f.quality === format.quality),
      )
      .map(({ quality, qualityLabel, videoCodec, audioCodec }) => ({
        quality,
        qualityLabel,
        videoCodec,
        audioCodec,
      }));

    return json({
      videoDetails: {
        title,
        lengthSeconds,
        description,
        thumbnails,
        url: videoUrl,
      },
      formats: filteredFormats,
    });
  } catch (error) {
    return json({ videoDetails: null, formats: null });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { videoId } = params;
  const formData = await request.formData();
  const downloadType = formData.get("downloadType");
  const quality = formData.get("quality");

  invariant(typeof downloadType === "string", "downloadType is not a string");
  invariant(typeof quality === "string", "quality is not a string");

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highest",
      ...(downloadType === "audio" ? { filter: "audioonly" } : {}),
    });
    const extension = format.mimeType?.split(";")[0].split("/")[1];
    const fileName = `${info.videoDetails.title}_[${format.qualityLabel}].${extension}`;

    await new Promise((resolve, reject) => {
      const file = ytdl.downloadFromInfo(info, { format });
      const writeStream = fs.createWriteStream(fileName);

      file.pipe(writeStream);

      writeStream.on("finish", resolve);

      writeStream.on("error", reject);
    });
    const mediaFile = fs.readFileSync(fileName);

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

export default function Index() {
  const lastResult = useActionData<typeof action>();
  console.log(lastResult);
  const loaderData = useLoaderData<typeof loader>();
  const [videoUrl, setVideoUrl] = useState<string>(
    loaderData?.videoDetails?.url || "",
  );
  const [downloadType, setDownloadType] = useState<string>("video");
  const location = useLocation();
  const navigate = useNavigate();
  const videoDetails = loaderData?.videoDetails;
  const formats = loaderData?.formats;
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
  };
  const handleSearch = () => {
    const videoId = ytdl.getURLVideoID(videoUrl);
    const [currentVideoId] = location.pathname.split("/").filter(Boolean);

    if (videoId && videoId !== currentVideoId) {
      navigate(`/${videoId}`, { replace: true });
    }
  };
  const handleTabHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // @ts-expect-error - target is not available on HTMLDivElement
    const id = e.target.getAttribute("id");

    if (id) {
      setDownloadType(id.split("-").pop());
    }
  };

  return (
    <main className="flex flex-col p-4 w-full lg:items-center">
      <div className="lg:w-1/2">
        <div>
          <h1 className="text-3xl lg:text-5xl text-center mb-8 lg:mb-14">
            Youtube video downloader
          </h1>

          <div className="flex">
            {/* <Field
              className="flex-1"
              field={fields.url}
              labelProps={{ children: "" }}
              inputProps={{
                ...getInputProps(fields.url, { type: "url" }),
                placeholder: "https://www.youtube.com/watch?v=xxxxxx",
              }}
            /> */}
            <Input
              onChange={handleUrlChange}
              value={videoUrl}
              placeholder="https://www.youtube.com/watch?v=xxxxxx"
            />

            <Button
              type="button"
              onClick={handleSearch}
              disabled={!videoUrl.length}
            >
              Convert
            </Button>
          </div>
        </div>

        {videoDetails ? (
          <Form className="mt-4" method="post">
            <input
              value={downloadType}
              readOnly
              className="w-0"
              name="downloadType"
            />
            <Card>
              <CardHeader>
                <CardTitle>{videoDetails.title}</CardTitle>
                <CardDescription className="flex max-sm:flex-col gap-4">
                  <img
                    src={videoDetails.thumbnails?.[0]?.url}
                    alt={videoDetails.title}
                    className="rounded-md"
                  />
                  <span> {videoDetails.description}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="video" className="w-full">
                  <TabsList className="w-full" onClick={handleTabHeaderClick}>
                    <TabsTrigger className="w-1/2" value="video">
                      Video
                    </TabsTrigger>
                    <TabsTrigger className="w-1/2" value="audio">
                      Audio
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="video">
                    <div>
                      <RadioGroupField
                        labelProps={{ children: "Quality", className: "mb-1" }}
                        field={{ id: "quality", errorId: "quality-error" }}
                        radiogroupProps={{
                          id: "quality",
                          name: "quality",

                          className: "flex flex-wrap gap-8",
                        }}
                        options={(formats || []).map((format) => ({
                          label: format.qualityLabel as string,
                          value: format.quality as string,
                        }))}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="audio">
                    <RadioGroupField
                      labelProps={{ children: "Quality", className: "mb-1" }}
                      field={{ id: "quality", errorId: "quality-error" }}
                      radiogroupProps={{
                        id: "quality",
                        name: "quality",
                        className: "flex flex-wrap gap-8",
                        defaultValue: "highest",
                      }}
                      options={[{ label: "Audio", value: "highest" }]}
                    />
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full mt-8">
                  Download
                </Button>
              </CardContent>
            </Card>
          </Form>
        ) : null}
      </div>
    </main>
  );
}
