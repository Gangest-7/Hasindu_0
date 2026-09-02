const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  // Pairing Code
  if (!state.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER;

    if (!phoneNumber) {
      console.log("❌ PHONE_NUMBER variable එක add කරන්න.");
      return;
    }

    setTimeout(async () => {
      try {
        const code =
          await sock.requestPairingCode(phoneNumber);

        console.log("================================");
        console.log("📱 PAIRING CODE:", code);
        console.log("================================");
      } catch (err) {
        console.log("❌ Pairing error:", err);
      }
    }, 3000);
  }

  // Messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    // MAIN MENU
    if (command === "menu" || command === ".menu") {
      await sock.sendMessage(from, {
        text:
`╭━━━〔 🤖 HASINDU MD BOT 〕━━━╮

      👋 WELCOME!

╭──────────────╮
│ 📥 DOWNLOAD  │
│ 🎵 SONG      │
│ ℹ️ HELP       │
│ 👤 ABOUT      │
╰──────────────╯

Type one of these:

📥 download
🎵 song
ℹ️ help
👤 about

╰━━━━━━━━━━━━━━━━━━╯`
      });
      return;
    }

    // DOWNLOAD MENU
    if (command === "download" || command === ".download") {
      await sock.sendMessage(from, {
        text:
`📥 *DOWNLOAD MENU*

Send a link that you are authorized to download.

Supported categories:

▶️ YouTube
📘 Facebook

Example:
download <link>

⚠️ Only download content you have permission to use.`
      });
      return;
    }

    // SONG MENU
    if (command === "song" || command === ".song") {
      await sock.sendMessage(from, {
        text:
`🎵 *SONG MENU*

Send the song/audio link.

Example:
song <link>

⚠️ Please use music you have permission to download/use.`
      });
      return;
    }

    // HELP
    if (command === "help" || command === ".help") {
      await sock.sendMessage(from, {
        text:
`ℹ️ *HASINDU MD BOT - HELP*

/menu
Main menu

/download
Video download menu

/song
Audio menu

/help
Help information

/about
Bot information`
      });
      return;
    }

    // ABOUT
    if (command === "about" || command === ".about") {
      await sock.sendMessage(from, {
        text:
`🤖 *HASINDU MD BOT*

WhatsApp automation bot
Powered by Baileys.

⚡ Fast
🔄 Auto reconnect
📱 Pairing Code
🎵 Audio menu
📥 Download menu`
      });
      return;
    }

    // Unknown command
    if (command.startsWith(".")) {
      await sock.sendMessage(from, {
        text: "❓ Unknown command.\n\nType *.menu* to see the menu."
      });
    }
  });

  // Connection
  sock.ev.on(
    "connection.update",
    ({ connection, lastDisconnect }) => {

      if (connection === "open") {
        console.log("================================");
        console.log("✅ HASINDU MD BOT CONNECTED!");
        console.log("================================");
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log("❌ Connection closed.");

        if (shouldReconnect) {
          startBot();
        }
      }
    }
  );
}

startBot();
