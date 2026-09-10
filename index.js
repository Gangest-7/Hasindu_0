const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");
const express = require("express");
const config = require("./config");

// Express Keep-Alive Web Server
const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => res.send(" Hasindu MD Active & Running!"));
app.listen(port, () => console.log(`🌐 Web Server running on port ${port}`));

const plugins = new Map();
let sock = null;
let starting = false;

// Global Crash Handlers (Prevents Server Sudden Shutdowns)
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// Clean Base64 Session Restoration Logic
function restoreSession() {
  const sessionDir = path.join(__dirname, "session");

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  let sessId = config.SESSION_ID || process.env.SESSION_ID || "";
  sessId = sessId.trim();

  if (sessId && !fs.existsSync(path.join(sessionDir, "creds.json"))) {
    try {
      if (sessId.includes("PRABATH-MD~")) {
        sessId = sessId.replace("PRABATH-MD~", "");
      }
      if (sessId.includes(";")) {
        sessId = sessId.split(";")[1];
      }

      const decoded = Buffer.from(sessId, "base64").toString("utf-8");
      JSON.parse(decoded); // Validate JSON Format

      fs.writeFileSync(path.join(sessionDir, "creds.json"), decoded);
      console.log("✅ SESSION ID inject විය!");
    } catch (e) {
      console.error("❌ Session ID restoration error:", e.message);
    }
  }
}

// Plugin Loader (Dynamically loads commands from /plugins)
function loadPlugins() {
  const pluginsDir = path.join(__dirname, "plugins");

  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  plugins.clear();
  const files = fs.readdirSync(pluginsDir);

  for (const file of files) {
    if (!file.endsWith(".js")) continue;

    try {
      const plugin = require(path.join(pluginsDir, file));
      if (plugin.cmd) {
        plugins.set(plugin.cmd, plugin);
        console.log(`🔌 Loaded Plugin: ${plugin.cmd}`);
      }
    } catch (err) {
      console.error(`❌ Error loading ${file}:`, err);
    }
  }
}

async function startBot() {
  if (starting) return sock;
  starting = true;

  try {
    restoreSession();
    loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    // Socket Configuration with Updated User-Agent to Avoid Connection Reset
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome")
    });

    sock.ev.on("creds.update", saveCreds);

    // Message Upsert Handler
    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg?.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid;

      // Safe Plain Text Extraction
      const body = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      ).trim();

      if (!body) return;

      const args = body.split(/ +/);
      const command = args.shift()?.toLowerCase();
      const query = args.join(" ");

      // Built-in .alive Command Handling
      if (command === ".alive" || command === "alive") {
        const senderName = msg.pushName || "WhatsApp User";
        const senderJid = msg.key.participant || msg.key.remoteJid;

        const aliveMsg = 
          `╭───────────━━━━━━───────────╮\n` +
          `│   🤖  *HASINDU-MD IS ALIVE*  🤖\n` +
          `├───────────━━━━━━───────────┤\n` +
          `│\n` +
          `│ 👤 *User:* @${senderJid.split("@")[0]}\n` +
          `│ ⚡ *Status:* Active & Online\n` +
          `│ ⚙️ *Platform:* Katabump Hosting\n` +
          `│ 📌 *Version:* 1.0.0 Stable Engine\n` +
          `│\n` +
          `│ 🛠️ *Supported Downloaders:*\n` +
          `│  ├ YouTube Audio/Video (.song / .yt)\n` +
          `│  ├ Facebook Video (.fb)\n` +
          `│  └ Pinterest Media (.pinterest)\n` +
          `│\n` +
          `╰───────────━━━━━━───────────╯\n` +
          `> _Type .menu or .help for all commands._`;

        const aliveImg = config.ALIVE_IMG || "https://i.ibb.co/6R2M3s8/image.jpg";

        try {
          await sock.sendMessage(
            from,
            { image: { url: aliveImg }, caption: aliveMsg, mentions: [senderJid] },
            { quoted: msg }
          );
        } catch {
          await sock.sendMessage(
            from,
            { text: aliveMsg, mentions: [senderJid] },
            { quoted: msg }
          );
        }
        return;
      }

      // Execute External Plugins (.song, .fb, .pinterest, .menu, etc.)
      if (plugins.has(command)) {
        const plugin = plugins.get(command);
        try {
          await plugin.exec({ sock, msg, from, args, query, body });
        } catch (err) {
          console.error(`❌ Error executing ${command}:`, err);
          await sock.sendMessage(
            from,
            { text: "❌ *Command එක Process කිරීමේදී දෝෂයක් සිදු විය.*" },
            { quoted: msg }
          );
        }
        return;
      }

      // Universal Number Reply Shortcut Logic (Replies with 1, 2, 3...)
      if (["1", "2", "3", "4", "5"].includes(command)) {
        const commandMap = {
          "1": ".song",
          "2": ".yt",
          "3": ".fb",
          "4": ".pinterest",
          "5": ".alive"
        };

        const plugin = plugins.get(commandMap[command]);
        if (plugin) {
          try {
            await plugin.exec({ sock, msg, from, args: [], query: "", body: "" });
          } catch (err) {
            console.error(`❌ Error executing shortcut ${command}:`, err);
          }
        }
      }
    });

    // Connection Updates & Auto-Reconnect Engine
    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
      if (connection === "open") {
        console.log("================================");
        console.log("✅ HASINDU MD BOT CONNECTED!");
        console.log("================================");
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log("❌ WhatsApp connection closed.");
        sock = null;

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");
          starting = false;
          setTimeout(() => {
            startBot().catch(console.error);
          }, 3000);
        } else {
          console.log("🚪 WhatsApp session logged out.");
          starting = false;
        }
      }
    });

    starting = false;
    return sock;

  } catch (err) {
    starting = false;
    sock = null;
    console.error("❌ Bot start error:", err);
  }
}

// Start Bot Engine
startBot();

module.exports = { startBot, getSocket: () => sock };
      
