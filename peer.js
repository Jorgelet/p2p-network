import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import crypto from "node:crypto";

import { showMenu } from "./menu.js";
import { DOWNLOAD_DIR, envs, PEER_PORT, UPLOAD_DIR } from "./config.js";

class PeerServer {

  constructor(port, uploadDir, downloadDir) {
    this.port = port;
    this.name = "XXXXXX";
    this.connections = [];
    this.uploadDir = uploadDir;
    this.downloadDir = downloadDir;
    this.recievedMessagesSignatures = new Set();

    this.myKey = crypto
      .createHash("sha256")
      .update(this.port + "" + Date.now() + "" + Math.floor((Math.random() * 10000) + 1000))
      .digest("hex");
  }

  start() {
    this.server = net.createServer((socket) => this.onSocketConnected(socket));
    this.server.listen(this.port, () => {
      console.clear();
      console.log(`\nHi there! Welcome to this Peer Server\n`);
      showMenu(false);
    });
  }

  onSocketConnected(socket) {
    this.connections.push(socket);
    socket.on("data", (data) => this.handleData(socket, data));
    socket.on("error", () => this.removeConnection(socket));
  }

  handleData(socket, data) {
    const request = JSON.parse(data.toString());
    if (request.type === "download") {
      this.sendFileToClient(socket, request.fileName);
    }

    if (request.type === "message") {
      if (this.recievedMessagesSignatures.has(request.signature)) return;

      console.log(request.message);
      this.recievedMessagesSignatures.add(request.signature);
      this.broadcast(JSON.stringify(request));
      socket.end();
    }
  }

  broadcast(data) {
    this.connections.forEach((connection) => connection.write(data));
  }

  connectTo(address) {
    if (address.split(":").length !== 2) {
      console.log("\x1b[31m%s\x1b[0m", "Invalid address format. Should be host:port");
      return;
    }

    const [host, port] = address.split(":");
    try {
      const socket = net.createConnection({ host, port }, () => this.onSocketConnected(socket));
      socket.on("error", () => console.log("\n\x1b[31m%s\x1b[0m\n", "couldn't connect to peer"));
    } catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "Invalid port or host please check the address and try again.");      
    }
  }

  sendFileToClient(client, fileName) {
    const filePath = path.join(this.uploadDir, fileName);
    const server = net.createConnection({ port: envs.SERVER_PORT, host: envs.SERVER_HOST }, () => {
      const data = JSON.stringify({ type: "incrementDownloadCount", fileName });
      server.write(data);
      server.end();
    });

    if (fs.existsSync(filePath)) {
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(client);
      readStream.on("end", () => client.end());
    } else {
      client.write("File not found");
      client.end();
    }
  }

  signMessage(message) {
    const signature = crypto.createHash("sha256").update(message + this.myKey + Date.now()).digest("hex");
    this.recievedMessagesSignatures.add(signature);

    const messageWithName = `> ${this.name}: ${message}`;
    return JSON.stringify({ signature, message: messageWithName, type: "message" });
  }

  removeConnection(socket) {
    if (!socket.destroyed) {
      socket.end();
      socket.destroy();
    }
    console.log("\x1b[31m%s\x1b[0m", "Client disconnected");
    this.connections = this.connections.filter((connection) => connection !== socket);
  }
}

export const peerServer = new PeerServer(PEER_PORT, UPLOAD_DIR, DOWNLOAD_DIR);
peerServer.start();
