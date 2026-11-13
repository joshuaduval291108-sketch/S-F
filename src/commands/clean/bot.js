// Bot Discord - commande /clean (supprime tous les messages et remet le salon à zéro)
// Prérequis : Node.js 18+ et `npm install`
// Lancer avec : npm start

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN || 'COLLE_TON_TOKEN_ICI';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Une seule commande : /clean
const commands = [
  new SlashCommandBuilder()
    .setName('clean')
    .setDescription('Supprime tous les messages et remet le salon à zéro')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .toJSON(),
];

client.once('ready', async () => {
  // .set() remplace toutes les commandes existantes : l'ancienne /clear est supprimée
  await client.application.commands.set(commands);
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'clean') return;

  const channel = interaction.channel;

  if (channel.type !== ChannelType.GuildText) {
    return interaction.reply({
      content: '❌ Cette commande fonctionne uniquement dans un salon textuel.',
      ephemeral: true,
    });
  }

  const botPerms = channel.permissionsFor(interaction.guild.members.me);
  if (!botPerms.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: '❌ Il me manque la permission « Gérer les salons ».',
      ephemeral: true,
    });
  }

  await interaction.reply({ content: '🧹 Remise à zéro du salon...', ephemeral: true });

  try {
    const reason = `Clean par ${interaction.user.tag}`;

    // Clone le salon (même nom, permissions, sujet...) puis supprime l'ancien :
    // tous les messages disparaissent, même ceux de plus de 14 jours.
    const newChannel = await channel.clone({ reason });
    await newChannel.setPosition(channel.position);
    await channel.delete(reason);

    await newChannel.send(`✅ Salon remis à zéro par ${interaction.user}.`);
  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
