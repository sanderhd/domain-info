import express, { Request, Response } from "express";
import cors from "cors"
import dns from "dns/promises";
import https from "https";

const app = express();
app.use(cors());

app.get("/lookup", async (req: Request, res: Response) => {
    const domain = req.query.domain as string;

    if (!domain) {
        return res.status(400).json({ error: "No domain provided" });
    }

    const result: any = {
        domain,
        dns: null,
        http: null
    }

    try {
        const startDns = Date.now();
        const addresses = await dns.resolve4(domain);
        
        result.dns = {
            addresses,
            time: Date.now() - startDns
        };

        const startHttp = Date.now();

        await new Promise((resolve, reject) => {
            const req = https.get(`https://${domain}`, (resp) => {
                let data = "";

                resp.on("data", (chunk) => (data += chunk));
                resp.on("end", () => {
                    result.http = {
                        status: resp.statusCode,
                        time: Date.now() - startHttp,
                        server: resp.headers["server"] || null
                    };
                    resolve(null);
                })
            });

            req.on("error", reject)
        });

        res.json(result);
    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    } 
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});