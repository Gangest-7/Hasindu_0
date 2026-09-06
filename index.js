const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

const plugins = new Map();

let sock = null;
let starting = false;

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
    loadPlugins();

    const { state, saveCreds } =
      await useMultiFileAuthState("./session");

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];

      if (!msg?.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid;

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const args = body.trim().split(/ +/);
      const command = args.shift()?.toLowerCase();
      const query = args.join(" ");

      if (plugins.has(command)) {
        const plugin = plugins.get(command);

        try {
          await plugin.exec({
            sock,
            msg,
            from,
            args,
            query,
            body
          });
        } catch (err) {
          console.error(`❌ Error executing ${command}:`, err);

          try {
            await sock.sendMessage(
              from,
              {
                text: "❌ Command එක Process කිරීමේදී දෝෂයක් සිදු විය."
              },
              { quoted: msg }
            );
          } catch {}
        }

        return;
      }

      if (["1", "2", "3", "4", "5"].includes(command)) {
        const commandMap = {
          "1": ".song",
          "2": ".yt",
          "3": ".download",
          "4": ".ping",
          "5": ".alive"
        };

        const plugin = plugins.get(commandMap[command]);

        if (plugin) {
          try {
            await plugin.exec({
              sock,
              msg,
              from,
              args: [],
              query: "",
              body: ""
            });
          } catch (err) {
            console.error(
              `❌ Error executing ${commandMap[command]}:`,
              err
            );
          }
        }
      }
    });

    sock.ev.on(
      "connection.update",
      ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          console.log("================================");
          console.log("✅ HASINDU MD BOT CONNECTED!");
          console.log("================================");
        }

        if (connection === "close") {
          const statusCode =
            lastDisconnect?.error?.output?.statusCode;

          const shouldReconnect =
            statusCode !== DisconnectReason.loggedOut;

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
      }
    );

    starting = false;

    return sock;

  } catch (err) {
    starting = false;
    sock = null;

    console.error("❌ Bot start error:", err);

    throw err;
  }
}

function getSocket() {
  return sock;
}

module.exports = {
  startBot,
  getSocket
};
