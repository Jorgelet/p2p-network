# Centralized P2P Network

## Overview

This project is a centralized peer-to-peer (P2P) network like Napster that allows nodes to share resources and data with each other.

## Components

1. **Centralized Server**: Acts as a coordinator for the network, managing peer connections and data exchange efficiently.
2. **Peers**: Individual nodes that participate in the network, sharing resources and data with other peers.
3. **TCP Protocol**: Used for communication between the server and peers, enabling data exchange and resource sharing.

## Installation

To set up the centralized P2P network, follow these steps:

1. Clone the repository:
  ```sh
  git clone https://github.com/Jorgelet/p2p-network.git
  cd p2p-network
  ```

2. Start the centralized server:
  ```sh
  node server.js 
  ```

3. Start a peer node:
  ```sh
  node peer.js [port]
  ```

![Centralized P2P Network Example](./img/example.png)