const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const CONFIG = {
  host: 'constantiam.net', //change this to your server ip
  port: 25565,
  username: 'email@emailprovider.com', // Your Microsoft/Minecraft account email
  auth: 'microsoft', // Premium account authentication
  version: false, // auto-detect
  
  provider: 'DEEPSEEK', // 'OPENAI' or 'DEEPSEEK'
  apiKey: '', // set this to your api key
  trigger: '+ai', // command prefix
  maxTokens: 500,
  cooldown: 5, // in seconds
  systemPrompt: 'you are an ai chatbot for a minecarft server!', //prompt, change this to your liking
  
  contentFilter: true, // so the cops dont pull up lol
  
  antiAfk: {
    enabled: true,
    interval: 10000, // Move every 30 seconds
    movementType: 'random' // 'random', 'circle', or 'jump'
  },
  

  webhook: {
    enabled: true,
    url: '', // your discord webhook url
    logAllMessages: true, // Log all chat messages
    logBotActions: true // Log bot responses and actions
  }
};

// add more if you use it
const BLOCKED_WORDS = [
  'hack', 'cheat', 'exploit', 'dupe', 'crash', 'ddos', 
  'illegal', 'nigger', 'faggot', 'jew', 'porn', 'nigga'
];

const userCooldowns = new Map();
let afkInterval = null;
let isProcessing = false;

const bot = mineflayer.createBot(CONFIG);


bot.loadPlugin(pathfinder);


bot.once('spawn', () => {
  console.log('Bot spawned successfully!');
  console.log(`Trigger: ${CONFIG.trigger}`);
  console.log(`Provider: ${CONFIG.provider}`);
  
  if (CONFIG.antiAfk.enabled) {
    startAntiAFK();
  }
  
  // Log spawn to webhook
  if (CONFIG.webhook.enabled && CONFIG.webhook.url) {
    logToWebhook('system', `✅ Bot connected as ${bot.username}`);
  }
});

bot.on('messagestr', async (message, messagePosition) => {
  // Log to webhook if enabled
  if (CONFIG.webhook.enabled && CONFIG.webhook.logAllMessages && CONFIG.webhook.url) {
    logToWebhook('chat', message, messagePosition);
  }
  
  // Only process chat messages (position 0)
  if (messagePosition !== 'chat') return;
  
  // Parse chat message: <username> message
  const chatPattern = /<([^>]+)>\s*(.+)/;
  const match = message.match(chatPattern);
  
  if (!match) return;
  
  const username = match[1];
  const content = match[2].trim();
  
  // Ignore own messages
  if (username === bot.username) return;
  
  // Check for trigger
  if (!content.toLowerCase().startsWith(CONFIG.trigger.toLowerCase())) return;
  
  const query = content.substring(CONFIG.trigger.length).trim();
  if (!query) return;
  
  // Check cooldown
  const now = Date.now();
  const lastRequest = userCooldowns.get(username);
  if (lastRequest && (now - lastRequest) < CONFIG.cooldown * 1000) {
    console.log(`Cooldown active for ${username}`);
    return;
  }
  
  // Filter check
  if (CONFIG.contentFilter && containsBlockedContent(query)) {
    console.log(`Blocked request from ${username}: contains filtered content`);
    return;
  }
  
  userCooldowns.set(username, now);
  console.log(`Processing AI request from ${username}: ${query}`);
  
  // Process request
  await processAIRequest(username, query);
});

bot.on('error', (err) => {
  console.error('Bot error:', err);
  if (CONFIG.webhook.enabled && CONFIG.webhook.url) {
    logToWebhook('system', `❌ Bot error: ${err.message}`);
  }
});

bot.on('kicked', (reason) => {
  console.log('Bot kicked:', reason);
  if (CONFIG.webhook.enabled && CONFIG.webhook.url) {
    logToWebhook('system', `⚠️ Bot kicked: ${reason}`);
  }
});

bot.on('end', () => {
  console.log('Bot disconnected');
  if (afkInterval) clearInterval(afkInterval);
  if (CONFIG.webhook.enabled && CONFIG.webhook.url) {
    logToWebhook('system', `🔴 Bot disconnected`);
  }
});


