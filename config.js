import path from "node:path";
import process from "node:process";

//* By default, the server host is localhost if you want to change it, you can do it here
//* Likewise, you can change the server port here
export const envs = {
  SERVER_PORT: 8080,
  SERVER_HOST: 'localhost', 
}

export const PEER_PORT = process.argv[2];
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");