const config = require("../config");

module.exports = {
  cmd: ".mode",
  exec: async ({ sock, msg, from, args }) => {
    // Command එක යැවූ කෙනා Owner ද යන්න පරික්ෂා කිරීම
    const sender = msg.key.participant || msg.key.remoteJid;
    const isOwner = msg.key.fromMe || sender.includes(config.OWNER_NUMBER);

    if (!isOwner) {
      return await sock.sendMessage(
        from,
        { text: "❌ මෙම Command එක භාවිතා කළ හැක්කේ Bot Owner ට පමණි." },
        { quoted: msg }
      );
    }

    const modeChoice = args[0]?.toLowerCase();

    if (modeChoice === "public") {
      config.WORK_MODE = "public";
      return await sock.sendMessage(
        from,
        { text: "🔓 *Bot Mode එක PUBLIC ලෙස වෙනස් විය!* දැන් ඕනෑම කෙනෙකුට Commands භාවිත කළ හැක." },
        { quoted: msg }
      );
    } 
    
    if (modeChoice === "private" || modeChoice === "self") {
      config.WORK_MODE = "private";
      return await sock.sendMessage(
        from,
        { text: "🔒 *Bot Mode එක PRIVATE ලෙස වෙනස් විය!* දැන් ඔබට (Owner) පමණක් Commands භාවිත කළ හැක." },
        { quoted: msg }
      );
    }

    // Command එක වැරදියට ගැහුවොත් එන Message එක
    const currentMode = (config.WORK_MODE || "public").toUpperCase();
    await sock.sendMessage(
      from,
      { 
        text: `📌 *වත්මන් Mode එක:* \`${currentMode}\`\n\n` +
              `*Mode වෙනස් කිරීමට පහත සේ Type කරන්න:*\n` +
              `▪️ \`.mode public\` (හැමෝටම පාවිච්චි කිරීමට)\n` +
              `▪️ \`.mode private\` (ඔබට විතරක් පාවිච්චි කිරීමට)` 
      },
      { quoted: msg }
    );
  }
};