function startAntiAFK() {
  console.log('Anti-AFK enabled');
  
  afkInterval = setInterval(() => {
    if (isProcessing || !bot.entity) return;
    
    try {
      const type = CONFIG.antiAfk.movementType;
      
      if (type === 'jump') {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 100);
      } else if (type === 'random') {
        const distance = Math.random() * 3 + 1;
        const angle = Math.random() * Math.PI * 2;
        const x = bot.entity.position.x + Math.cos(angle) * distance;
        const z = bot.entity.position.z + Math.sin(angle) * distance;
        const y = bot.entity.position.y;
        
        const mcData = require('minecraft-data')(bot.version);
        const defaultMove = new Movements(bot, mcData);
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 1));
        
        setTimeout(() => bot.pathfinder.setGoal(null), 2000);
      } else if (type === 'circle') {
        const radius = 2;
        const speed = 0.1;
        const angle = (Date.now() * speed) % (Math.PI * 2);
        const x = bot.entity.position.x + Math.cos(angle) * radius;
        const z = bot.entity.position.z + Math.sin(angle) * radius;
        const y = bot.entity.position.y;
        
        const mcData = require('minecraft-data')(bot.version);
        const defaultMove = new Movements(bot, mcData);
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 0.5));
      }
    } catch (err) {
      console.error('Anti-AFK error:', err.message);
    }
  }, CONFIG.antiAfk.interval);
}


function containsBlockedContent(text) {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word));
}


async function processAIRequest(username, query) {
  isProcessing = true;
  
  try {
    const response = await callAI(query);
    
    if (!response) {
      console.warn('Empty response from AI');
      return;
    }
    
 
    if (CONFIG.contentFilter && containsBlockedContent(response)) {
      console.warn('AI response contained filtered content, not sending');
      return;
    }
    

    let cleanResponse = response.replace(/\n/g, ' ').trim();
    if (cleanResponse.length > 200) {
      cleanResponse = cleanResponse.substring(0, 197) + '...';
    }
    

    bot.whisper(username, cleanResponse);
    console.log(`Sent to ${username}: ${cleanResponse}`);
    
    // Log bot action to webhook
    if (CONFIG.webhook.enabled && CONFIG.webhook.logBotActions && CONFIG.webhook.url) {
      logToWebhook('bot_response', `Whispered to ${username}: ${cleanResponse}`);
    }
    
  } catch (err) {
    console.error('AI request failed:', err.message);
  } finally {
    isProcessing = false;
  }
}


async function callAI(query) {
  if (!CONFIG.apiKey) {
    throw new Error('API key not configured');
  }
  
  const url = CONFIG.provider === 'OPENAI' 
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.deepseek.com/chat/completions';
    
  const model = CONFIG.provider === 'OPENAI' 
    ? 'gpt-3.5-turbo' 
    : 'deepseek-chat';
  
  const body = {
    model: model,
    max_tokens: CONFIG.maxTokens,
    messages: [
      { role: 'system', content: CONFIG.systemPrompt },
      { role: 'user', content: query }
    ]
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.apiKey}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}


async function logToWebhook(type, message, extra = '') {
  if (!CONFIG.webhook.url) return;
  
  try {
    const timestamp = new Date().toISOString();
    let embed;
    
    if (type === 'chat') {
      embed = {
        title: '💬 Chat Message',
        description: message,
        color: 3447003, // Blue
        footer: { text: `Position: ${extra}` },
        timestamp: timestamp
      };
    } else if (type === 'bot_response') {
      embed = {
        title: '🤖 Bot Response',
        description: message,
        color: 5763719, // Green
        timestamp: timestamp
      };
    } else if (type === 'system') {
      embed = {
        title: '⚙️ System',
        description: message,
        color: 15158332, // Red
        timestamp: timestamp
      };
    }
    
    const payload = {
      username: 'Starrydev's bot logger',
      embeds: [embed]
    };
    
    await fetch(CONFIG.webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Webhook error:', err.message);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  if (afkInterval) clearInterval(afkInterval);
  bot.quit();
  process.exit(0);
});

console.log('(made by starry) Starting bot...');
console.log('Press Ctrl+C to stop');
