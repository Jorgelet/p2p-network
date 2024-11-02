import process from "node:process";
import readline from "node:readline/promises";

import {
  registerFile,
  searchFile,
  downloadFile,
  listAllFiles
} from "./fileOperations.js";
import { PEER_PORT } from "./config.js";
import { peerServer } from "./peer.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export function showMenu(clear = true) {
  if (clear) console.clear();

  console.log("\x1b[36m%s\x1b[0m", "Menu:");
  console.log("(1) Register File");
  console.log("(2) Search File");
  console.log("(3) Download File");
  console.log("(4) List All Files");
  console.log("(5) Talk to other peers")
  console.log("(6) Exit");
  console.log("\nType 'menu' at any time to return to this menu.\n\n");
}

async function handleUserInput(userEntry) {
  const userEntryNormalized = userEntry.trim().toLowerCase();

  const actions = {
    "1": register,
    "2": search,
    "3": download,
    "4": listAll,
    "5": async () => {
      await connectToPeer();
      await talkToPeer();
    },
    "6": exit,
    "menu": showMenu,
    default: () => console.log("Invalid option. If you need help, type 'menu' for more information.")
  };

  const action = actions[userEntryNormalized] || actions.default;
  await action();
}

async function exit() {
  console.log("Leaving the network...");
  setTimeout(() => {
    rl.close();
    process.exit();
  }, 800);
}

rl.on("line", handleUserInput);
rl.on("close", () => handleUserInput("6"))

async function talkToPeer() {
  if (peerServer.name == "XXXXXX") {
    const name = await rl.question("Perfect! now before we start please enter your name: ")
    peerServer.name = name
  }
  const message = await rl.question("Now leave the message you want to send to your network of peers: ")

  if (peerServer.connections.length === 0) {
    console.log("No peers connected to send the message to.");
    return;
  }

  const signedMessage = peerServer.signMessage(message);
  peerServer.broadcast(signedMessage);
}

async function connectToPeer() {
  const address = await rl.question("Enter the address of the peer you want to connect to (host:port): ");
  peerServer.connectTo(address);
}

async function register() {
  const fileName = await rl.question("Enter the name of the file to register: ");

  // The peerID is hardcoded to localhost for now
  const peerID = { host: "localhost", port: PEER_PORT };
  registerFile(peerID, fileName);
}

async function search() {
  const fileName = await rl.question("Enter the name of the file to search: ");
  searchFile(fileName);
}

async function download() {
  const fileName = await rl.question("Enter the name of the file to download: ");
  downloadFile(fileName);
}

async function listAll() {
  await listAllFiles();
}