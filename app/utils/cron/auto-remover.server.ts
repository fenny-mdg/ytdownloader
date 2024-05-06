import fs from "node:fs/promises";

const { APP_DOWNLOAD_FOLDER, APP_DOWNLOAD_LEASE_TIME = "0" } = process.env;

export const autoRemoveDownloadedFiles = async () => {
  try {
    const downloadLeaseTime = Number(APP_DOWNLOAD_LEASE_TIME) || 1000 * 60 * 5;
    const files = await fs.readdir(APP_DOWNLOAD_FOLDER || "");
    const now = Date.now();
    for (const file of files) {
      const filePath = `${APP_DOWNLOAD_FOLDER}/${file}`;
      const { birthtime } = await fs.stat(filePath);
      const fileHasExtension = file.includes(".");

      if (now - birthtime.getTime() > downloadLeaseTime && fileHasExtension) {
        console.log(`removing ${filePath}`);
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error("error in autoRemoveDownloadedFiles");
    console.error(error);
  }
};
