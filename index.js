require('dotenv').config();

const {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
  PresenceUpdateStatus,
  Events,
  MessageFlags,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
});

const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

const deployCommands = async () => {
  try {
    const commands = [];
    const commandFiles = fs
      .readdirSync(path.join(__dirname, 'commands'))
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `WARNING: The command at ${file} is missing a required 'data' or 'execute' property.`
        );
      }
    }
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    console.log(`Started refreshing ${commands.length} application slash command(s) globally.`);
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
    );
    console.log(`Succesfully reloaded all commands!`);
  } catch (error) {
    console.log('Error deplying commands: ', error);
  }
};

client.commands = new Collection();

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`The Command ${filePath} is missing a required 'data' or 'execute' property.`);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  //Deploying Commands
  await deployCommands();
  console.log(`Commands deployed globally.`);
  const statusType = process.env.BOT_STATUS || 'online';
  const activityType = process.env.ACTIVITY_TYPE || 'PLAYING';
  const activityName = process.env.ACTIVITY_NAME || 'Discord';

  const activityTypeMap = {
    PLAYING: ActivityType.Playing,
    WATCHING: ActivityType.Watching,
    LISTENING: ActivityType.Listening,
    STREAMIMG: ActivityType.Streaming,
    COMPETING: ActivityType.Competing,
  };

  const statusMap = {
    online: PresenceUpdateStatus.Online,
    idle: PresenceUpdateStatus.Idle,
    dnd: PresenceUpdateStatus.DoNotDisturb,
    invisible: PresenceUpdateStatus.Invisible,
  };

  client.user.setPresence({
    status: statusMap[statusType],
    activities: [
      {
        name: activityName,
        type: activityTypeMap[activityType],
      },
    ],
  });
  console.log(`Bot status set to: ${statusType}`);
  console.log(`Activity set to: ${activityType} ${activityName}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`No command matching ${interaction.commandName} was not found.`);
    return;
  }

  try {
    const allowedCategories = [
      '1334917967678406729', // PXL-Esports category
      '1407099025798463508' // Bot Torture Center category
    ];
    if (!allowedCategories.includes(interaction.channel.parentId)) {
      return interaction.reply({
        content: `There was an error while executing this command!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await command.execute(interaction);
  } catch (error) {
    console.log(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: `There was an error while executing this command!`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: `There was an error while executing this command!`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);