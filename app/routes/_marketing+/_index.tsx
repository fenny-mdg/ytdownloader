import { getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, redirect, useActionData, useNavigation } from "@remix-run/react";
import ytdl from "ytdl-core";
import { z } from "zod";

import { Button } from "@/components/ui/button.tsx";
import { Field } from "~/components/forms.tsx";
import { youtubeVideoUrlRegex } from "~/utils/regexp.ts";

export const meta: MetaFunction = () => [{ title: "Yt Downloader" }];

const VideoSchema = z.object({
  url: z.string().regex(new RegExp(youtubeVideoUrlRegex)),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: VideoSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { url } = submission.value;

  try {
    const isUrlValid = ytdl.validateURL(url);

    if (!isUrlValid) {
      return submission.reply({
        fieldErrors: { url: ["Invalid youtube video url"] },
      });
    }

    const videoId = ytdl.getURLVideoID(url);

    return redirect(`/${videoId}`);
  } catch (error) {
    return submission.reply({
      fieldErrors: { url: ["Invalid youtube video url"] },
    });
  }
};

export default function Index() {
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const [form, fields] = useForm({
    lastResult,
    id: "search-form",
    constraint: getZodConstraint(VideoSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: VideoSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <main className="flex flex-col p-4 w-full lg:items-center">
      <div className="lg:w-1/2">
        <Form
          method="POST"
          id={form.id}
          aria-invalid={form.errors ? true : undefined}
          aria-describedby={form.errors ? form.errorId : undefined}
          reloadDocument
        >
          <h1 className="text-3xl lg:text-5xl text-center mb-8 lg:mb-14">
            Youtube video downloader
          </h1>

          <div className="flex">
            <Field
              className="flex-1"
              field={fields.url}
              labelProps={{ children: "" }}
              inputProps={{
                ...getInputProps(fields.url, { type: "url" }),
                placeholder: "https://www.youtube.com/watch?v=xxxxxx",
              }}
            />

            <Button type="submit" disabled={navigation.state === "submitting"}>
              Convert
            </Button>
          </div>
        </Form>
      </div>
    </main>
  );
}
