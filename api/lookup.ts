import type { VercelRequest, VercelResponse } from "@vercel/node";
import dns from "dns/promises";
import https from "https";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const domain = req.query.domain as string;

    if (!domain) {
        return res.status(400).json({ error: "No domain provided" });
    }

    const result: any = {
        domain,
        ip: null,
        dns: {
            A: [],
            AAAA: [],
            NS: [],
            MX: [],
            TXT: [],
            CNAME: [],
            time: 0
        },
        geo: null,
        cdn: "unknown",
        http: null
    };

    try {
        // dns
        const startDns = Date.now();

        const [a, aaaa, ns, mx, txt, cname] = await Promise.allSettled([
            dns.resolve4(domain),
            dns.resolve6(domain),
            dns.resolveNs(domain),
            dns.resolveMx(domain),
            dns.resolveTxt(domain),
            dns.resolveCname(domain)
        ]);

        const getValue = (r: any) =>
            r.status === "fulfilled" ? r.value : [];

        const A = getValue(a);
        const AAAA = getValue(aaaa);
        const NS = getValue(ns);
        const MX = getValue(mx);
        const TXT = getValue(txt);
        const CNAME = getValue(cname);

        result.dns = {
            A,
            AAAA,
            NS,
            MX,
            TXT,
            CNAME,
            time: Date.now() - startDns
        };

        if (A.length > 0) {
            result.ip = A[0];
        }

        // geo
        if (result.ip) {
            try {
                const geoRes = await fetch(`https://ipapi.co/${result.ip}/json/`);
                const geo = await geoRes.json();

                result.geo = {
                    ip: result.ip,
                    city: geo.city || null,
                    country: geo.country_name || null,
                    org: geo.org || null,
                    asn: geo.asn || null
                };

                const org = (geo.org || "").toLowerCase();

                if (org.includes("cloudflare")) result.cdn = "cloudflare";
                else if (org.includes("amazon") || org.includes("aws")) result.cdn = "aws";
                else if (org.includes("google")) result.cdn = "google";
                else if (org.includes("fastly")) result.cdn = "fastly";
            } catch {
                result.geo = null;
            }
        }

        // http
        const startHttp = Date.now();

        await new Promise<void>((resolve, reject) => {
            const request = https.get(`https://${domain}`, (resp) => {
                let data = "";

                resp.on("data", (chunk) => (data += chunk));

                resp.on("end", () => {
                    const headers = resp.headers;

                    result.http = {
                        status: resp.statusCode || null,
                        time: Date.now() - startHttp,
                        server: headers["server"] || null,
                        location: headers["location"] || null,
                        cfRay: headers["cf-ray"] || null,
                        cache: headers["cf-cache-status"] || null
                    };

                    if (!result.cdn || result.cdn === "unknown") {
                        if (headers["cf-ray"]) result.cdn = "cloudflare";
                        else if (String(headers["server"]).toLowerCase().includes("nginx")) result.cdn = "nginx";
                        else if (String(headers["server"]).toLowerCase().includes("apache")) result.cdn = "apache";
                    }

                    resolve();
                });
            });

            request.on("error", reject);
        });

        return res.status(200).json(result);

    } catch (err: any) {
        return res.status(500).json({
            error: err.message
        });
    }
}