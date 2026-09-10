module.exports = {
  cmd: ".fb",
  exec: async ({ sock, msg, from, query }) => {
    if (!query) {
      return await sock.sendMessage(
        from,
        { text: "❌ *කරුණාකර Facebook Video Link එකක් ලබාදෙන්න.*\n\n*Example:* `.fb https://fb.watch/...`" },
        { quoted: msg }
      );
    }

    try {
      await sock.sendMessage(from, { react: { text: "📥", key: msg.key } });
      const senderJid = msg.key.participant || msg.key.remoteJid;

      const caption = 
        `╭───────────━━━━━━───────────╮\n` +
        `│   📘  *HASINDU-MD FB DOWNLOADER*  📘\n` +
        `├───────────━━━━━━───────────┤\n` +
        `│\n` +
        `│ 👤 *Requested By:* @${senderJid.split("@")[0]}\n` +
        `│ 🔗 *Link:* Facebook Media\n` +
        `│\n` +
        `╰───────────━━━━━━───────────╯\n` +
        `> ⚡ *Downloading Facebook Video...*`;

      await sock.sendMessage(
        from,
        { text: caption, mentions: [senderJid] },
        { quoted: msg }
      );

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("FB Downloader error:", err);
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(from, { text: "❌ *Facebook Video එක Download කිරීමට නොහැකි විය.*" }, { quoted: msg });
    }
  }
};
