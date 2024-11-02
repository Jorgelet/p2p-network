import net from "node:net";

import { envs } from "./config.js";

let fileRegistry = [];

const requestHandlers = {
  ping: (_, client) => {
    client.write("pong");
  },

  register: (request, client) => {
    const fileExists = fileRegistry.some(file =>
      file.peerId.host === request.peerId.host &&
      file.peerId.port === request.peerId.port &&
      file.fileName === request.fileName);

    if (fileExists) {
      client.write("File Already Registered.");
      return;
    }

    fileRegistry.push({
      peerId: request.peerId,
      fileName: request.fileName,
      date: new Date().toISOString(),
      downloads: 0,
      latency: request.latency,
    });

    client.write("File Registered Successfully.");
  },

  search: (request, client) => {
    const results = fileRegistry
      .filter((item) => item.fileName === request.fileName)
      .map((item) => {
        return {
          fileName: item.fileName,
          date: item.date,
          downloads: item.downloads,
        };
      });

    if (results.length === 0) {
      client.write("File Not Found.");
      return;
    }
    client.write(JSON.stringify(results, null, 2));
  },

  list: (_, client) => {
    const files = fileRegistry.map((item) => {
      return {
        fileName: item.fileName,
        date: item.date,
        downloads: item.downloads,
      };
    });

    client.write(JSON.stringify(files, null, 2));
  },

  incrementDownloadCount: (request, _) => {
    const file = fileRegistry.find((item) => item.fileName === request.fileName);
    if (file) file.downloads++;
  },

  download: (request, client) => {
    const results = fileRegistry.filter(item => item.fileName === request.fileName);

    if (results.length === 0) {
      client.write(JSON.stringify({ error: "File Not Found." }));
      return;
    }

    const bestLatency = Math.min(...results.map((item) => item.latency));
    const fileOwner = results.find((item) => item.latency === bestLatency).peerId;
    client.write(JSON.stringify({ peerId: fileOwner }));
  },
};

const server = net.createServer((client) => {
  client.on("data", (data) => {
    let request;

    try {
      request = JSON.parse(data.toString());
    } catch (error) {
      client.write("Invalid JSON format.");
      return;
    }

    const handler = requestHandlers[request.type];
    if (handler) {
      handler(request, client);
    } else {
      client.write("Invalid Request");
    }
  });

  client.on("error", () => {
    // This error is usually triggered when a client disconnect with CTRL+C or similar
    // and this is only to prevent the server from crashing
  });
});

server.listen(envs.SERVER_PORT, () => {
  console.log("\x1b[32m%s\x1b[0m", "🟢 Peer Server is now running!");
});