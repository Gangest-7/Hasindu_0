module.exports = {
  cmd: ".alive",
  exec: async ({ sock, from, msg }) => {
    
    const aliveMsg = 
`╭━━━〔 🤖 HASINDU MD BOT 〕━━━╮

       👋 *HELLOOOO USER!*

🤖 *Status:* Online & Active 24/7
⚡ *Speed:* Fast & Response
📱 *Platform:* Node.js (Baileys)
👨‍💻 *Developer:* Hasindu

──────────────────
💡 Type *.menu* to get all bot features and functions!
╰━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(from, { 
      text: aliveMsg 
    }, { quoted: msg });

  }
};
