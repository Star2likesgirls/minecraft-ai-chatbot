## currently broken! only logs usernames :(

# Minecraft AI Auto-Response Bot

A Mineflayer bot that automatically responds to chat messages using AI (OpenAI or DeepSeek), with anti-AFK features and Discord webhook logging.

## Prerequisites

- Node.js (v16 or higher)
- A Minecraft account (Premium/Microsoft)
- API key from [OpenAI](https://platform.openai.com/api-keys) or [DeepSeek](https://platform.deepseek.com/)
- Discord webhook URL (optional, for logging)

## Installation

1. Download bot.js

2. Install dependencies:
```bash
npm install mineflayer mineflayer-pathfinder
```

3. Configure the bot by editing the `CONFIG` object in `bot.js`:

```javascript
const CONFIG = {
  host: 'your-server.com',           // Your Minecraft server
  port: 25565,
  username: 'your_email@example.com', // Your Microsoft account
  auth: 'microsoft',
  
  provider: 'DEEPSEEK',               // 'OPENAI' or 'DEEPSEEK'
  apiKey: 'your-api-key-here',        // Your AI API key
  trigger: '+ai',                     // Chat trigger
  
  webhook: {
    enabled: true,
    url: 'your-discord-webhook-url',  // Discord webhook (optional)
  }
};
```

## Usage

1. Start the bot:
```bash
node bot.js
```

2. On first run, a browser window will open for Microsoft authentication

3. Players can interact with the bot in-game:
```
<Player> +ai How do I craft a diamond sword?
[Bot whispers] To craft a diamond sword, you need...
```

## Configuration

### AI Settings
- `provider` - Choose `OPENAI` or `DEEPSEEK`
- `apiKey` - Your API key (keep this secret!)
- `trigger` - Chat prefix to activate the bot (default: `+ai`)
- `maxTokens` - Maximum response length (default: 500)
- `cooldown` - Seconds between requests per user (default: 5)
- `systemPrompt` - Bot personality/instructions

### Anti-AFK Settings
- `enabled` - Enable/disable anti-AFK movement
- `interval` - Movement frequency in milliseconds (default: 30000)
- `movementType` - Options:
  - `random` - Walks to random nearby positions
  - `circle` - Moves in a circular pattern
  - `jump` - Simply jumps in place

### Content Filter
- `contentFilter` - Enable/disable content filtering (default: true)
- Blocks requests and responses containing inappropriate content

### Webhook Logging
- `enabled` - Enable Discord logging
- `url` - Your Discord webhook URL
- `logAllMessages` - Log all server chat messages
- `logBotActions` - Log bot responses and system events

## Discord Webhook Setup

1. Go to your Discord server
2. Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL
5. Paste it into the config's `webhook.url` field

## API Costs

- **DeepSeek**: ~$0.14 per million input tokens, ~$0.28 per million output tokens
- **OpenAI GPT-3.5**: ~$0.50 per million input tokens, ~$1.50 per million output tokens

With default settings (500 max tokens), expect very low costs for casual use.

## Security Notes

⚠️ **Important:**
- Never commit your `apiKey` or webhook URL to version control
- Keep your API keys secret
- Content filter helps prevent API key bans
- Per-user cooldowns prevent abuse

## Troubleshooting

**"ECONNREFUSED" error:**
- Check that your server address and port are correct
- Ensure the Minecraft server is running

**Bot not responding:**
- Verify your API key is correct
- Check that the trigger prefix is being used
- Look for error messages in console

**Authentication issues:**
- Make sure you're using your Microsoft account email
- Clear cached credentials if needed

## Disclaimer

This bot is for educational purposes. Ensure you have permission to run bots on any server you connect to. Some servers prohibit bots in their terms of service.
