import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  json,
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { useState } from "react";
import ytdl from "ytdl-core";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { RadioGroupField } from "~/components/forms.tsx";

export const meta: MetaFunction = () => [{ title: "Yt Downloader" }];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { videoId } = params;
  const qualityPrefix = (qualityLabel: string) => {
    const [qualityLabelSplitted] = qualityLabel.split("p");

    return Number(qualityLabelSplitted);
  };
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const {
      videoDetails: { title, lengthSeconds, description, thumbnails },
      formats,
    } = await ytdl.getInfo(videoUrl);
    const videoFormats = formats
      .filter(
        (format, index, originalFormats) =>
          index ===
          originalFormats.findIndex(
            (f) => f.quality === format.quality && Boolean(f.itag),
          ),
      )
      .map(({ quality, qualityLabel, itag }) => ({
        quality,
        qualityLabel,
        itag,
      }))
      .sort((a, b) => {
        const { qualityLabel: aQualityLabel } = a;
        const { qualityLabel: bQualittyLabel } = b;

        return qualityPrefix(aQualityLabel) - qualityPrefix(bQualittyLabel);
      });
    const audioFormats = formats
      .filter((format) => Boolean(format.audioBitrate))
      .map(({ audioBitrate, itag }) => ({
        itag,
        audioBitrate,
      }))
      .sort((a, b) => a.audioBitrate! - b.audioBitrate!);

    return json({
      videoDetails: {
        title,
        lengthSeconds,
        description,
        thumbnails,
        url: videoUrl,
      },
      formats: { videoFormats, audioFormats },
    });
  } catch (error) {
    return json({ videoDetails: null, formats: null });
  }
};

export default function VideoDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const [quality, setQuality] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>(
    loaderData?.videoDetails?.url || "",
  );
  const [downloadType, setDownloadType] = useState<string>("video");
  const location = useLocation();
  const navigate = useNavigate();
  const videoDetails = loaderData?.videoDetails;
  const videoFormats = loaderData?.formats?.videoFormats;
  const audioFormats = loaderData?.formats?.audioFormats;
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
  };
  const [currentVideoId] = location.pathname.split("/").filter(Boolean);
  const handleSearch = () => {
    const videoId = ytdl.getURLVideoID(videoUrl);

    if (videoId && videoId !== currentVideoId) {
      navigate(`/${videoId}`, { replace: true });
    }
  };
  const handleTabHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // @ts-expect-error - target is not available on HTMLDivElement
    const id = e.target.getAttribute("id");

    if (id) {
      setDownloadType(id.split("-").pop());
      setQuality("");
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
          <div className="mt-4">
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
                          className: "flex flex-wrap gap-8 [&>div]:w-[64px]",
                          onValueChange: setQuality,
                        }}
                        options={(videoFormats || []).map((format) => ({
                          label: format.qualityLabel as string,
                          value: `${format.itag}`,
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
                        className: "flex flex-wrap gap-8 [&>div]:w-[64px]",
                      }}
                      options={(audioFormats || []).map((format) => ({
                        label: `${format.audioBitrate}kbps`,
                        value: `${format.itag}`,
                      }))}
                    />
                  </TabsContent>
                </Tabs>

                {quality ? (
                  <Link
                    to={`/download/${currentVideoId}?downloadType=${downloadType}&quality=${quality}`}
                    reloadDocument
                  >
                    <Button className="w-full mt-8">Download</Button>
                  </Link>
                ) : (
                  <Button className="w-full mt-8" disabled>
                    Download
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}
