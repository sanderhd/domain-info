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
    let old = document.querySelector("#result");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "result";

    div.innerHTML = `
        <h2>${data.domain}</h2>

        <p><b>DNS:</b> ${data.dns.addresses.join(", ")} (${data.dns.time}ms)</p>

        <p><b>HTTP:</b> ${data.http.status} (${data.http.time}ms)</p>
    `;

    document.body.appendChild(div);
}