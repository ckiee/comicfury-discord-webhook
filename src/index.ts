import { comicURL, pollingInterval, webhookID, webhookToken } from "./env";
import { ComicWebhook } from "./fetcher";

new ComicWebhook(webhookID, webhookToken, comicURL, pollingInterval);
