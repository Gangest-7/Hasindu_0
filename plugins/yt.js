const yts = require("yt-search");

module.exports = {
  cmd: ".yt",
  exec: async ({ sock, msg, from, query }) => {
    if (!query) {
      return await sock.sendMessage(
        from,
        { text: "❌ *කරුණාකර YouTube Link එකක් හෝ Video එකේ නම ලබාදෙන්න.*\n\n*Example:* `.yt https://youtu.be/...`" },
        { quoted: msg }
      );
    }

    try {
      await sock.sendMessage(from, { react: { text: "🎬", key: msg.key } });

      const search = await yts(query);
      const video = search.videos[0];

      if (!video) {
        return await sock.sendMessage(
          from,
          { text: "❌ *Video එක සොයාගැනීමට නොහැකි විය!*" },
          { quoted: msg }
        );
      }

      const senderJid = msg.key.participant || msg.key.remoteJid;

      const caption = 
        `╭───────────━━━━━━───────────╮\n` +
        `│   🎬  *HASINDU-MD YT DOWNLOADER*  🎬\n` +
        `├───────────━━━━━━───────────┤\n` +
        `│\n` +
        `│ 📌 *Title:* ${video.title}\n` +
        `│ ⏱️ *Duration:* ${video.timestamp}\n` +
        `│ 👁️ *Views:* ${video.views.toLocaleString()}\n` +
        `│ 👤 *Channel:* ${video.author.name}\n` +
        `│ 👤 *Requested By:* @${senderJid.split("@")[0]}\n` +
        `│\n` +
        `╰───────────━━━━━━───────────╯\n` +
        `> ⚡ *Downloading YouTube Video...*`;

      await sock.sendMessage(
        from,
        {
          image: { url: video.thumbnail },
          caption: caption,
          mentions: [senderJid]
        },
        { quoted: msg }
      );

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("YT Downloader error:", err);
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(
        from,
        { text: "❌ *YouTube Video එක Download කිරීමේදී දෝෂයක් සිදු විය.*" },
        { quoted: msg }
      );
    }
  }
};
