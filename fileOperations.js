import fs from "node:fs";
import net from "node:net";
import path from "node:path";

import { DOWNLOAD_DIR, envs, UPLOAD_DIR } from "./config.js";

export function registerFile(peerId, fileName) {
  if (!isValidName(fileName)) {
    console.log("\x1b[31m%s\x1b[0m", "Invalid file name.");
    return;
  }

  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.log("\x1b[31m%s\x1b[0m", "The file does not exist in the uploads directory.");
    return;
  }

  const client = net.createConnection({ port: envs.SERVER_PORT, host: envs.SERVER_HOST }, () => {
    const start = Date.now();
    client.write(JSON.stringify({ type: "ping" }));

    client.on("data", (data) => {
      if (data.toString() === "pong") {
        const latency = Date.now() - start;
        const data = JSON.stringify({ type: "register", peerId, fileName, latency });
        client.write(data);
      } else {
        console.log(data.toString());
      }
    })
  });

  client.on("error", (err) => {
    console.log("\x1b[31m%s\x1b[0m", `Error registering file: ${err}`);
    client.end();
  });
}


export function searchFile(fileName) {
  const client = net.createConnection({ port: envs.SERVER_PORT, host: envs.SERVER_HOST }, () => {
    const data = JSON.stringify({ type: "search", fileName });
    client.write(data);
  });

  client.on("data", (data) => {
    try {
      const files = JSON.parse(data.toString());

      console.log("\n\x1b[32m%s\x1b[0m", "fileName        | date                      | downloads");
      console.log("----------------------------------------------------------");

      files.forEach(({ fileName, date, downloads }) => {
        console.log(`${fileName.padEnd(15)} | ${date.padEnd(25)} | ${String(downloads).padEnd(10)}`);
      });

      client.end();
    } catch (error) {
      console.log("\x1b[31m%s\x1b[0m", `File not found`);
    }
  });
  client.on("error", (err) => {
    console.log("\x1b[31m%s\x1b[0m", `Error searching file: ${err}`);
    client.end();
  });
}


export function downloadFile(fileName) {
  if (!isValidName(fileName)) {
    console.log("\x1b[31m%s\x1b[0m", "Invalid file name.");
    return;
  }

  const client = net.createConnection({ port: envs.SERVER_PORT, host: envs.SERVER_HOST }, () => {
    const data = JSON.stringify({ type: "download", fileName });
    client.write(data);

    client.on("data", (data) => {
      const response = JSON.parse(data.toString());
      if (response.peerId) {
        const { host, port } = response.peerId;
        downloadFileFromPeer({ host, port }, fileName);
      } else {
        console.log("File not found.");
      }
      client.end();
    });
  });

  client.on("error", (err) => {
    console.log("\x1b[31m%s\x1b[0m", `Error downloading file: ${err}`);
    client.end();
  });
}

function downloadFileFromPeer(peerId, fileName) {
  const { host, port } = peerId;
  const client = net.createConnection({ port, host }, () => {
    const data = JSON.stringify({ type: "download", fileName });
    client.write(data);

    const filePath = path.join(DOWNLOAD_DIR, fileName);
    const writeStream = fs.createWriteStream(filePath);

    client.pipe(writeStream);
    client.on("end", () => {
      console.log("File downloaded successfully.");
      client.end();
    });
  });

  client.on("error", (err) => {
    console.log(`Error downloading file from peer: ${err}`);
    client.end();
  });
}

export async function listAllFiles() {
  const client = net.createConnection({ port: envs.SERVER_PORT, host: envs.SERVER_HOST }, () => {
    client.write(JSON.stringify({ type: "list" }));

    client.on("data", (data) => {
      const files = JSON.parse(data.toString());

      console.log("\n\x1b[32m%s\x1b[0m", "fileName        | date                      | downloads");
      console.log("----------------------------------------------------------");

      files.forEach(({ fileName, date, downloads }) => {
        console.log(`${fileName.padEnd(15)} | ${date.padEnd(25)} | ${String(downloads).padEnd(10)}`);
      });

      client.end();
    });
  });
}

function isValidName(fileName) {
  return !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\") && !path.isAbsolute(fileName);
}