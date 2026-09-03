const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

// Plugins Store
const plugins = new Map();

// Load Plugins dynamically
function loadPlugins() {
  const pluginsDir = path.join(__dirname, "plugins");
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

  const files = fs.readdirSync(pluginsDir);
  for (const file of files) {
    if (file.endsWith(".js")) {
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
}

async function startBot() {
  loadPlugins();

  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  // Pairing Code System
  if (!state.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER || "947XXXXXXXX";

    if (!phoneNumber || phoneNumber === "947XXXXXXXX") {
      console.log("❌ PHONE_NUMBER variable එක ලබා දෙන්න.");
      return;
    }

    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
        console.log("================================");
        console.log("📱 PAIRING CODE:", code);
        console.log("================================");
      } catch (err) {
        console.log("❌ Pairing error:", err);
      }
    }, 3000);
  }

  // Handle Messages via Plugins
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const args = body.trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const query = args.join(" ");

    // Check if command matches any Plugin
    if (plugins.has(command)) {
      const plugin = plugins.get(command);
      try {
        await plugin.exec({ sock, msg, from, args, query, body });
      } catch (err) {
        console.error(`Error executing ${command}:`, err);
        await sock.sendMessage(from, { text: "❌ Command එක Process කිරීමේදී දෝෂයක් සිදු විය." }, { quoted: msg });
      }
      return;
    }

    // Interactive Number Menu Input (1, 2, 3, 4, 5)
    if (["1", "2", "3", "4", "5"].includes(command)) {
      if (command === "1") plugins.get(".song")?.exec({ sock, msg, from, args: [], query: "", body: "" });
      if (command === "2") plugins.get(".yt")?.exec({ sock, msg, from, args: [], query: "", body: "" });
      if (command === "3") plugins.get(".download")?.exec({ sock, msg, from, args: [], query: "", body: "" });
      if (command === "4") plugins.get(".ping")?.exec({ sock, msg, from, args: [], query: "", body: "" });
      if (command === "5") plugins.get(".alive")?.exec({ sock, msg, from, args: [], query: "", body: "" });
      return;
    }
  });

  // Connection Updates
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("================================");
      console.log("✅ HASINDU MD BOT CONNECTED!");
      console.log("================================");
    }
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
  });
}

startBot();
