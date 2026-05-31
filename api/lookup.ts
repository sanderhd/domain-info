import type { VercelRequest, VercelResponse } from "@vercel/node"
import dns from "dns/promises";
import https from "https";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const domain = req.query.domain as string;

    if (!domain) {
        return res.status(400).json({ error: "No domain provided" });
    }

    const result: any = {
        domain,
        dns: null,
        http: null
    };

    try {
        const startDns = Date.now();
        const addresses = await dns.resolve4(domain);

        result.dns = {
            addresses,
            time: Date.now() - startDns
        };

        const startHttp = Date.now();

        await new Promise<void>((resolve, reject) => {
            const request = https.get(`https://${domain}`, (resp) => {
                let data = "";

                resp.on("data", (chunk) => (data += chunk));
                resp.on("end", () => {
                    result.http = {
                        status: resp.statusCode,
                        time: Date.now() - startHttp,
                        server: resp.headers["server"] || null
                    };
                    resolve();
                });
            });

            request.on("error", reject);
        });

        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}