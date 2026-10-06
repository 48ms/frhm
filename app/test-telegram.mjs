import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const token = process.env.TELEGRAM_BOT_TOKEN?.replace(/"/g, '')
const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.replace(/"/g, '')

async function testTelegram() {
  if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID in .env.local")
    return
  }

  const message = `🚀 <b>Testing Bot Frahma!</b>
Halo Admin! Jika Anda membaca pesan ini, maka Bot Telegram Frahma sudah berhasil dikonfigurasi dan hidup! 

Pesan ini mensimulasikan sistem peringatan (Fail-Safe) dari Backend Frahma.`

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  
  try {
    console.log(`Sending test message to Chat ID: ${chatId}...`)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })

    const data = await res.json()
    if (data.ok) {
      console.log("✅ Pesan berhasil dikirim! Silakan periksa Telegram Anda.")
    } else {
      console.error("❌ Gagal mengirim pesan:", data)
    }
  } catch (error) {
    console.error("❌ Terjadi error:", error)
  }
}

testTelegram()
