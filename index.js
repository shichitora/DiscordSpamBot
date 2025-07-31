import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { REST, Routes } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { setInterval } from 'node:timers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands/utility');
const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.mjs'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  client.commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: 'コマンドが見つかりません。', ephemeral: true }).catch(() => {});
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      } else {
        await interaction.followUp({ content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      }
    }
  }
});

client.on(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [];
  for (const command of client.commands.values()) {
    commands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(config.token);
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commands
    });
    console.log('Successfully reloaded application (/) commands globally.');
  } catch (error) {
    console.error(error);
  }
});

client.login(config.token);
