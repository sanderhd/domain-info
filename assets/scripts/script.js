const form = document.querySelector("form");
const input = document.getElementById("domain-input");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const domain = input.value;

    const res = await fetch(`/api/lookup?domain=${domain}`);
    const data = await res.json();

    console.log(data);

    render(data);
});

function render(data) {
    console.log(data);

    const div = document.createElement("div");
    div.id = "result";

    div.innerHTML = `
        <h2>${data.domain}</h2>

        <p><b>IP:</b> ${data.ip || "unknown"}</p>

        <p><b>DNS A:</b> ${(data.dns.A || []).join(", ")}</p>
        <p><b>NS:</b> ${(data.dns.NS || []).join(", ")}</p>

        <p><b>CDN:</b> ${data.cdn}</p>

        <p><b>Country:</b> ${data.geo?.country || "unknown"}</p>

        <p><b>HTTP:</b> ${data.http?.status || "?"} (${data.http?.time || 0}ms)</p>
    `;

    document.body.appendChild(div);
}