import { load } from "cheerio";
import { MessageEmbed, WebhookClient } from "discord.js";
import Enmap from "enmap";
import fetch from "node-fetch";
import { URL } from "url";
import { extraContent } from "./env";

const INITALIZED = "initalized";
const STARTING_AT = "starting-at";
const LAST_SENT = "last-sent";

interface ArchivePage { // the html from the /archive URL
    title: string;
    bannerURL: string;
    pages: ArchivePagePage[];
}
interface ArchivePagePage { // one of the items in the ArchivePage
    title: string;
    id: number;
}

export class ComicWebhook extends WebhookClient {
    data: Enmap;

    constructor(webhookID: string, webhookToken: string, private comicURL: URL, pollingInterval: number) {
        super(webhookID, webhookToken);
        if (pollingInterval < 1000 * 30) throw new Error("Polling interval is not sane");

        // Enmap will die if the name starts with a number.
        this.data = new Enmap(`-${this.id}-${this.comicURL.host}`);
        this.initEnmap();

        this.poll().catch(e => { throw e });
        setInterval(() => this.poll().catch(e => {
            // Let's not abort even if we fail once.
            console.error(`Error while polling from ${comicURL.host}:`, e);
        }), pollingInterval);
    }

    private initEnmap() {
        if (!this.data.get(INITALIZED)) {
            this.data.set(INITALIZED, true);
            this.data.set(STARTING_AT, 1);
            this.data.set(LAST_SENT, 0);
        }
    }

    async fetchArchive(): Promise<ArchivePage> {
        const url = new URL(this.comicURL.toString());
        url.pathname = "archive";
        const res = await fetch(url);
        const html = await res.text();
        const $ = load(html);
        const pages: ArchivePagePage[] = [];
        $(".archivecomic > a").each((_, e) => {
            const href = $(e).attr("href");
            if (!href || href.trim() == "") return;
            const id = parseInt(href.replace(/[^\d]/g, ""), 10);
            if (isNaN(id)) return;
            const title = $(e).text();
            pages.push({ id, title });
        });

        const bannerURL = $("div#banner img").attr("src");
        const title = $("h1#sitetitle").text().trim();

        if (!bannerURL || !title) throw new Error("Failed to parse archive page meta");

        return { pages: pages.sort((a, b) => a.id - b.id), bannerURL, title };
    }

    async poll() {
        const archive = await this.fetchArchive();
        const latestPage = archive.pages[archive.pages.length - 1];
        if (latestPage.id !== this.data.get(LAST_SENT)) {
            const embed = new MessageEmbed();
            const latestURL = new URL(this.comicURL.toString());
            latestURL.pathname = `comics/${latestPage.id}`;

            embed.setAuthor(`New ${archive.title} Page!`, undefined, latestURL.toString());
            embed.setImage(archive.bannerURL);
            embed.setURL(latestURL.toString());
            embed.setTitle(`#${latestPage.id}: ${latestPage.title}`);

            await this.send(extraContent, embed);

            this.data.set(LAST_SENT, latestPage.id);
        }
    }
}
