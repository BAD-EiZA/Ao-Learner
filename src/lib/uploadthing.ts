import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const f = createUploadthing();

async function auth() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  if (!(await isAuthenticated())) throw new UploadThingError("Unauthorized");
  const user = await getUser();
  if (!user?.id) throw new UploadThingError("Unauthorized");
  return { userId: user.id };
}

export const ourFileRouter = {
  audioUploader: f({
    audio: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => auth())
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  modelUploader: f({
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async () => auth())
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
