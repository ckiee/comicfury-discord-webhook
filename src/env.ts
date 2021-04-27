import { config } from "dotenv-safe";
import { URL } from "url";

config();

export const comicURL = new URL(process.env.COMICFURY_URL!);
export const pollingInterval = parseInt(process.env.POLLING_INTERVAL!);
export const extraContent = process.env.EXTRA_CONTENT!;
export const webhookID = process.env.WEBHOOK_ID!;
export const webhookToken = process.env.WEBHOOK_TOKEN!;
